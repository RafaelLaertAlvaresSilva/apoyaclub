-- ---------------------------------------------------------------------
-- Un correo de contacto propio, distinto del de la cuenta.
--
-- Hasta ahora el correo que veía la empresa era, por fuerza, el de la
-- cuenta con la que se registró el club. Eso obliga a que el correo
-- personal de quien creó la cuenta salga publicado, y no deja poner el
-- buzón que el club usa de verdad para esto (info@, patrocinios@, el del
-- responsable comercial).
--
-- Si no se rellena, se sigue usando el de la cuenta: nadie se queda sin
-- forma de contacto por no haber rellenado un campo más.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists contact_email text;

alter table public.clubs drop constraint if exists clubs_contact_email_check;
alter table public.clubs
  add constraint clubs_contact_email_check
  check (
    contact_email is null
    or (length(contact_email) between 5 and 254 and contact_email like '%_@_%.__%')
  );

comment on column public.clubs.contact_email is
  'Correo de contacto que el club quiere publicar. Si es null se usa el de su cuenta.';
