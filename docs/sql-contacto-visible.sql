-- 0029 — El contacto del club, visible por defecto
--
-- `contact_public_consent` nacía en false (migración 0002), así que un
-- club recién dado de alta salía publicado SIN nombre ni teléfono: la
-- empresa llegaba a la ficha y no tenía a quién llamar. Esconder esos
-- datos no protegía gran cosa (el teléfono del club suele estar en su
-- web, en su Instagram y en la federación) y sí rompía justo lo que la
-- plataforma tiene que conseguir, que es que la empresa contacte.
--
-- A partir de aquí el interruptor sigue existiendo y el club lo puede
-- apagar cuando quiera desde su panel, pero viene puesto: es lo que
-- espera quien se da de alta para que le patrocinen.
--
-- Nota sobre el UPDATE: los clubes que ya existen pasan a visible. Se
-- hace a propósito y solo tiene sentido ahora, antes de la apertura,
-- cuando los únicos clubes de la base son de prueba. Una vez haya
-- clubes reales esta línea no se vuelve a ejecutar sobre ellos: es una
-- migración, corre una sola vez por base de datos.

alter table public.clubs
  alter column contact_public_consent set default true;

update public.clubs
  set contact_public_consent = true
  where contact_public_consent is false;

comment on column public.clubs.contact_public_consent is
  'El club autoriza mostrar contact_name y contact_phone en su página pública. Por defecto true desde la migración 0029: el club puede apagarlo desde su panel, pero la ficha nace con el contacto a la vista.';
