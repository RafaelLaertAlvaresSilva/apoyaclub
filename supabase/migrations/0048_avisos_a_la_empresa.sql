-- ---------------------------------------------------------------------
-- Avisar a la empresa cuando aparece algo que le encaja.
--
-- Una empresa entra una vez, publica lo que ofrece y no vuelve. No
-- porque no le interese: porque no tiene motivo para volver a mirar. El
-- club que necesitaba justo su servicio se apuntó tres semanas después,
-- y nadie se lo contó a nadie.
--
-- Esto lo arregla: un correo cuando un club publica una necesidad de la
-- misma categoría que algo que la empresa ofrece. No hay preferencias
-- que rellenar — lo que le interesa ya lo dijo al publicar.
--
-- Tres decisiones que conviene no deshacer:
--
--   * Se apunta lo que ya se ha avisado, por pareja empresa-necesidad.
--     Sin esto, el mismo aviso saldría cada día hasta que la empresa se
--     diera de baja de todo, harta.
--
--   * Cada empresa lleva su propia llave para darse de baja de los
--     avisos sin iniciar sesión. Obligar a recordar la contraseña para
--     dejar de recibir correos es la forma más rápida de que te marquen
--     como spam, que es mucho peor que perder un suscriptor.
--
--   * Los avisos vienen encendidos. Quien publica una oferta quiere que
--     le lleguen clubes; el correo es el servicio, no un extra. La
--     casilla para apagarlos está a la vista en su panel y en el pie de
--     cada correo.
-- ---------------------------------------------------------------------

alter table public.companies
  add column if not exists alerts_enabled boolean not null default true,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists companies_unsubscribe_token_key
  on public.companies (unsubscribe_token);

comment on column public.companies.alerts_enabled is
  'La empresa quiere recibir avisos cuando un club publique algo de su categoría (migración 0048).';
comment on column public.companies.unsubscribe_token is
  'Llave para darse de baja de los avisos desde el propio correo, sin iniciar sesión (migración 0048).';

-- ---------------------------------------------------------------------
-- Lo que ya se ha avisado
-- ---------------------------------------------------------------------
create table if not exists public.company_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  sent_at timestamptz not null default now(),

  unique (company_id, opportunity_id)
);

comment on table public.company_alerts_sent is
  'Qué necesidad de club se le ha avisado ya a qué empresa (migración 0048). Evita repetir el mismo aviso cada día.';

create index if not exists company_alerts_sent_company_idx
  on public.company_alerts_sent (company_id, sent_at desc);

-- Solo la escribe el servidor, desde la tarea diaria. Aquí no entra
-- nadie con sesión de empresa ni de club.
alter table public.company_alerts_sent enable row level security;
revoke all on public.company_alerts_sent from anon, authenticated;
