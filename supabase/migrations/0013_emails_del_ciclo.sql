-- ---------------------------------------------------------------------
-- Emails del ciclo de vida.
--
-- Hasta ahora solo salían tres emails: nueva solicitud al club, aviso de
-- caducidad tras cancelar, y el formulario de contacto de la landing.
-- Faltaban justo los que sostienen la retención:
--
--   - bienvenida cuando alguien confirma su cuenta,
--   - aviso a la empresa cuando el club responde a su solicitud,
--   - recordatorio al club de solicitudes sin abrir a las 48 horas,
--   - aviso de fin de la prueba gratuita (el anterior solo avisaba a
--     quien ya había cancelado).
--
-- Todo lo que se envía una sola vez se apunta aquí para no repetirlo.
-- ---------------------------------------------------------------------

create table if not exists public.email_log (
  user_id uuid not null,
  -- 'welcome_club', 'welcome_empresa', 'trial_3d', 'trial_1d'…
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.email_log enable row level security;

comment on table public.email_log is
  'Emails de una sola vez ya enviados a un usuario (bienvenida, avisos de fin de prueba). Solo lo escribe el servidor con la clave de servicio: RLS activa y sin políticas.';

create index if not exists email_log_kind_idx on public.email_log (kind, sent_at desc);

-- El recordatorio de solicitud sin abrir es por solicitud, no por
-- usuario, así que vive en la propia fila.
alter table public.contact_requests
  add column if not exists unread_reminder_sent_at timestamptz;

comment on column public.contact_requests.unread_reminder_sent_at is
  'Cuándo se recordó al club que esta solicitud seguía sin abrir (48 h). Null = todavía no se ha recordado.';

create index if not exists contact_requests_sin_abrir_idx
  on public.contact_requests (created_at)
  where status = 'new' and unread_reminder_sent_at is null;
