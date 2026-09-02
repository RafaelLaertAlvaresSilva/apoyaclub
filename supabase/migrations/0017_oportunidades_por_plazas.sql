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
