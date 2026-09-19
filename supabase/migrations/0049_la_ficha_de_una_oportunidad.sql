-- ---------------------------------------------------------------------
-- La ficha de una oportunidad: qué recibe cada uno y quién hace qué.
--
-- Hasta ahora una oportunidad era un título, un precio y un párrafo de
-- texto libre. Con eso, club y empresa firman creyendo cada uno una
-- cosa distinta, y en marzo aparece la discusión: "yo entendí que las
-- fotos las hacíais vosotros".
--
-- Aquí se estructura lo que antes iba suelto en la descripción:
--
--   * `benefits` — lo que recibe la empresa, con cantidades. "4
--     publicaciones" no es lo mismo que "publicaciones", y la cantidad
--     es lo que después permite convertir esto en tareas.
--
--   * `actions` — quién se encarga de cada cosa. Una sola lista con el
--     responsable dentro (club / empresa / ambos) y no dos listas
--     fijas: en la mitad de los acuerdos reales hay cosas que se hacen
--     entre los dos, y con dos listas cerradas no hay dónde ponerlas.
--
--   * Las condiciones que faltaban: cada cuánto, desde cuándo y hasta
--     cuándo, y cualquier requisito. La duración y la exclusividad ya
--     existían (migraciones 0003 y 0007).
--
-- Las dos listas van en jsonb y no en tablas aparte a propósito: se
-- leen y se escriben siempre enteras y con su oportunidad, nunca por
-- separado. Es el mismo criterio que los hitos y las acciones sociales
-- del club, y se sanean igual antes de guardarse.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists actions jsonb not null default '[]'::jsonb,
  add column if not exists frequency text,
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists requirements text;

comment on column public.opportunities.benefits is
  'Lo que recibe la empresa (migración 0049): [{"texto": "Publicaciones en Instagram", "cantidad": 4}]. La cantidad puede ser null.';

comment on column public.opportunities.actions is
  'Quién hace qué (migración 0049): [{"texto": "Diseño de las creatividades", "responsable": "club"|"empresa"|"ambos"}].';

comment on column public.opportunities.frequency is
  'Cada cuánto: "mensual", "por partido en casa"… Texto libre (migración 0049).';

comment on column public.opportunities.starts_on is
  'Desde cuándo está vigente el acuerdo (migración 0049). Opcional.';

comment on column public.opportunities.ends_on is
  'Hasta cuándo (migración 0049). Opcional.';

comment on column public.opportunities.requirements is
  'Cualquier otro requisito o condición, en texto libre (migración 0049).';

-- Las dos listas tienen que ser listas. Sin esto, un objeto o un texto
-- guardado por error rompe la ficha pública del club entera.
alter table public.opportunities drop constraint if exists opportunities_benefits_check;
alter table public.opportunities
  add constraint opportunities_benefits_check
  check (jsonb_typeof(benefits) = 'array');

alter table public.opportunities drop constraint if exists opportunities_actions_check;
alter table public.opportunities
  add constraint opportunities_actions_check
  check (jsonb_typeof(actions) = 'array');

-- Ni el inicio después del final.
alter table public.opportunities drop constraint if exists opportunities_fechas_check;
alter table public.opportunities
  add constraint opportunities_fechas_check
  check (starts_on is null or ends_on is null or starts_on <= ends_on);
