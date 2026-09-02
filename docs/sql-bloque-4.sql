-- ---------------------------------------------------------------------
-- ApoyaClub — BLOQUE 4 de 4: emails, métricas, plantillas, servicios y plazas.
--
-- Pegar en Supabase -> SQL Editor -> New query -> Run, en orden.
-- Se puede repetir sin romper nada.
-- ---------------------------------------------------------------------


-- ===== 0013_emails_del_ciclo.sql =====

-- ---------------------------------------------------------------------
-- Emails del ciclo de vida.
--
-- Hasta ahora solo salían tres emails: nueva solicitud al club, aviso de
-- caducidad tras cancelar, y el formulario de contacto de la landing.
-- Faltaban justo los que sostienen la retención:
--
--   - bienvenida cuando alguien confirma su cuenta,
--   - aviso a la empresa cuando el club responde a su solicitud,
--   - recordatorio al club de solicitudes sin abrir a las 48 horas,
--   - aviso de fin de la prueba gratuita (el anterior solo avisaba a
--     quien ya había cancelado).
--
-- Todo lo que se envía una sola vez se apunta aquí para no repetirlo.
-- ---------------------------------------------------------------------

create table if not exists public.email_log (
  user_id uuid not null,
  -- 'welcome_club', 'welcome_empresa', 'trial_3d', 'trial_1d'…
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.email_log enable row level security;

comment on table public.email_log is
  'Emails de una sola vez ya enviados a un usuario (bienvenida, avisos de fin de prueba). Solo lo escribe el servidor con la clave de servicio: RLS activa y sin políticas.';

create index if not exists email_log_kind_idx on public.email_log (kind, sent_at desc);

-- El recordatorio de solicitud sin abrir es por solicitud, no por
-- usuario, así que vive en la propia fila.
alter table public.contact_requests
  add column if not exists unread_reminder_sent_at timestamptz;

comment on column public.contact_requests.unread_reminder_sent_at is
  'Cuándo se recordó al club que esta solicitud seguía sin abrir (48 h). Null = todavía no se ha recordado.';

create index if not exists contact_requests_sin_abrir_idx
  on public.contact_requests (created_at)
  where status = 'new' and unread_reminder_sent_at is null;


-- ===== 0014_metricas_del_club.sql =====

-- ---------------------------------------------------------------------
-- Métricas del club: qué recibe a cambio de sus 29,90 €.
--
-- El riesgo del negocio no es que un club no se registre, es que pague
-- tres meses, no vea nada y se dé de baja. La plataforma ya sabía
-- cuántas búsquedas se hacían (`search_logs`, Fase 12), pero el club no
-- veía nada de eso: ni cuántas veces había aparecido, ni cuántas visitas
-- tenía su página.
--
-- Tres tablas de eventos, deliberadamente tontas (una fila por evento,
-- sin datos personales ni de sesión): así se puede contar por periodos
-- sin tener que decidir hoy qué agregados harán falta mañana.
-- ---------------------------------------------------------------------

-- 1. Visitas a la página pública del club.
create table if not exists public.club_page_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_page_views_club_idx
  on public.club_page_views (club_id, created_at desc);

alter table public.club_page_views enable row level security;

comment on table public.club_page_views is
  'Una fila por visita a /club/[slug]. Sin IP ni identificador de usuario: solo el club y la fecha. Se deduplica por IP y hora antes de insertar (lib/rate-limit).';

-- 2. Apariciones del club en resultados de búsqueda.
create table if not exists public.club_search_appearances (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_search_appearances_club_idx
  on public.club_search_appearances (club_id, created_at desc);

alter table public.club_search_appearances enable row level security;

comment on table public.club_search_appearances is
  'Una fila por cada vez que una oportunidad del club sale en la primera página de una búsqueda.';

-- 3. Aperturas del dossier compartido por enlace público.
create table if not exists public.dossier_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists dossier_views_club_idx
  on public.dossier_views (club_id, created_at desc);

alter table public.dossier_views enable row level security;

comment on table public.dossier_views is
  'Una fila por apertura del enlace público del dossier de un club.';

-- Las tres las escribe y las lee el servidor con la clave de servicio
-- (RLS activa y sin políticas): el club ve sus números ya agregados en
-- el panel, no la tabla de eventos.


-- ===== 0015_plantillas_oportunidad.sql =====

-- ---------------------------------------------------------------------
-- Plantillas de oportunidad en base de datos.
--
-- Hasta ahora eran una lista fija dentro de `lib/opportunities.ts`: para
-- añadir una idea nueva había que tocar el código y desplegar, y las
-- buenas ideas de un club no le servían a nadie más.
--
-- La tabla nace con las mismas plantillas que había (created_by null =
-- plantilla de la plataforma) y deja la puerta abierta a que un club
-- comparta las suyas.
-- ---------------------------------------------------------------------

create table if not exists public.opportunity_templates (
  id uuid primary key default gen_random_uuid(),
  opportunity_type text not null check (
    opportunity_type in (
      'equipment',
      'venue_matches',
      'social_content',
      'events_tournaments',
      'youth',
      'in_kind'
    )
  ),
  title text not null,
  description text,
  -- Club que la compartió. Null = plantilla de la propia plataforma.
  created_by uuid references public.clubs (id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.opportunity_templates is
  'Plantillas para crear una oportunidad sin partir de cero. created_by null = las de la plataforma; con valor = las que ha compartido un club.';

-- Sin duplicados: ni dos plantillas iguales de la plataforma, ni que un
-- club comparta dos veces la misma.
create unique index if not exists opportunity_templates_plataforma_idx
  on public.opportunity_templates (opportunity_type, title)
  where created_by is null;

create unique index if not exists opportunity_templates_club_idx
  on public.opportunity_templates (created_by, opportunity_type, title)
  where created_by is not null;

create index if not exists opportunity_templates_publicas_idx
  on public.opportunity_templates (opportunity_type)
  where is_public;

alter table public.opportunity_templates enable row level security;

-- Cualquier club con sesión ve las públicas y siempre las suyas.
drop policy if exists "opportunity_templates_select" on public.opportunity_templates;
create policy "opportunity_templates_select"
  on public.opportunity_templates for select
  to authenticated
  using (is_public or created_by = auth.uid());

-- Un club solo puede compartir plantillas a su nombre, y retirarlas.
drop policy if exists "opportunity_templates_insert_own" on public.opportunity_templates;
create policy "opportunity_templates_insert_own"
  on public.opportunity_templates for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "opportunity_templates_delete_own" on public.opportunity_templates;
create policy "opportunity_templates_delete_own"
  on public.opportunity_templates for delete
  to authenticated
  using (created_by = auth.uid());

-- Las mismas plantillas que estaban escritas en el código.
insert into public.opportunity_templates (opportunity_type, title, description) values
  ('equipment', 'Patrocinador de la camiseta principal', 'Tu logo en la parte delantera de la camiseta del primer equipo durante toda la temporada.'),
  ('equipment', 'Camiseta de entrenamiento de la cantera', 'Tu marca en las camisetas de entrenamiento de uno o varios equipos de cantera.'),
  ('equipment', 'Patrocinador del chándal o la bolsa de deporte', 'Tu logo en el chándal, la bolsa o la equipación de calle del equipo.'),
  ('venue_matches', 'Patrocinio del descanso de los partidos de casa', 'Mención y presencia de tu marca durante el descanso de cada partido que el club juega en casa.'),
  ('venue_matches', 'Naming del pabellón o campo', 'Tu marca en el nombre del recinto deportivo del club durante la temporada.'),
  ('venue_matches', 'Publicidad estática en el terreno de juego', 'Una valla o lona con tu marca visible durante los partidos de casa.'),
  ('social_content', 'Marca patrocinadora en redes sociales', 'Menciones y tu logo en las publicaciones del club durante toda la temporada.'),
  ('social_content', 'Vídeo o reel patrocinado', 'Una pieza de contenido en redes dedicada a presentar tu marca a la comunidad del club.'),
  ('events_tournaments', 'Patrocinador oficial de un torneo', 'Tu marca asociada a un torneo o evento puntual organizado por el club.'),
  ('events_tournaments', 'Photocall con tu marca en la presentación de la temporada', 'Presencia de tu marca en el evento de presentación de equipos ante la afición.'),
  ('youth', 'Equipación de un equipo de cantera', 'Patrocinio íntegro de un equipo de las categorías inferiores del club.'),
  ('youth', 'Beca deportiva para familias de la cantera', 'Ayuda a que una familia pueda mantener a su hijo o hija en el club durante la temporada.'),
  ('in_kind', 'Colaboración en especie con material deportivo', 'Aportación de material, equipación o productos en lugar de una aportación económica.'),
  ('in_kind', 'Servicios profesionales para el club', 'Un servicio (fisioterapia, transporte, catering, imprenta…) a cambio de visibilidad para tu marca.')
on conflict do nothing;


-- ===== 0016_servicios_que_busca_el_club.sql =====

-- ---------------------------------------------------------------------
-- Servicios que el club necesita.
--
-- Hasta ahora la plataforma solo contemplaba una dirección: el club
-- ofrece visibilidad y la empresa paga por ella. Pero un club también
-- necesita cosas —fisioterapia, transporte, imprenta, comidas de
-- equipo— y hay muchas empresas pequeñas que no tienen presupuesto de
-- patrocinio pero sí un servicio que ofrecer a cambio de visibilidad.
--
-- Ese es el camino de entrada más fácil para una empresa local, y es
-- una de las ideas originales del proyecto que se había quedado fuera.
-- ---------------------------------------------------------------------

create table if not exists public.club_service_needs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  -- Categoría del catálogo (ver `lib/service-needs.ts`): salud,
  -- transporte, hosteleria, material, imprenta, formacion, otros.
  category text not null,
  title text not null,
  description text,

  -- 'open' = lo sigue buscando; 'covered' = ya lo tiene cubierto.
  status text not null default 'open' check (status in ('open', 'covered')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_service_needs_club_idx on public.club_service_needs (club_id);
create index if not exists club_service_needs_abiertos_idx
  on public.club_service_needs (category)
  where status = 'open';

drop trigger if exists set_club_service_needs_updated_at on public.club_service_needs;
create trigger set_club_service_needs_updated_at
  before update on public.club_service_needs
  for each row execute function public.set_updated_at();

alter table public.club_service_needs enable row level security;

-- El club gestiona los suyos.
drop policy if exists "club_service_needs_select_own" on public.club_service_needs;
create policy "club_service_needs_select_own"
  on public.club_service_needs for select
  using (auth.uid() = club_id);

drop policy if exists "club_service_needs_insert_own" on public.club_service_needs;
create policy "club_service_needs_insert_own"
  on public.club_service_needs for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_service_needs_update_own" on public.club_service_needs;
create policy "club_service_needs_update_own"
  on public.club_service_needs for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_service_needs_delete_own" on public.club_service_needs;
create policy "club_service_needs_delete_own"
  on public.club_service_needs for delete
  using (auth.uid() = club_id);

-- ---------------------------------------------------------------------
-- Vista pública: lo que ve una empresa sin sesión.
--
-- Mismo criterio que las demás vistas públicas (migración 0012): solo
-- clubes con suscripción activa o en prueba y no suspendidos, y solo las
-- necesidades que siguen abiertas. Es una proyección recortada, por eso
-- es SECURITY DEFINER y las tablas base siguen cerradas a `anon`.
-- ---------------------------------------------------------------------
-- Se borra antes de recrearla: `create or replace view` no permite
-- cambiar el orden de las columnas, y aquí se añaden en medio.
drop view if exists public.club_service_needs_public cascade;

create or replace view public.club_service_needs_public as
select
  n.id,
  n.club_id,
  n.category,
  n.title,
  n.description,
  n.created_at,
  c.slug as club_slug,
  c.name as club_name,
  c.city as club_city,
  c.province as club_province,
  c.logo_url as club_logo_url
from public.club_service_needs n
join public.clubs c on c.id = n.club_id
where n.status = 'open'
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.club_service_needs_public is
  'Servicios que buscan los clubes visibles (/servicios y la ficha del club). Solo necesidades abiertas de clubes con suscripción activa o en prueba y no suspendidos.';

grant select on public.club_service_needs_public to anon, authenticated;


-- ===== 0017_oportunidades_por_plazas.sql =====

-- ---------------------------------------------------------------------
-- Oportunidades repartidas entre varias empresas.
--
-- La idea original del proyecto: un evento con un coste total que se
-- reparte entre varios patrocinadores. "Buscamos 10 empresas que pongan
-- 100 € cada una para el torneo de Navidad; cada una sale en la lona, en
-- el cartel y en redes". Hasta ahora una oportunidad solo podía cerrarse
-- con una empresa, así que estas se publicaban a mano o no se publicaban.
--
-- Deliberadamente sin automatismos: la plataforma no reserva plazas ni
-- cobra nada. El club marca cuántas lleva cubiertas, igual que marca una
-- oportunidad como reservada o cerrada.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists slots_total integer,
  add column if not exists slots_taken integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_slots_check') then
    alter table public.opportunities
      add constraint opportunities_slots_check
      check (
        (slots_total is null and slots_taken = 0)
        or (slots_total >= 2 and slots_taken >= 0 and slots_taken <= slots_total)
      );
  end if;
end $$;

comment on column public.opportunities.slots_total is
  'Número de patrocinadores que busca esta oportunidad. Null = un único patrocinador (el caso normal). A partir de 2, se muestra como plazas y el valor es lo que aporta cada empresa.';
comment on column public.opportunities.slots_taken is
  'Plazas ya cubiertas, que lleva el club a mano. La plataforma no reserva ni cobra nada.';

-- La vista del buscador expone las dos columnas (al final, que es lo
-- único que permite `create or replace view`).
-- Se borra antes de recrearla: `create or replace view` no permite
-- cambiar el orden de las columnas, y aquí se añaden en medio.
drop view if exists public.opportunity_search_view cascade;

create or replace view public.opportunity_search_view as
select
  o.id as opportunity_id,
  o.club_id,
  o.title,
  o.description,
  o.opportunity_type,
  o.value,
  o.duration,
  o.period,
  o.collaboration_type,
  o.objectives,
  o.created_at as opportunity_created_at,
  c.slug as club_slug,
  c.name as club_name,
  c.city as club_city,
  c.province as club_province,
  c.postal_code as club_postal_code,
  c.logo_url as club_logo_url,
  c.latitude as club_latitude,
  c.longitude as club_longitude,
  o.sponsor_level,
  o.exclusivity,
  o.team_id,
  t.sport as team_sport,
  t.category as team_category,
  t.gender as team_gender,
  t.team_level as team_level,
  o.slots_total,
  o.slots_taken
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

grant select on public.opportunity_search_view to anon, authenticated;
