-- ---------------------------------------------------------------------
-- Nivel de patrocinador, exclusividad y equipo asociado.
--
-- La Fase 2 pedía estos campos en `opportunities` y se quedaron fuera al
-- implementar la Fase 6. Son justo los que una empresa usa para decidir:
-- si lo que compra es el patrocinio principal o una colaboración
-- pequeña, si lleva exclusividad en su sector, y a qué equipo del club
-- va asociado (primer equipo o un equipo concreto de cantera).
--
-- Los tres son opcionales para no invalidar nada de lo ya publicado:
-- las oportunidades que ya existen pasan a nivel "libre", que es
-- exactamente lo que eran.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists sponsor_level text not null default 'libre',
  add column if not exists exclusivity text,
  add column if not exists team_id uuid references public.club_teams (id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_sponsor_level_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_sponsor_level_check
      check (sponsor_level in ('principal', 'oficial', 'colaborador', 'libre'));
  end if;
end $$;

comment on column public.opportunities.sponsor_level is
  'Nivel de patrocinador: principal (el de mayor visibilidad del club), oficial (con exclusividad de sector), colaborador o libre (sin categoría). Filtro del buscador.';
comment on column public.opportunities.exclusivity is
  'Sector en el que la oportunidad se ofrece en exclusiva, en texto libre ("automoción", "seguros"). Null = sin exclusividad.';
comment on column public.opportunities.team_id is
  'Equipo del club al que va asociada la oportunidad (club_teams). Null = al club entero.';

create index if not exists opportunities_sponsor_level_idx
  on public.opportunities (sponsor_level)
  where archived_at is null and status = 'available';

create index if not exists opportunities_team_id_idx on public.opportunities (team_id);

-- ---------------------------------------------------------------------
-- La vista del buscador expone los campos nuevos (van al final: es lo
-- único que `create or replace view` permite añadir sin recrearla).
-- El equipo se une por LEFT JOIN para que una oportunidad sin equipo
-- asociado siga apareciendo.
-- ---------------------------------------------------------------------
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
  t.team_level as team_level
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada de un club con suscripción activa o en prueba (Fase 10) y no suspendido por un admin (Fase 12), con los datos de su club y, si la tiene, de su equipo asociado.';

grant select on public.opportunity_search_view to anon, authenticated;
