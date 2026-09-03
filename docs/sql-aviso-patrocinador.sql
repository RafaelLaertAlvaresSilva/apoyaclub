-- ---------------------------------------------------------------------
-- ApoyaClub: aviso al patrocinador (migracion 0027).
--
-- Añade el correo de la empresa patrocinadora, la confirmacion del club
-- de que tiene relacion con ella, y la fecha del aviso enviado (para que
-- solo se mande una vez).
--
-- NO borra nada.
-- Se puede ejecutar varias veces sin romper nada.
-- Se pega en Supabase -> SQL Editor -> New query -> Run.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Avisar al patrocinador de que el club le ha añadido.
--
-- Es la pieza que resuelve el arranque en frío de la plataforma: cada
-- club que sube a sus patrocinadores actuales trae empresas que ya han
-- demostrado que patrocinan deporte, sin coste de captación. El aviso
-- convierte eso de pasivo en activo.
--
-- Con una condición que manda sobre todo lo demás: el correo lo manda el
-- CLUB, no ApoyaClub. Escribir a una empresa que no ha dado su dirección
-- a nadie es spam en el sentido legal (art. 21 LSSI, RGPD por encima), y
-- la consecuencia práctica más probable no es una multa, es que el
-- dominio se queme y dejen de llegar los correos que sí importan: las
-- solicitudes de contacto.
--
-- Entre el club y su patrocinador SÍ hay relación previa, y ahí es donde
-- se apoya todo esto. Por eso se guarda, con fecha, que el club ha
-- confirmado esa relación; y por eso el aviso se manda UNA sola vez por
-- empresa, lo que garantiza `notified_at`.
-- ---------------------------------------------------------------------

alter table public.club_sponsors
  add column if not exists contact_email text,
  add column if not exists relationship_confirmed_at timestamptz,
  add column if not exists notified_at timestamptz;

alter table public.club_sponsors drop constraint if exists club_sponsors_contact_email_check;
alter table public.club_sponsors
  add constraint club_sponsors_contact_email_check
  check (
    contact_email is null
    or (length(contact_email) between 5 and 254 and contact_email like '%_@_%.__%')
  );

-- No se puede haber avisado a quien no ha confirmado su relación con el
-- club: la confirmación es la base sobre la que se manda el correo, así
-- que la restricción lo deja imposible por construcción y no solo por
-- disciplina del código.
alter table public.club_sponsors drop constraint if exists club_sponsors_aviso_check;
alter table public.club_sponsors
  add constraint club_sponsors_aviso_check
  check (notified_at is null or relationship_confirmed_at is not null);

comment on column public.club_sponsors.contact_email is
  'Correo de contacto de la empresa patrocinadora, que aporta el club. Nunca se publica.';
comment on column public.club_sponsors.relationship_confirmed_at is
  'Cuándo confirmó el club que esta empresa colabora con él y que tiene relación con esa dirección.';
comment on column public.club_sponsors.notified_at is
  'Cuándo se le mandó el aviso de agradecimiento. Solo se manda una vez, nunca dos.';
