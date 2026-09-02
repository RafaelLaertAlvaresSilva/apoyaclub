-- ---------------------------------------------------------------------
-- Métricas del club: qué recibe a cambio de sus 29,90 €.
--
-- El riesgo del negocio no es que un club no se registre, es que pague
-- tres meses, no vea nada y se dé de baja. La plataforma ya sabía
-- cuántas búsquedas se hacían (`search_logs`, Fase 12), pero el club no
-- veía nada de eso: ni cuántas veces había aparecido, ni cuántas visitas
-- tenía su página.
--
-- Tres tablas de eventos, deliberadamente tontas (una fila por evento,
-- sin datos personales ni de sesión): así se puede contar por periodos
-- sin tener que decidir hoy qué agregados harán falta mañana.
-- ---------------------------------------------------------------------

-- 1. Visitas a la página pública del club.
create table if not exists public.club_page_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_page_views_club_idx
  on public.club_page_views (club_id, created_at desc);

alter table public.club_page_views enable row level security;

comment on table public.club_page_views is
  'Una fila por visita a /club/[slug]. Sin IP ni identificador de usuario: solo el club y la fecha. Se deduplica por IP y hora antes de insertar (lib/rate-limit).';

-- 2. Apariciones del club en resultados de búsqueda.
create table if not exists public.club_search_appearances (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_search_appearances_club_idx
  on public.club_search_appearances (club_id, created_at desc);

alter table public.club_search_appearances enable row level security;

comment on table public.club_search_appearances is
  'Una fila por cada vez que una oportunidad del club sale en la primera página de una búsqueda.';

-- 3. Aperturas del dossier compartido por enlace público.
create table if not exists public.dossier_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists dossier_views_club_idx
  on public.dossier_views (club_id, created_at desc);

alter table public.dossier_views enable row level security;

comment on table public.dossier_views is
  'Una fila por apertura del enlace público del dossier de un club.';

-- Las tres las escribe y las lee el servidor con la clave de servicio
-- (RLS activa y sin políticas): el club ve sus números ya agregados en
-- el panel, no la tabla de eventos.
