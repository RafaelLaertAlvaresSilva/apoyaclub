-- ---------------------------------------------------------------------
-- 0034 — Solicitar contacto sin tener cuenta.
--
-- ApoyaClub deja de pedirle cuenta a la empresa. Quien entra en la
-- ficha de un club ve todo y puede escribirle sin registrarse: cada
-- paso entre la empresa y el club era un patrocinio menos.
--
-- Lo que NO se hace aquí, a propósito: no se borra ninguna tabla ni
-- ninguna columna. `companies`, `company_favorites`, `club_proposals` y
-- `contact_requests.company_id` se quedan como están, con sus datos. Es
-- una decisión de producto reversible y una migración que borra datos
-- no lo es. Lo que se ha quitado es el acceso desde la web.
--
-- Aquí solo se abre `contact_requests` a quien no tiene cuenta: la
-- solicitud pasa a llevar los datos de quien escribe.
-- ---------------------------------------------------------------------

alter table public.contact_requests alter column company_id drop not null;

alter table public.contact_requests add column if not exists sender_name text;
alter table public.contact_requests add column if not exists sender_company text;
alter table public.contact_requests add column if not exists sender_email text;
alter table public.contact_requests add column if not exists sender_phone text;

-- O viene de una cuenta (las de antes) o trae nombre y correo de quien
-- escribe. Una solicitud sin ninguna de las dos cosas no le sirve al
-- club: no tendría a quién contestar.
alter table public.contact_requests drop constraint if exists contact_requests_remitente_check;
alter table public.contact_requests
  add constraint contact_requests_remitente_check
  check (
    company_id is not null
    or (sender_name is not null and sender_email is not null)
  );

alter table public.contact_requests drop constraint if exists contact_requests_sender_check;
alter table public.contact_requests
  add constraint contact_requests_sender_check
  check (
    (sender_name is null or length(sender_name) between 2 and 120)
    and (sender_company is null or length(sender_company) <= 120)
    and (sender_email is null or sender_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$')
    and (sender_phone is null or length(sender_phone) <= 40)
  );

comment on column public.contact_requests.company_id is
  'Cuenta de empresa que la envió, cuando ApoyaClub tenía cuentas de empresa. Null en las solicitudes sin cuenta (migración 0034).';
comment on column public.contact_requests.sender_email is
  'Correo de quien escribe. Es a donde el club responde, así que sin esto la solicitud no vale de nada.';

-- Las solicitudes sin cuenta las crea el servidor con la clave de
-- servicio, nunca el navegador: no hay ninguna política de inserción
-- para anon, y no debe haberla. Dejar insertar directamente en esta
-- tabla desde el navegador sería abrir un buzón de spam para todos los
-- clubes a la vez. El control de abuso (límite por IP, campo trampa)
-- vive en el servidor, en `club/[slug]/contact-actions.ts`.
revoke all on public.contact_requests from anon;
