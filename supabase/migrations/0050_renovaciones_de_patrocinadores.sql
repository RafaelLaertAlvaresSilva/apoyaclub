-- ---------------------------------------------------------------------
-- Renovaciones: hasta cuándo dura cada patrocinio.
--
-- Un patrocinador tenía `since_year` —desde cuándo— y nada más. Con eso
-- el club sabe cuánto lleva una empresa, pero no cuándo deja de estar.
-- Y el patrocinio del deporte base se pierde casi siempre de la misma
-- manera: no porque la empresa diga que no, sino porque nadie se acordó
-- de volver a preguntar y la temporada empezó sin hablarlo.
--
-- Se añaden tres columnas y ninguna tabla nueva. El patrocinio no es
-- una entidad aparte: es el mismo patrocinador con dos fechas.
--
--   * `renewal_date` — cuándo toca hablar de la renovación. No es la
--     fecha en que acaba el acuerdo: es la fecha en la que hay que
--     escribir, que siempre va antes. El club pone la que quiera.
--
--   * `agreement_ends_on` — cuándo acaba el acuerdo de verdad. Separada
--     de la anterior a propósito: "hablar en mayo" y "acaba en junio"
--     son dos cosas distintas, y mezclarlas obliga al club a elegir
--     cuál de las dos apunta.
--
--   * `renewal_notes` — qué se acordó y qué hay que recordar al
--     escribir. Lo que hoy vive en la cabeza del que firmó, y se va con
--     él cuando cambia la junta.
--
-- Todas aceptan null: un club que no lleve las fechas sigue usando sus
-- patrocinadores igual que hasta ahora, y la aplicación está escrita
-- para funcionar sin esta migración aplicada.
-- ---------------------------------------------------------------------

alter table public.club_sponsors
  add column if not exists renewal_date date,
  add column if not exists agreement_ends_on date,
  add column if not exists renewal_notes text;

comment on column public.club_sponsors.renewal_date is
  'Cuándo toca escribir para hablar de la renovación (migración 0050). Antes de que acabe el acuerdo.';
comment on column public.club_sponsors.agreement_ends_on is
  'Cuándo acaba el acuerdo con esta empresa (migración 0050).';
comment on column public.club_sponsors.renewal_notes is
  'Qué se acordó y qué recordar al escribir para renovar (migración 0050).';

-- Avisar antes de que acabe, no después. Si la fecha de escribir cae
-- más tarde que el final del acuerdo, el aviso llega cuando ya no sirve.
alter table public.club_sponsors drop constraint if exists club_sponsors_renovacion_check;
alter table public.club_sponsors
  add constraint club_sponsors_renovacion_check
  check (
    renewal_date is null
    or agreement_ends_on is null
    or renewal_date <= agreement_ends_on
  );

-- El club ordena sus renovaciones por fecha cada vez que abre la
-- sección, y con la lista entera en memoria no haría falta; el índice
-- está para que siga siendo barato cuando un club tenga veinte
-- patrocinadores y varias temporadas de histórico.
create index if not exists club_sponsors_renewal_date_idx
  on public.club_sponsors (club_id, renewal_date)
  where renewal_date is not null;
