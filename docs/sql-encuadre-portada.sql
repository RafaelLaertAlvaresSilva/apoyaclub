-- ---------------------------------------------------------------------
-- ApoyaClub: encuadre de la portada (migracion 0026).
--
-- Guarda a que altura se corta la imagen de portada, para que el club
-- pueda subirla o bajarla con un deslizador en el panel.
--
-- NO borra nada: la vista se amplia por el final, asi que este SQL no
-- deberia dar el aviso de "operaciones destructivas".
--
-- Se puede ejecutar varias veces sin romper nada.
-- Se pega en Supabase -> SQL Editor -> New query -> Run.
-- ---------------------------------------------------------------------

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
