-- ---------------------------------------------------------------------
-- Cómo se contacta con la empresa.
--
-- La migración 0046 dejó que la empresa publicara lo que ofrece, y se
-- olvidó de lo único que hace falta después: cómo la llaman. Un club
-- entraba en su ficha, veía "4 sesiones de fisioterapia al mes a cambio
-- del logo en la camiseta"… y ahí se acababa el camino. Publicar sin
-- forma de contacto no sirve de nada.
--
-- Mismas columnas y mismo criterio que en `clubs`, para que las dos
-- partes de la plataforma funcionen igual:
--
--   * El consentimiento es explícito y va en su propia columna. El
--     nombre y el teléfono de una persona no se publican porque sí,
--     ni aunque la empresa quiera que la llamen.
--
--   * Viene encendido, como en los clubes (migración 0029): quien
--     publica una oferta es porque quiere que le escriban, y dejarlo
--     apagado por defecto obligaría a un paso más que nadie da.
--
--   * Nada de esto entra en la vista pública. Se sirve detrás de un
--     clic, desde el servidor: un correo escrito en el HTML de una
--     página pública lo recoge cualquier robot que pase, y la empresa
--     acaba recibiendo basura por haber querido ayudar a un club.
-- ---------------------------------------------------------------------

alter table public.companies
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists contact_public_consent boolean not null default true;

comment on column public.companies.contact_name is
  'Persona de contacto de la empresa (migración 0047). Solo se enseña si contact_public_consent.';
comment on column public.companies.contact_email is
  'Correo de contacto (migración 0047). Nunca sale en `company_public_profiles`: se sirve detrás de un clic para que no lo recojan los robots de spam.';
comment on column public.companies.contact_phone is
  'Teléfono de contacto (migración 0047). Mismo criterio que el correo.';
comment on column public.companies.contact_public_consent is
  'La empresa acepta que se enseñen sus datos de contacto a quien entre en su ficha (migración 0047). Encendido por defecto, como en los clubes.';

-- La vista pública se deja EXACTAMENTE como estaba. Está escrita aquí
-- para que se vea que es a propósito y no un olvido: ninguna de las
-- columnas de arriba entra aquí. Quien quiera el contacto pasa por
-- /api/contacto-empresa, que comprueba el consentimiento, lleva cuenta
-- de cuántos se piden por hora y no deja nada escrito en el HTML.
