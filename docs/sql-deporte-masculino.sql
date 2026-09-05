-- ---------------------------------------------------------------------
-- 0032 — "Deporte masculino" entre los objetivos.
--
-- El catálogo de objetivos (migración 0004) tenía "deporte femenino" y
-- no su pareja. La lista está cerrada por una restricción en la base,
-- así que añadir la opción en el código no basta: sin tocar esto, una
-- oportunidad marcada como deporte masculino sería rechazada al
-- guardarla.
--
-- `companies.objectives` (migración 0005) guarda el mismo catálogo pero
-- no lleva restricción, así que ahí no hay nada que cambiar.
-- ---------------------------------------------------------------------

alter table public.opportunities
  drop constraint if exists opportunities_objectives_check;

alter table public.opportunities
  add constraint opportunities_objectives_check
  check (
    objectives <@ array[
      'familias', 'jovenes', 'comunidad_local', 'deporte_femenino', 'deporte_masculino',
      'deporte_base', 'visibilidad', 'contenido', 'clientes', 'empleados', 'rsc'
    ]::text[]
  );
