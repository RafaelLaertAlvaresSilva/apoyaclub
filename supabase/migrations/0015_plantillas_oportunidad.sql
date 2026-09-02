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
