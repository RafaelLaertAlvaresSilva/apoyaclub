-- ---------------------------------------------------------------------
-- ApoyaClub: migraciones 0018 a 0028, para una base de datos que ya
-- tiene aplicadas las 0001-0017. Se puede repetir sin romper nada.
-- ---------------------------------------------------------------------


-- =====================================================================
-- 0018_mes_gratis_sin_tarjeta.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- El mes gratis empieza al crear el club, sin pasar por Stripe.
--
-- Hasta ahora `subscription_status` se quedaba en null hasta que el club
-- pasaba por el checkout, y las vistas públicas solo muestran clubes en
-- prueba o activos. Resultado: un club recién registrado no aparecía ni
-- en su propia página ni en el buscador, y para verse tenía que poner
-- una tarjeta. Justo lo contrario de lo que dice la oferta ("1 mes
-- gratis") y de lo que hace falta para enseñárselo a los primeros
-- clubes.
--
-- Con esto, al crearse la ficha del club empieza su mes de prueba. Si
-- después se suscribe, el webhook de Stripe manda: escribe el estado
-- real de la suscripción encima.
-- ---------------------------------------------------------------------

create or replace function public.iniciar_prueba_gratuita()
returns trigger
language plpgsql
as $$
begin
  -- Solo si nadie ha dicho lo contrario: si la fila llega ya con estado
  -- (por ejemplo desde el webhook de Stripe o desde los datos de
  -- prueba), se respeta tal cual.
  if new.subscription_status is null then
    new.subscription_status := 'trialing';
    new.trial_ends_at := coalesce(new.trial_ends_at, now() + interval '30 days');
    new.current_period_end := coalesce(new.current_period_end, new.trial_ends_at);
  end if;

  return new;
end;
$$;

comment on function public.iniciar_prueba_gratuita() is
  'Arranca el mes gratis al crear la ficha de un club, sin tarjeta ni Stripe (migración 0018).';

drop trigger if exists clubs_iniciar_prueba on public.clubs;
create trigger clubs_iniciar_prueba
  before insert on public.clubs
  for each row execute function public.iniciar_prueba_gratuita();

-- Los clubes que ya existían sin estado también entran en su mes
-- gratis: hasta ahora estaban invisibles sin saberlo.
update public.clubs
   set subscription_status = 'trialing',
       trial_ends_at = coalesce(trial_ends_at, now() + interval '30 days'),
       current_period_end = coalesce(current_period_end, now() + interval '30 days')
 where subscription_status is null;


-- =====================================================================
-- 0019_patrocinadores_clasificados.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Patrocinadores actuales del club: categoría, texto y orden.
--
-- Hasta ahora `club_sponsors` solo guardaba nombre, logo y web. Eso
-- basta para una lista, pero no para lo que de verdad hace falta:
--
--   1. Que el club pueda enseñar su "muro de patrocinadores" agrupado
--      por importancia (principal, oficial, colaborador), igual que
--      aparece en una lona o en un dossier de verdad.
--   2. Que pueda escribir dos líneas sobre cada empresa — desde cuándo
--      colabora, qué aporta — que es lo que convierte un logo suelto en
--      una prueba social utilizable.
--
-- Esto además alimenta la estrategia de arranque: cada club que sube a
-- sus patrocinadores actuales mete en la plataforma empresas reales que
-- ya han patrocinado deporte, sin coste de captación.
--
-- Los cuatro niveles son los mismos que ya usa `opportunities.sponsor_level`
-- (migración 0011) para que la ficha del club y sus oportunidades hablen
-- el mismo idioma, más un nivel libre con etiqueta propia para el club
-- que use otra nomenclatura ("Patrocinador técnico", "Proveedor oficial").
-- ---------------------------------------------------------------------

alter table public.club_sponsors
  add column if not exists tier text not null default 'colaborador',
  add column if not exists tier_label text,
  add column if not exists description text,
  add column if not exists since_year int,
  add column if not exists sort_order int not null default 0;

-- Nivel dentro de un catálogo cerrado. 'otro' es la vía de escape: el
-- club escribe su propia etiqueta en `tier_label`.
alter table public.club_sponsors drop constraint if exists club_sponsors_tier_check;
alter table public.club_sponsors
  add constraint club_sponsors_tier_check
  check (tier in ('principal', 'oficial', 'colaborador', 'otro'));

-- La etiqueta libre solo tiene sentido en el nivel 'otro', y ahí es
-- obligatoria: un nivel "otro" sin nombre no se puede pintar.
alter table public.club_sponsors drop constraint if exists club_sponsors_tier_label_check;
alter table public.club_sponsors
  add constraint club_sponsors_tier_label_check
  check (
    (tier = 'otro' and tier_label is not null and length(btrim(tier_label)) between 1 and 40)
    or (tier <> 'otro' and tier_label is null)
  );

alter table public.club_sponsors drop constraint if exists club_sponsors_description_check;
alter table public.club_sponsors
  add constraint club_sponsors_description_check
  check (description is null or length(description) <= 400);

alter table public.club_sponsors drop constraint if exists club_sponsors_since_year_check;
alter table public.club_sponsors
  add constraint club_sponsors_since_year_check
  check (since_year is null or since_year between 1900 and 2100);

comment on column public.club_sponsors.tier is
  'Categoría del patrocinador: principal, oficial, colaborador u otro (etiqueta libre en tier_label).';
comment on column public.club_sponsors.tier_label is
  'Etiqueta propia del club cuando tier = ''otro'' (ej. "Patrocinador técnico"). Null en el resto de niveles.';
comment on column public.club_sponsors.description is
  'Dos líneas sobre la colaboración, escritas por el club. Se enseñan en la ficha pública.';
comment on column public.club_sponsors.since_year is
  'Año en que empezó a patrocinar, opcional. "Con nosotros desde 2019" vale más que un logo suelto.';
comment on column public.club_sponsors.sort_order is
  'Orden manual dentro de su categoría. A igualdad, se ordena por fecha de alta.';

-- Orden de pintado: primero por categoría, luego por el orden que haya
-- decidido el club. El índice cubre la consulta de la ficha pública.
create index if not exists club_sponsors_orden_idx
  on public.club_sponsors (club_id, tier, sort_order, created_at);

-- No hay cambios de RLS: las políticas de 0001 (el club gestiona los
-- suyos) y la de lectura pública de 0002 siguen valiendo tal cual,
-- porque son a nivel de fila y estas columnas van dentro de la fila.


-- =====================================================================
-- 0020_visibilidad_por_perfil_completo.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- La información completa da visibilidad.
--
-- Hasta ahora el porcentaje de perfil completado se calculaba en el
-- código de la app y solo servía para pintar una barra en el panel: era
-- un adorno. El club no tenía ningún motivo real para terminar su ficha.
--
-- Aquí ese porcentaje pasa a vivir en la base de datos (`clubs.profile_score`),
-- se mantiene solo mediante triggers, y entra en el orden del buscador:
-- a igualdad de todo lo demás, sale antes el club que ha contado más
-- cosas de sí mismo. Es lo que hace verdad la frase que se le enseña al
-- club: "cuanta más información, más visibilidad".
--
-- Se calcula como la media del progreso de ocho secciones, para que
-- ninguna pese más que las demás: un club con veinte fotos y nada más no
-- adelanta a uno que ha rellenado cantera, audiencia y patrocinadores.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists profile_score int not null default 0;

comment on column public.clubs.profile_score is
  'Porcentaje (0-100) de ficha rellenada. Lo mantienen triggers; es la única definición del dato, la usan tanto el panel del club como el orden del buscador.';

-- ---------------------------------------------------------------------
-- 1. Cálculo
-- ---------------------------------------------------------------------
create or replace function public.calcular_profile_score(p_club_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with club as (
    select * from public.clubs where id = p_club_id
  ),
  secciones as (
    select unnest(array[
      -- 1. Identidad: quién es y qué cara tiene.
      (
        (c.logo_url is not null)::int +
        (coalesce(array_length(c.photo_urls, 1), 0) > 0)::int +
        (c.video_url is not null)::int +
        (c.description is not null)::int +
        (c.website is not null)::int +
        (c.social_links <> '{}'::jsonb)::int
      )::numeric / 6,
      -- 2. Nivel deportivo.
      (
        (c.top_category is not null)::int +
        (c.competitions is not null)::int +
        (c.achievements is not null)::int
      )::numeric / 3,
      -- 3. Equipos.
      (exists (select 1 from public.club_teams t where t.club_id = c.id))::int::numeric,
      -- 4. Cantera.
      (
        (c.youth_teams_count is not null)::int +
        (c.youth_players_count is not null)::int +
        (c.youth_families_count is not null)::int
      )::numeric / 3,
      -- 5. Historia.
      (
        (c.founding_year is not null)::int +
        (c.milestones <> '[]'::jsonb)::int
      )::numeric / 2,
      -- 6. Audiencia.
      (
        (c.followers_by_network <> '{}'::jsonb)::int +
        (c.estimated_reach is not null)::int +
        (c.average_attendance is not null)::int
      )::numeric / 3,
      -- 7. Comunidad.
      (c.community_actions <> '[]'::jsonb)::int::numeric,
      -- 8. Patrocinadores actuales.
      (exists (select 1 from public.club_sponsors s where s.club_id = c.id))::int::numeric
    ]) as fraccion
    from club c
  )
  select coalesce(round(avg(fraccion) * 100)::int, 0) from secciones;
$$;

comment on function public.calcular_profile_score(uuid) is
  'Media del progreso de las ocho secciones de la ficha, en porcentaje entero.';

-- ---------------------------------------------------------------------
-- 2. Mantenimiento automático
-- ---------------------------------------------------------------------

-- a) Cuando cambia la propia fila del club, se recalcula antes de
--    escribirla: así el valor viaja en el mismo UPDATE y no hace falta
--    una segunda escritura (que además reentraría en el trigger).
create or replace function public.refrescar_profile_score_propio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.profile_score := (
    select coalesce(round(avg(fraccion) * 100)::int, 0)
    from unnest(array[
      (
        (new.logo_url is not null)::int +
        (coalesce(array_length(new.photo_urls, 1), 0) > 0)::int +
        (new.video_url is not null)::int +
        (new.description is not null)::int +
        (new.website is not null)::int +
        (new.social_links <> '{}'::jsonb)::int
      )::numeric / 6,
      (
        (new.top_category is not null)::int +
        (new.competitions is not null)::int +
        (new.achievements is not null)::int
      )::numeric / 3,
      (exists (select 1 from public.club_teams t where t.club_id = new.id))::int::numeric,
      (
        (new.youth_teams_count is not null)::int +
        (new.youth_players_count is not null)::int +
        (new.youth_families_count is not null)::int
      )::numeric / 3,
      (
        (new.founding_year is not null)::int +
        (new.milestones <> '[]'::jsonb)::int
      )::numeric / 2,
      (
        (new.followers_by_network <> '{}'::jsonb)::int +
        (new.estimated_reach is not null)::int +
        (new.average_attendance is not null)::int
      )::numeric / 3,
      (new.community_actions <> '[]'::jsonb)::int::numeric,
      (exists (select 1 from public.club_sponsors s where s.club_id = new.id))::int::numeric
    ]) as fraccion
  );
  return new;
end;
$$;

drop trigger if exists clubs_refrescar_score on public.clubs;
create trigger clubs_refrescar_score
  before insert or update on public.clubs
  for each row execute function public.refrescar_profile_score_propio();

-- b) Cuando cambian las tablas hijas, se recalcula la fila del club.
create or replace function public.refrescar_profile_score_del_padre()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid := coalesce(new.club_id, old.club_id);
begin
  update public.clubs
     set profile_score = public.calcular_profile_score(v_club_id)
   where id = v_club_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists club_teams_refrescar_score on public.club_teams;
create trigger club_teams_refrescar_score
  after insert or delete on public.club_teams
  for each row execute function public.refrescar_profile_score_del_padre();

drop trigger if exists club_sponsors_refrescar_score on public.club_sponsors;
create trigger club_sponsors_refrescar_score
  after insert or delete on public.club_sponsors
  for each row execute function public.refrescar_profile_score_del_padre();

-- c) Puesta al día de lo que ya existe.
update public.clubs set profile_score = public.calcular_profile_score(id);

-- ---------------------------------------------------------------------
-- 3. El buscador lo tiene en cuenta
-- ---------------------------------------------------------------------
-- Se añade la columna a la vista pública de búsqueda para poder ordenar
-- por ella. Se redondea a decenas al ordenar (en el código de la app),
-- no aquí: así un 71 % y un 78 % se consideran iguales y desempata la
-- novedad, en vez de premiar diferencias que no significan nada.
drop view if exists public.opportunity_search_view cascade;

create view public.opportunity_search_view as
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
  o.slots_taken,
  c.profile_score as club_profile_score,
  -- Redondeo a decenas: un 71 % y un 78 % se consideran igual de
  -- completos y desempata la novedad. Así el orden premia terminar
  -- secciones, no rellenar un campo suelto para adelantar a otro club.
  (c.profile_score / 10) as club_visibility_bucket
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.opportunity_search_view is
  'Oportunidades visibles en el buscador, con los datos del club ya unidos. SECURITY DEFINER a propósito (ver 0012): expone solo columnas públicas de `clubs`.';

grant select on public.opportunity_search_view to anon, authenticated;

-- Índice para el orden por visibilidad del buscador.
create index if not exists clubs_profile_score_idx on public.clubs (profile_score desc);


-- =====================================================================
-- 0021_planes_de_precio.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Tres planes en vez de uno.
--
-- Hasta ahora solo existía la cuota mensual de 29,90 €. El problema no
-- es el precio (es el más bajo del mercado español de software para
-- clubes), sino el ritmo de cobro: el patrocinio es estacional y una
-- junta directiva aprueba gastos una vez al año, no cada mes. Un club
-- que paga mes a mes se da de baja en enero, cuando no está buscando
-- patrocinadores.
--
--   mensual    29,90 €/mes  IVA incl.  — sigue existiendo
--   temporada  249 €/año    IVA incl.  — el que se quiere vender
--   fundador   199 €/año    IVA incl.  — solo las 50 primeras plazas,
--                                        precio congelado de por vida
--
-- El plan se guarda aquí, no solo en Stripe, porque hace falta para el
-- área financiera del administrador y para saber cuántas plazas de
-- fundador quedan sin tener que preguntárselo a Stripe en cada visita.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists plan text,
  add column if not exists founder_number int;

alter table public.clubs drop constraint if exists clubs_plan_check;
alter table public.clubs
  add constraint clubs_plan_check
  check (plan is null or plan in ('mensual', 'temporada', 'fundador'));

-- Dos clubes no pueden ser el mismo número de fundador.
create unique index if not exists clubs_founder_number_idx
  on public.clubs (founder_number)
  where founder_number is not null;

comment on column public.clubs.plan is
  'Plan contratado: mensual, temporada o fundador. Null mientras está en el mes gratis sin haber elegido.';
comment on column public.clubs.founder_number is
  'Número de plaza de fundador (1-50). Se asigna al contratar el plan fundador y no se libera aunque el club se dé de baja: la plaza se gastó.';

-- ---------------------------------------------------------------------
-- Plazas de fundador
-- ---------------------------------------------------------------------
-- El número total vive en la base de datos y no en el código para poder
-- ampliarlo sin desplegar, que es justo la decisión que se querrá tomar
-- deprisa si las 50 se agotan.
create table if not exists public.plataforma_ajustes (
  clave text primary key,
  valor int not null,
  actualizado_en timestamptz not null default now()
);

comment on table public.plataforma_ajustes is
  'Ajustes numéricos de la plataforma que el administrador puede cambiar sin desplegar código.';

insert into public.plataforma_ajustes (clave, valor)
values ('plazas_fundador', 50)
on conflict (clave) do nothing;

alter table public.plataforma_ajustes enable row level security;
-- Sin políticas: solo la clave de servicio la lee y la escribe.

/**
 * Reserva la siguiente plaza de fundador para un club, si queda alguna.
 * Devuelve el número asignado, o null si ya están todas ocupadas.
 *
 * Se hace en la base de datos y no en el código de la app porque dos
 * clubes pueden pulsar "contratar" a la vez: el bloqueo de la fila de
 * ajustes serializa las dos peticiones y evita repartir la misma plaza
 * dos veces.
 */
create or replace function public.reservar_plaza_fundador(p_club_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_ocupadas int;
  v_asignado int;
  v_actual int;
begin
  -- Si este club ya tenía plaza, se le devuelve la suya.
  select founder_number into v_actual from public.clubs where id = p_club_id;
  if v_actual is not null then
    return v_actual;
  end if;

  -- El bloqueo de esta fila es lo que serializa las peticiones a la vez.
  select valor into v_total
    from public.plataforma_ajustes
   where clave = 'plazas_fundador'
     for update;

  if v_total is null then
    return null;
  end if;

  select count(*) into v_ocupadas from public.clubs where founder_number is not null;

  if v_ocupadas >= v_total then
    return null;
  end if;

  select coalesce(max(founder_number), 0) + 1 into v_asignado from public.clubs;

  update public.clubs
     set founder_number = v_asignado,
         plan = 'fundador'
   where id = p_club_id;

  return v_asignado;
end;
$$;

comment on function public.reservar_plaza_fundador(uuid) is
  'Asigna la siguiente plaza de fundador libre a un club. Null si ya no quedan.';

/** Cuántas plazas de fundador quedan libres. */
create or replace function public.plazas_fundador_libres()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce((select valor from public.plataforma_ajustes where clave = 'plazas_fundador'), 0)
      - (select count(*)::int from public.clubs where founder_number is not null)
  );
$$;

grant execute on function public.plazas_fundador_libres() to anon, authenticated;


-- =====================================================================
-- 0022_quien_mira_a_cada_club.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Quién mira a cada club.
--
-- La migración 0014 ya contaba visitas, pero de forma anónima: el club
-- sabía "12 visitas" y nada más. Faltaban las dos preguntas que de
-- verdad importan, tanto para el club como para el administrador de la
-- plataforma:
--
--   1. ¿Cuántas EMPRESAS (no visitantes sueltos) han entrado en la ficha?
--   2. ¿Cuántas han llegado a mirar los datos de contacto?
--
-- La segunda es la señal más valiosa que produce la plataforma: una
-- empresa que abre el teléfono de un club está a un paso de escribirle.
-- Es también la métrica con la que se defiende la cuota: "este mes tres
-- empresas miraron tu contacto" vale más que cualquier gráfica.
--
-- Se guarda quién, no solo cuántos, porque son datos de empresa (una
-- persona jurídica mirando una oferta comercial), no de navegación
-- personal: el club ve el nombre de la empresa, igual que vería quién
-- entra por la puerta del pabellón.
-- ---------------------------------------------------------------------

-- 1. Las visitas pasan a saber si venían de una empresa registrada.
alter table public.club_page_views
  add column if not exists company_id uuid references auth.users (id) on delete set null;

create index if not exists club_page_views_company_idx
  on public.club_page_views (club_id, company_id, created_at desc)
  where company_id is not null;

comment on column public.club_page_views.company_id is
  'Empresa registrada que hizo la visita, si había sesión iniciada. Null en visitas anónimas.';

-- 2. Aperturas de los datos de contacto.
create table if not exists public.club_contact_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  company_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists club_contact_views_club_idx
  on public.club_contact_views (club_id, created_at desc);

create index if not exists club_contact_views_company_idx
  on public.club_contact_views (club_id, company_id)
  where company_id is not null;

alter table public.club_contact_views enable row level security;
-- Sin políticas: la escribe y la lee el servidor con la clave de
-- servicio, igual que el resto de tablas de eventos (0014).

comment on table public.club_contact_views is
  'Una fila cada vez que alguien despliega los datos de contacto de un club. Es la señal previa al primer correo.';


-- =====================================================================
-- 0023_permisos_de_tabla.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Dar permiso de tabla explícito a quien tiene sesión iniciada.
--
-- En Postgres hay dos puertas antes de escribir en una tabla: el permiso
-- de tabla (GRANT) y, después, la regla de fila (RLS). Todas las
-- migraciones anteriores escribieron con cuidado las reglas de fila y
-- ninguna se ocupó de la primera puerta: se daba por hecho el permiso
-- automático que Supabase concede a las tablas nuevas.
--
-- Cuando ese automatismo no se aplica —y no siempre se aplica—, un club
-- con sesión iniciada y todos sus permisos en regla se encuentra con
-- "permission denied for table clubs" al intentar guardar su ficha. La
-- ficha no se puede rellenar, el logo no se puede subir y nada de esto
-- lo arregla el propio club.
--
-- Aquí se concede lo justo, tabla por tabla. No es un permiso general:
-- la RLS sigue decidiendo qué filas ve y toca cada uno, y las tablas que
-- solo escribe el servidor se quedan fuera a propósito.
-- ---------------------------------------------------------------------

-- Uso del esquema. Sin esto, ningún GRANT de tabla sirve de nada.
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. Tablas del club: las gestiona su dueño desde el panel.
-- ---------------------------------------------------------------------
grant select, insert, update on public.clubs to authenticated;
grant select, insert, update, delete on public.club_teams to authenticated;
grant select, insert, update, delete on public.club_sponsors to authenticated;
grant select, insert, update, delete on public.club_service_needs to authenticated;
grant select, insert, update, delete on public.opportunities to authenticated;
grant select, insert, update, delete on public.club_dossiers to authenticated;

-- Un club no se borra a sí mismo desde el panel (la baja de la cuenta va
-- por otro camino), así que `clubs` no lleva delete.

-- ---------------------------------------------------------------------
-- 2. Tablas de la empresa.
-- ---------------------------------------------------------------------
grant select, insert, update on public.companies to authenticated;
grant select, insert, update, delete on public.company_favorites to authenticated;
grant select, insert, update, delete on public.company_favorite_lists to authenticated;

-- ---------------------------------------------------------------------
-- 3. Tablas que comparten los dos lados.
-- ---------------------------------------------------------------------
-- Las solicitudes las crea la empresa y las actualiza el club al
-- responderlas; ninguno de los dos las borra.
grant select, insert, update on public.contact_requests to authenticated;

-- Las plantillas de oportunidad: se leen las públicas y las propias, y
-- cada uno gestiona las suyas.
grant select, insert, delete on public.opportunity_templates to authenticated;

-- El registro de consentimientos se escribe al aceptar las condiciones y
-- no se modifica nunca: es su valor como prueba.
grant select, insert on public.consent_records to authenticated;

-- ---------------------------------------------------------------------
-- 4. Lectura pública sin sesión
-- ---------------------------------------------------------------------
-- La ficha pública de un club la ve cualquiera, y se sirve de estas dos
-- tablas hijas más las vistas públicas (que ya tienen su grant).
grant select on public.club_teams to anon;
grant select on public.club_sponsors to anon;
grant select on public.opportunities to anon;
grant select on public.opportunity_templates to anon;

-- ---------------------------------------------------------------------
-- 5. Lo que sigue siendo solo del servidor
-- ---------------------------------------------------------------------
-- Estas tablas las escribe la plataforma con su clave de servicio y no
-- las toca nadie más: ni con sesión iniciada ni sin ella. Se revoca de
-- forma explícita para que ningún permiso automático las abra por la
-- puerta de atrás.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;
revoke all on public.club_page_views from anon, authenticated;
revoke all on public.club_search_appearances from anon, authenticated;
revoke all on public.club_contact_views from anon, authenticated;
revoke all on public.dossier_views from anon, authenticated;
revoke all on public.search_logs from anon, authenticated;
revoke all on public.email_log from anon, authenticated;
revoke all on public.plataforma_ajustes from anon, authenticated;

-- Y lo que la migración 0012 ya había cerrado a los visitantes sin
-- sesión, por si el permiso automático lo hubiera vuelto a abrir.
revoke select on public.clubs from anon;
revoke select on public.companies from anon;
revoke select on public.contact_requests from anon;
revoke select on public.company_favorites from anon;
revoke select on public.company_favorite_lists from anon;
revoke select on public.club_dossiers from anon;
revoke select on public.consent_records from anon;
revoke select on public.club_service_needs from anon;

-- ---------------------------------------------------------------------
-- 6. Secuencias
-- ---------------------------------------------------------------------
-- Las tablas con id autonumérico necesitan además permiso sobre su
-- secuencia para poder insertar. Ninguna de las que puede escribir un
-- usuario con sesión lo usa hoy (todas van con uuid), pero dejarlo
-- escrito evita el mismo susto la próxima vez que se añada una.
grant usage on all sequences in schema public to authenticated;


-- =====================================================================
-- 0024_correo_de_contacto_del_club.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Un correo de contacto propio, distinto del de la cuenta.
--
-- Hasta ahora el correo que veía la empresa era, por fuerza, el de la
-- cuenta con la que se registró el club. Eso obliga a que el correo
-- personal de quien creó la cuenta salga publicado, y no deja poner el
-- buzón que el club usa de verdad para esto (info@, patrocinios@, el del
-- responsable comercial).
--
-- Si no se rellena, se sigue usando el de la cuenta: nadie se queda sin
-- forma de contacto por no haber rellenado un campo más.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists contact_email text;

alter table public.clubs drop constraint if exists clubs_contact_email_check;
alter table public.clubs
  add constraint clubs_contact_email_check
  check (
    contact_email is null
    or (length(contact_email) between 5 and 254 and contact_email like '%_@_%.__%')
  );

comment on column public.clubs.contact_email is
  'Correo de contacto que el club quiere publicar. Si es null se usa el de su cuenta.';


-- =====================================================================
-- 0025_portada_instalaciones_y_horario.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- La ficha del club, con cara de ficha de club.
--
-- Hasta ahora la portada de la página era, sin más, la primera foto de
-- la galería. Eso obliga al club a elegir entre tener una buena foto de
-- cabecera o tener esa misma foto en la galería, y el resultado depende
-- del orden en que las subió.
--
-- Y las instalaciones eran un único campo de texto libre. Para una
-- empresa que se está planteando poner una lona, dónde está el pabellón
-- y qué pinta tiene es justo lo que quiere saber.
--
--   cover_url          imagen de cabecera, de lado a lado
--   facilities_address dirección del pabellón o campo
--   facilities_photos  fotos de las instalaciones
--   contact_hours      cuándo se puede llamar
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists cover_url text,
  add column if not exists facilities_address text,
  add column if not exists facilities_photos text[] not null default '{}'::text[],
  add column if not exists contact_hours text;

comment on column public.clubs.cover_url is
  'Imagen de cabecera de la ficha pública, de lado a lado. Independiente de photo_urls (la galería).';
comment on column public.clubs.facilities_address is
  'Dónde juega el club: dirección del pabellón, campo o pista.';
comment on column public.clubs.facilities_photos is
  'Fotos de las instalaciones. Separadas de photo_urls, que es la galería del club.';
comment on column public.clubs.contact_hours is
  'Horario en el que el club atiende. Texto libre: "L-V de 17 a 21 h".';

alter table public.clubs drop constraint if exists clubs_contact_hours_check;
alter table public.clubs
  add constraint clubs_contact_hours_check
  check (contact_hours is null or length(contact_hours) <= 200);

alter table public.clubs drop constraint if exists clubs_facilities_address_check;
alter table public.clubs
  add constraint clubs_facilities_address_check
  check (facilities_address is null or length(facilities_address) <= 300);

-- ---------------------------------------------------------------------
-- La vista pública tiene que traer los campos nuevos
-- ---------------------------------------------------------------------
-- Se recrea entera porque hay que insertar columnas en medio, y Postgres
-- no deja cambiar el orden de las columnas de una vista con un simple
-- "create or replace" (error 42P16).
--
-- `contact_email` se queda deliberadamente FUERA. Esta vista la puede
-- leer cualquiera sin sesión: publicar aquí el correo sería dejarlo otra
-- vez al alcance de los robots que recolectan direcciones, que es justo
-- lo que se arregló en la migración 0022. El correo se sirve al pulsar
-- "Ver datos de contacto", que además permite contar cuántas empresas
-- llegan hasta ahí.
drop view if exists public.club_public_profiles cascade;

create view public.club_public_profiles as
select
  id,
  slug,
  name,
  city,
  province,
  postal_code,
  latitude,
  longitude,
  facilities,
  facilities_address,
  facilities_photos,
  website,
  social_links,
  description,
  logo_url,
  cover_url,
  photo_urls,
  video_url,
  case when contact_public_consent then contact_name else null end as contact_name,
  case when contact_public_consent then contact_phone else null end as contact_phone,
  contact_hours,
  contact_public_consent,
  top_category,
  competitions,
  achievements,
  youth_teams_count,
  youth_players_count,
  youth_families_count,
  founding_year,
  milestones,
  followers_by_network,
  estimated_reach,
  average_attendance,
  community_actions,
  profile_score,
  verified,
  created_at,
  updated_at
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

comment on view public.club_public_profiles is
  'Vista pública de clubs: la usa /club/[slug]. Oculta contact_name/contact_phone sin autorización del club, no expone contact_email (ver 0022) ni ningún dato de Stripe, y solo incluye clubes publicados. SECURITY DEFINER a propósito (ver 0012).';

grant select on public.club_public_profiles to anon, authenticated;


-- =====================================================================
-- 0026_encuadre_de_la_portada.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Dónde se corta la portada.
--
-- La imagen de portada es apaisada y muy baja (de lado a lado, unos 320
-- píxeles de alto), así que de una foto normal solo cabe una franja. Por
-- defecto se coge la del centro, y eso deja fuera justo lo que importa
-- la mitad de las veces: en una foto de equipo salen los pies, y en una
-- del pabellón se corta el marcador.
--
-- Esto guarda a qué altura de la foto se hace ese corte, en porcentaje:
-- 0 es pegado arriba, 100 pegado abajo, 50 el centro de siempre. El club
-- lo ajusta con un deslizador viendo el resultado.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists cover_position int not null default 50;

alter table public.clubs drop constraint if exists clubs_cover_position_check;
alter table public.clubs
  add constraint clubs_cover_position_check
  check (cover_position between 0 and 100);

comment on column public.clubs.cover_position is
  'Altura del recorte de la portada, en porcentaje: 0 arriba, 50 centro, 100 abajo.';

-- La columna se añade AL FINAL de la vista a propósito. Postgres permite
-- ampliar una vista por el final con "create or replace" sin tener que
-- borrarla y volver a crearla, y así este cambio no aparece como una
-- operación destructiva en el editor de Supabase.
create or replace view public.club_public_profiles as
select
  id,
  slug,
  name,
  city,
  province,
  postal_code,
  latitude,
  longitude,
  facilities,
  facilities_address,
  facilities_photos,
  website,
  social_links,
  description,
  logo_url,
  cover_url,
  photo_urls,
  video_url,
  case when contact_public_consent then contact_name else null end as contact_name,
  case when contact_public_consent then contact_phone else null end as contact_phone,
  contact_hours,
  contact_public_consent,
  top_category,
  competitions,
  achievements,
  youth_teams_count,
  youth_players_count,
  youth_families_count,
  founding_year,
  milestones,
  followers_by_network,
  estimated_reach,
  average_attendance,
  community_actions,
  profile_score,
  verified,
  created_at,
  updated_at,
  cover_position
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

grant select on public.club_public_profiles to anon, authenticated;


-- =====================================================================
-- 0027_aviso_al_patrocinador.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Avisar al patrocinador de que el club le ha añadido.
--
-- Es la pieza que resuelve el arranque en frío de la plataforma: cada
-- club que sube a sus patrocinadores actuales trae empresas que ya han
-- demostrado que patrocinan deporte, sin coste de captación. El aviso
-- convierte eso de pasivo en activo.
--
-- Con una condición que manda sobre todo lo demás: el correo lo manda el
-- CLUB, no ApoyaClub. Escribir a una empresa que no ha dado su dirección
-- a nadie es spam en el sentido legal (art. 21 LSSI, RGPD por encima), y
-- la consecuencia práctica más probable no es una multa, es que el
-- dominio se queme y dejen de llegar los correos que sí importan: las
-- solicitudes de contacto.
--
-- Entre el club y su patrocinador SÍ hay relación previa, y ahí es donde
-- se apoya todo esto. Por eso se guarda, con fecha, que el club ha
-- confirmado esa relación; y por eso el aviso se manda UNA sola vez por
-- empresa, lo que garantiza `notified_at`.
-- ---------------------------------------------------------------------

alter table public.club_sponsors
  add column if not exists contact_email text,
  add column if not exists relationship_confirmed_at timestamptz,
  add column if not exists notified_at timestamptz;

alter table public.club_sponsors drop constraint if exists club_sponsors_contact_email_check;
alter table public.club_sponsors
  add constraint club_sponsors_contact_email_check
  check (
    contact_email is null
    or (length(contact_email) between 5 and 254 and contact_email like '%_@_%.__%')
  );

-- No se puede haber avisado a quien no ha confirmado su relación con el
-- club: la confirmación es la base sobre la que se manda el correo, así
-- que la restricción lo deja imposible por construcción y no solo por
-- disciplina del código.
alter table public.club_sponsors drop constraint if exists club_sponsors_aviso_check;
alter table public.club_sponsors
  add constraint club_sponsors_aviso_check
  check (notified_at is null or relationship_confirmed_at is not null);

comment on column public.club_sponsors.contact_email is
  'Correo de contacto de la empresa patrocinadora, que aporta el club. Nunca se publica.';
comment on column public.club_sponsors.relationship_confirmed_at is
  'Cuándo confirmó el club que esta empresa colabora con él y que tiene relación con esa dirección.';
comment on column public.club_sponsors.notified_at is
  'Cuándo se le mandó el aviso de agradecimiento. Solo se manda una vez, nunca dos.';


-- =====================================================================
-- 0028_permisos_del_servidor.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Permisos de la cuenta con la que trabaja el servidor.
--
-- La migración 0023 arregló los permisos de tabla del usuario con sesión
-- (`authenticated`) porque un club no podía ni guardar su ficha. Pero se
-- dejó fuera a `service_role`, que es la cuenta con la que la plataforma
-- hace todo lo que no puede hacer el propio usuario:
--
--   - contar las visitas a una ficha y las aperturas de contacto,
--   - apuntar las búsquedas,
--   - leer las métricas del club y las del administrador,
--   - mandar los correos del cron.
--
-- Sin esos permisos nada de eso falla a la vista: está escrito para no
-- tumbar la página que lo dispara, así que se traga el error y devuelve
-- cero. El club acaba viendo "todavía no tienes movimientos este mes"
-- después de que una empresa haya entrado en su ficha, haya abierto su
-- teléfono y le haya escrito. Es la peor forma de fallar: en silencio y
-- diciendo justo lo contrario de la verdad.
--
-- Aquí se le dan a `service_role` los permisos que Supabase concede por
-- defecto y que en este proyecto no llegaron a aplicarse.
-- ---------------------------------------------------------------------

grant usage on schema public to service_role;

-- Todo sobre las tablas: es la cuenta del servidor, y su acceso lo
-- limita el código, no la base de datos. La clave nunca sale del
-- servidor (`SUPABASE_SERVICE_ROLE_KEY`, jamás en el navegador).
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Y lo mismo para las tablas que se creen a partir de ahora, para que
-- este agujero no vuelva a abrirse con la próxima migración.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant all privileges on functions to service_role;

-- Las mismas concesiones por defecto para quien tiene sesión iniciada,
-- por el mismo motivo: la migración 0023 arregló las tablas que existían
-- entonces, no las que vengan después.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage on sequences to authenticated;

-- Y se vuelven a cerrar las tablas internas, que el `grant all` de
-- arriba no toca (solo afecta a service_role) pero conviene dejar
-- explícito: nadie con sesión, ni sin ella, las lee ni las escribe.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;
revoke all on public.club_page_views from anon, authenticated;
revoke all on public.club_search_appearances from anon, authenticated;
revoke all on public.club_contact_views from anon, authenticated;
revoke all on public.dossier_views from anon, authenticated;
revoke all on public.search_logs from anon, authenticated;
revoke all on public.email_log from anon, authenticated;
revoke all on public.plataforma_ajustes from anon, authenticated;
