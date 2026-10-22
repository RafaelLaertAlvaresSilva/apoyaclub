-- ---------------------------------------------------------------------
-- Empresas en el administrador, y el club decide si se le ve.
--
-- PARTE A (empresas). Lo mismo que ya tenían los clubes (0009 y 0053), ahora para empresas:
--
--   - SUSPENDER: la empresa desaparece del directorio, de su ficha
--     pública y de los avisos por correo, y pierde el acceso a su panel.
--   - MODO DE PRUEBAS: desaparece de todo lo público, pero sigue
--     entrando a su panel y recibiendo avisos. Es para la empresa con la
--     que se prueba la plataforma ("Prueba Empresa" estaba a la vista de
--     todos en /empresas).
--
-- Las dos vistas públicas de empresas se vuelven a escribir tal cual
-- estaban (últimas versiones: 0033 y 0046) con dos líneas más. La
-- prueba `tests/unit/modo-de-pruebas.test.ts` vigila que una migración
-- futura no se las deje por el camino.
--
-- Y, como en 0054 con los clubes, la propia empresa no puede cambiarse
-- estas columnas con su sesión: lo hace un trigger.
--
-- PARTE B (clubes). El club puede esconder él mismo su página desde el
-- panel ("Visibilidad"): por ejemplo, mientras la prepara, o en verano
-- cuando no busca patrocinador. Las empresas ya podían hacerlo (salir o
-- no en el directorio); los clubes no. Es `clubs.hidden_by_club`, y a
-- diferencia del modo de pruebas lo cambia el propio club: por eso NO
-- está entre las columnas protegidas de 0054.
-- ---------------------------------------------------------------------

alter table public.companies
  add column if not exists admin_suspended boolean not null default false,
  add column if not exists admin_suspended_at timestamptz,
  add column if not exists admin_test_mode boolean not null default false,
  add column if not exists admin_test_mode_at timestamptz;

comment on column public.companies.admin_suspended is
  'true si un admin ha suspendido la empresa: pierde el panel y no aparece en nada público ni recibe avisos (migración 0055).';
comment on column public.companies.admin_test_mode is
  'true si un admin ha puesto la empresa en modo de pruebas: conserva su panel, pero no aparece en nada público (migración 0055).';

-- Datos que ya hay: la provincia escrita toda en mayúsculas o toda en
-- minúsculas ("ALICANTE", "alicante") pasa a "Alicante", igual que la
-- guarda ahora el formulario. Si alguien la escribió con mayúsculas y
-- minúsculas a su manera ("A Coruña"), se respeta.
update public.companies
   set province =
         regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
           initcap(lower(trim(province))),
           '(\s)De\M', '\1de', 'g'),
           '(\s)Del\M', '\1del', 'g'),
           '(\s)La\M', '\1la', 'g'),
           '(\s)Las\M', '\1las', 'g'),
           '(\s)Los\M', '\1los', 'g'),
           '(\s)Y\M', '\1y', 'g')
 where province is not null
   and trim(province) <> ''
   and (province = upper(province) or province = lower(province));

update public.company_offers
   set province =
         regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
           initcap(lower(trim(province))),
           '(\s)De\M', '\1de', 'g'),
           '(\s)Del\M', '\1del', 'g'),
           '(\s)La\M', '\1la', 'g'),
           '(\s)Las\M', '\1las', 'g'),
           '(\s)Los\M', '\1los', 'g'),
           '(\s)Y\M', '\1y', 'g')
 where province is not null
   and trim(province) <> ''
   and (province = upper(province) or province = lower(province));

-- ---------------------------------------------------------------------
-- 1. Ficha pública y mapa del sitio (última versión: 0033)
-- ---------------------------------------------------------------------
create or replace view public.company_public_profiles as
select
  id,
  slug,
  name,
  sector,
  city,
  province,
  website,
  description,
  logo_url,
  objectives,
  case
    when budget_min is null and budget_max is null then null
    when coalesce(budget_max, budget_min) < 500 then 'hasta_500'
    when coalesce(budget_max, budget_min) < 2000 then 'de_500_a_2000'
    else 'mas_2000'
  end as budget_band,
  created_at
from public.companies
where open_to_sponsor
  and name is not null
  and length(trim(name)) > 0
  and not admin_suspended
  and not admin_test_mode;

grant select on public.company_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Directorio de empresas y lo que ofrecen (última versión: 0046)
-- ---------------------------------------------------------------------
create or replace view public.company_offers_public as
select
  o.id,
  o.company_id,
  o.title,
  o.description,
  o.offer_type,
  o.category,
  o.value,
  o.wants,
  -- La de la oferta si la tiene; si no, la de la empresa.
  coalesce(o.province, c.province) as province,
  o.created_at,
  c.slug as company_slug,
  c.name as company_name,
  c.sector as company_sector,
  c.city as company_city,
  c.logo_url as company_logo_url
from public.company_offers o
join public.companies c on c.id = o.company_id
where o.archived_at is null
  and o.status = 'available'
  and c.name is not null
  and length(trim(c.name)) > 0
  and not c.admin_suspended
  and not c.admin_test_mode;

grant select on public.company_offers_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. La empresa no puede cambiarse estas columnas con su sesión
--    (igual que los clubes en 0054)
-- ---------------------------------------------------------------------
create or replace function public.proteger_columnas_de_admin_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.admin_suspended := false;
    new.admin_suspended_at := null;
    new.admin_test_mode := false;
    new.admin_test_mode_at := null;
    return new;
  end if;

  new.admin_suspended := old.admin_suspended;
  new.admin_suspended_at := old.admin_suspended_at;
  new.admin_test_mode := old.admin_test_mode;
  new.admin_test_mode_at := old.admin_test_mode_at;
  return new;
end;
$$;

comment on function public.proteger_columnas_de_admin_empresa() is
  'Impide que una empresa, con su propia sesión, se quite una suspensión o el modo de pruebas (migración 0055).';

drop trigger if exists companies_aa_proteger_columnas on public.companies;
create trigger companies_aa_proteger_columnas
  before insert or update on public.companies
  for each row execute function public.proteger_columnas_de_admin_empresa();

-- ---------------------------------------------------------------------
-- 4. PARTE B: el club esconde él mismo su página
-- ---------------------------------------------------------------------
alter table public.clubs
  add column if not exists hidden_by_club boolean not null default false,
  add column if not exists hidden_by_club_at timestamptz;

comment on column public.clubs.hidden_by_club is
  'true si el propio club ha decidido no mostrarse: no sale en su página pública, el buscador, /servicios, el sitemap ni los avisos a empresas. Lo cambia él desde su panel (migración 0055).';

-- Las tres vistas de clubes, tal cual quedaron en 0053, con una línea más.
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
  top_category_female_photo_note
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
  o.photos
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
  c.logo_url as club_logo_url
from public.club_service_needs n
join public.clubs c on c.id = n.club_id
where n.status = 'open'
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended
  and not c.admin_test_mode
  and not c.hidden_by_club;

comment on view public.club_service_needs_public is
  'Servicios que buscan los clubes visibles (/servicios y la ficha del club). Solo necesidades abiertas de clubes con suscripción activa o en prueba, no suspendidos, no en modo de pruebas y que no se han escondido ellos mismos.';

grant select on public.club_service_needs_public to anon, authenticated;
