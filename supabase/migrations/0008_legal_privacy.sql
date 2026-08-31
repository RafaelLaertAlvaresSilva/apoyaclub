-- Fase 11: legal, privacidad y menores.
--
-- Crea `consent_records`, un registro con fecha de cada consentimiento
-- que da un usuario (aceptación de Términos y Política de Privacidad al
-- registrarse; confirmación sobre menores al subir fotos del club). No
-- sustituye a la revisión de un abogado sobre qué debe registrarse ni
-- cuánto tiempo debe conservarse tras eliminar la cuenta: eso queda
-- señalado en el propio código como pendiente de revisión jurídica.
--
-- Cómo aplicar esta migración: pega el contenido de este archivo en
-- Supabase -> SQL Editor -> New query, y ejecútalo. Es seguro volver a
-- ejecutarlo (usa `if not exists` / `or replace` donde es posible).

-- ---------------------------------------------------------------------
-- 1. Tabla `consent_records`
-- ---------------------------------------------------------------------
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Identificador del consentimiento: 'terms_and_privacy' (Términos y
  -- Condiciones + Política de Privacidad, al registrarse) o
  -- 'minors_photo_upload' (confirmación al subir fotos del club sobre
  -- menores identificables, Fase 11). Se guarda como texto libre (sin
  -- `check`) para poder añadir nuevos tipos sin otra migración.
  consent_type text not null,
  -- Versión del texto aceptado (ver `src/lib/legal.ts`), para poder
  -- demostrar qué redacción concreta aceptó el usuario y cuándo.
  version text not null,
  granted_at timestamptz not null default now()
);

comment on table public.consent_records is 'Registro con fecha de los consentimientos del usuario (Fase 11): aceptación de términos/privacidad y confirmaciones sobre menores. PENDIENTE DE REVISIÓN JURÍDICA: qué se registra y cuánto se conserva tras eliminar la cuenta.';

create index if not exists consent_records_user_id_idx on public.consent_records (user_id);

alter table public.consent_records enable row level security;

-- Es un registro de auditoría: solo se puede crear y leer, nunca editar
-- ni borrar desde el cliente (ni siquiera el propio usuario).
drop policy if exists "consent_records_select_own" on public.consent_records;
create policy "consent_records_select_own"
  on public.consent_records for select
  using (auth.uid() = user_id);

drop policy if exists "consent_records_insert_own" on public.consent_records;
create policy "consent_records_insert_own"
  on public.consent_records for insert
  with check (auth.uid() = user_id);
