-- ---------------------------------------------------------------------
-- Oportunidades generadas por la plataforma (5-11-2026).
--
-- "Generar mis oportunidades" le propone al club unas cuantas sacadas
-- del catálogo de ideas, escritas con sus datos. Cada una guarda de qué
-- idea salió:
--
--   - para no volver a proponerle la misma;
--   - y, decidido por Rafael, para que cuando haya más de 20 clubes con
--     oportunidades generadas se pueda enseñar un precio de referencia:
--     lo que han puesto otros clubes en la misma idea. Hasta entonces,
--     sin precio.
--
-- Es solo una columna de texto y un índice. Es seguro volver a
-- ejecutarla.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists idea_id text;

comment on column public.opportunities.idea_id is
  'Idea del catálogo de la que salió, si la generó la plataforma. Migración 0059.';

create index if not exists opportunities_idea_id_idx
  on public.opportunities (idea_id)
  where idea_id is not null;
