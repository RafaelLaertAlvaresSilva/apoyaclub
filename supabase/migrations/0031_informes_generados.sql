-- ---------------------------------------------------------------------
-- 0031 — Cuándo generó el club el informe de cada patrocinador.
--
-- El club tiene que mandarle a cada empresa un informe de progreso a
-- mitad de temporada y otro al final. La plataforma se lo va a
-- recordar, pero un recordatorio a ciegas ("acuérdate de mandar
-- informes") lo ignora todo el mundo a la segunda semana. El que
-- funciona es el concreto: "a Ferretería Ramírez no le has mandado nada
-- esta temporada".
--
-- Para poder decir eso hace falta apuntar cuándo se generó cada uno.
-- Eso es todo lo que guarda esta tabla.
--
-- Importante para no engañar a nadie: esto registra que el club se
-- DESCARGÓ el informe, no que lo enviara. El envío lo hace el club por
-- su cuenta, desde su correo o por WhatsApp, y la plataforma no tiene
-- forma de saberlo ni debe tenerla. Los textos que lea el club dicen
-- "descargaste", nunca "enviaste".
-- ---------------------------------------------------------------------

create table if not exists public.club_sponsor_reports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  -- El mismo texto libre que en club_sponsor_tasks: la empresa no tiene
  -- por qué estar registrada en ApoyaClub.
  company_name text not null,
  format text not null default 'pdf',

  created_at timestamptz not null default now()
);

alter table public.club_sponsor_reports
  drop constraint if exists club_sponsor_reports_format_check;
alter table public.club_sponsor_reports
  add constraint club_sponsor_reports_format_check
  check (format in ('pdf', 'word'));

alter table public.club_sponsor_reports
  drop constraint if exists club_sponsor_reports_company_check;
alter table public.club_sponsor_reports
  add constraint club_sponsor_reports_company_check
  check (length(company_name) between 1 and 120);

-- La consulta de siempre: el último informe de cada empresa de un club.
create index if not exists club_sponsor_reports_club_empresa_idx
  on public.club_sponsor_reports (club_id, company_name, created_at desc);

alter table public.club_sponsor_reports enable row level security;

-- Solo el club, como con las tareas. No lo ve el público ni la empresa.
drop policy if exists "club_sponsor_reports_select_own" on public.club_sponsor_reports;
create policy "club_sponsor_reports_select_own"
  on public.club_sponsor_reports for select
  using (auth.uid() = club_id);

drop policy if exists "club_sponsor_reports_insert_own" on public.club_sponsor_reports;
create policy "club_sponsor_reports_insert_own"
  on public.club_sponsor_reports for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_sponsor_reports_delete_own" on public.club_sponsor_reports;
create policy "club_sponsor_reports_delete_own"
  on public.club_sponsor_reports for delete
  using (auth.uid() = club_id);

-- No hay política de UPDATE a propósito: esto es un registro de lo que
-- pasó y no se corrige. Si sobra una fila se borra.

-- Los permisos de tabla son otra puerta distinta de las políticas, y
-- esta base nunca recibió los automáticos de Supabase (migraciones 0023
-- y 0028). Sin esto sale "permission denied" antes de mirar RLS.
grant select, insert, delete on public.club_sponsor_reports to authenticated;
-- Y se quita el UPDATE, que las reglas por defecto de la migración 0028
-- conceden a toda tabla nueva. La política de RLS ya lo impediría, pero
-- dos puertas cerradas valen más que una, y así el permiso dice lo
-- mismo que la intención: esto es un registro de lo que pasó.
revoke update on public.club_sponsor_reports from authenticated;
grant all privileges on public.club_sponsor_reports to service_role;
revoke all on public.club_sponsor_reports from anon;

comment on table public.club_sponsor_reports is
  'Cuándo se descargó el informe de progreso de cada patrocinador. Sirve para recordarle al club a quién le falta. Registra descargas, no envíos: el envío lo hace el club por su cuenta.';
