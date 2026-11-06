-- ---------------------------------------------------------------------
-- El país de cada club, en su ficha (pedido por Rafael el 6-11-2026).
--
-- Hasta ahora el país solo estaba en la cuenta (`auth.users.raw_app_meta_data
-- ->> 'pais'`, migración 0058), que el club no puede tocar pero que las
-- páginas públicas no pueden leer. Hace falta en dos sitios:
--
--   - La moneda: un club de Brasil pone sus precios en reales y se
--     tienen que ver en reales, en cualquier idioma de la web; uno de
--     España o Portugal, en euros.
--   - El buscador: cada visitante ve primero los clubes del país de la
--     web por la que entra (/br → Brasil, /pt → Portugal, /es → España)
--     y puede pedir ver los de otros países.
--
-- Cómo:
--   1) `clubs.country` (ES, PT o BR; España por defecto).
--   2) Se rellena con el país de la cuenta de cada club.
--   3) Un trigger lo vuelve a copiar de la cuenta en cada alta y cada
--      cambio de la ficha: la cuenta manda, y el club no puede ponerse
--      otro país escribiendo en su fila.
--   4) Las tres vistas públicas de clubes lo llevan, con una columna más
--      al final (como quedaron en 0055).
--
-- Es seguro volver a ejecutarla.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists country text not null default 'ES';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clubs_country_valido'
  ) then
    alter table public.clubs
      add constraint clubs_country_valido check (country in ('ES', 'PT', 'BR'));
  end if;
end $$;

comment on column public.clubs.country is
  'País del club (ES, PT o BR). Copia del país de su cuenta, que es el que manda: lo pone el trigger clubs_ab_pais_de_la_cuenta. Decide la moneda de sus precios y en qué país sale en el buscador (migración 0060).';

create index if not exists clubs_country_idx on public.clubs (country);

-- 3) El trigger. SECURITY DEFINER para poder leer auth.users; solo lee
--    la cuenta del propio club (la fila de clubs tiene el mismo id que
--    su cuenta).
create or replace function public.copiar_pais_de_la_cuenta()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_pais text;
begin
  select u.raw_app_meta_data ->> 'pais'
    into v_pais
    from auth.users u
   where u.id = new.id;

  new.country := case when v_pais in ('ES', 'PT', 'BR') then v_pais else 'ES' end;
  return new;
end;
$$;

comment on function public.copiar_pais_de_la_cuenta() is
  'Copia en clubs.country el país de la cuenta del club en cada alta o cambio de la ficha (migración 0060).';

revoke all on function public.copiar_pais_de_la_cuenta() from public, anon, authenticated;

drop trigger if exists clubs_ab_pais_de_la_cuenta on public.clubs;
create trigger clubs_ab_pais_de_la_cuenta
  before insert or update on public.clubs
  for each row execute function public.copiar_pais_de_la_cuenta();

-- 2) Los clubes que ya existen. El trigger de arriba pone el país de la
--    cuenta en cada fila que se toca.
update public.clubs set country = country;

-- 4) Las vistas públicas, tal cual quedaron en 0055, con el país al final.
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
  cover_position,
  top_category_male,
  top_category_female,
  top_category_male_photo,
  top_category_female_photo,
  members_count,
  top_category_male_photo_note,
  top_category_female_photo_note,
  country
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended
  and not admin_test_mode
  and not hidden_by_club;

grant select on public.club_public_profiles to anon, authenticated;

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
  o.slots_taken,
  c.profile_score as club_profile_score,
  (c.profile_score / 10) as club_visibility_bucket,
  o.is_need,
  o.need_category,
  o.photos,
  c.country as club_country
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended
  and not c.admin_test_mode
  and not c.hidden_by_club;

grant select on public.opportunity_search_view to anon, authenticated;

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
  c.logo_url as club_logo_url,
  c.country as club_country
from public.club_service_needs n
join public.clubs c on c.id = n.club_id
where n.status = 'open'
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended
  and not c.admin_test_mode
  and not c.hidden_by_club;
