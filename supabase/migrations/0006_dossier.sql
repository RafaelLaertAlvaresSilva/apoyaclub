-- Fase 9: dossier comercial en PDF.
--
-- Crea la tabla `club_dossiers`: la configuración del dossier de cada
-- club (qué secciones y qué oportunidades incluir) y los datos de su
-- enlace público opcional (token, activo/inactivo, caducidad). El PDF
-- en sí no se guarda en ningún sitio: se genera al vuelo, tanto para la
-- descarga desde el panel como para el enlace público, a partir de esta
-- configuración y de los datos ya existentes del club (perfil,
-- equipos, patrocinadores, oportunidades). Así el dossier siempre
-- refleja los datos más recientes y no hay ningún archivo que limpiar.
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

create table if not exists public.club_dossiers (
  -- Una fila por club (como `clubs`/`companies`): el club solo tiene un
  -- dossier configurado a la vez.
  id uuid primary key references public.clubs (id) on delete cascade,

  -- Claves de las secciones incluidas (identidad, historia, equipos,
  -- cantera, audiencia, instalaciones, patrocinadores). Validadas en el
  -- código de la aplicación, no aquí, para no tener que tocar la base de
  -- datos si se añade o renombra alguna sección más adelante.
  sections jsonb not null default '[]'::jsonb,

  -- Ids de las oportunidades de patrocinio incluidas en el dossier.
  opportunity_ids jsonb not null default '[]'::jsonb,

  -- Enlace público opcional para compartir el dossier sin necesidad de
  -- sesión (por email o WhatsApp). `share_token` se genera solo cuando
  -- el club activa el enlace por primera vez y se renueva cada vez que
  -- lo reactiva tras haberlo desactivado, para que un enlace ya
  -- desactivado no pueda volver a funcionar por sorpresa.
  share_token text unique,
  share_enabled boolean not null default false,
  -- Null = sin fecha de caducidad.
  share_expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.club_dossiers is
  'Configuración del dossier comercial en PDF de un club y de su enlace público opcional (Fase 9).';

drop trigger if exists club_dossiers_set_updated_at on public.club_dossiers;
create trigger club_dossiers_set_updated_at
  before update on public.club_dossiers
  for each row
  execute function public.set_updated_at();

-- Solo el propio club gestiona la configuración de su dossier. El
-- enlace público NO se lee a través de RLS: la ruta pública
-- (`/dossier/[token]`) usa la clave de servicio, igual que ya se hace
-- en otros puntos de la app (p.ej. para leer el email de contacto del
-- club en su página pública), así que no hace falta ninguna política
-- adicional para el visitante anónimo.
alter table public.club_dossiers enable row level security;

drop policy if exists "club_dossiers_select_own" on public.club_dossiers;
create policy "club_dossiers_select_own"
  on public.club_dossiers for select
  using (auth.uid() = id);

drop policy if exists "club_dossiers_insert_own" on public.club_dossiers;
create policy "club_dossiers_insert_own"
  on public.club_dossiers for insert
  with check (auth.uid() = id);

drop policy if exists "club_dossiers_update_own" on public.club_dossiers;
create policy "club_dossiers_update_own"
  on public.club_dossiers for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
