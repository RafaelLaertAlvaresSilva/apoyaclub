-- ---------------------------------------------------------------------
-- Qué patrocinadores salen en el dossier.
--
-- El club elige por nivel: todos, solo el principal, principal y
-- oficiales, solo colaboradores… Se guarda para que el enlace público
-- del dossier salga igual que el que descarga el club.
--
-- Null = todos (lo que tenía todo el mundo hasta ahora). Como `sections`
-- y `opportunity_ids` (0006), es una lista en jsonb que se valida en el
-- código y no aquí.
--
-- Es seguro volver a ejecutarla.
-- ---------------------------------------------------------------------

alter table public.club_dossiers
  add column if not exists sponsor_tiers jsonb;

comment on column public.club_dossiers.sponsor_tiers is
  'Niveles de patrocinador que salen en el dossier (principal, oficial, colaborador, otro). Null = todos.';
