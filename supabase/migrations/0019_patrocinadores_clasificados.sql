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
