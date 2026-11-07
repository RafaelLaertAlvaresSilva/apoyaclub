-- ---------------------------------------------------------------------
-- Avisos de zona: "avísame cuando haya un club aquí" (7-11-2026).
--
-- Una empresa de Alicante entra en el buscador, filtra por su provincia
-- y no sale nada. Hasta ahora se iba sin dejar rastro y no volvía. Con
-- esto deja su correo (sin crear cuenta) y le escribimos cuando aparece
-- algo nuevo en su zona.
--
-- Decisiones:
--   * Sin cuenta: pedir registrarse a quien todavía no ha visto nada es
--     perderlo. Solo el correo y lo que estaba buscando.
--   * Una llave por aviso para darse de baja desde el correo, sin
--     iniciar sesión (como los avisos de empresas, migración 0048).
--   * Como mucho un correo por semana por aviso (lo controla la tarea
--     diaria con `last_sent_at`).
--   * Solo la escribe y la lee el servidor: aquí no entra nadie con
--     sesión de club ni de empresa.
-- ---------------------------------------------------------------------

create table if not exists public.zone_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 254),
  country text not null default 'ES' check (country in ('ES', 'PT', 'BR')),
  province text,
  sport text,
  locale text not null default 'es' check (locale in ('es', 'pt', 'en', 'br')),
  active boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);

comment on table public.zone_alerts is
  'Quien pide que le avisemos cuando haya clubes en una zona, sin crear cuenta (migración 0061).';

create unique index if not exists zone_alerts_unsubscribe_token_key
  on public.zone_alerts (unsubscribe_token);

-- El mismo correo para la misma zona y el mismo deporte, una sola vez.
create unique index if not exists zone_alerts_unico
  on public.zone_alerts (lower(email), country, coalesce(province, ''), coalesce(sport, ''));

create index if not exists zone_alerts_activos
  on public.zone_alerts (active, last_sent_at);

alter table public.zone_alerts enable row level security;
revoke all on public.zone_alerts from anon, authenticated;
