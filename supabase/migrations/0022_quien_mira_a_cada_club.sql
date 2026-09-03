-- ---------------------------------------------------------------------
-- Quién mira a cada club.
--
-- La migración 0014 ya contaba visitas, pero de forma anónima: el club
-- sabía "12 visitas" y nada más. Faltaban las dos preguntas que de
-- verdad importan, tanto para el club como para el administrador de la
-- plataforma:
--
--   1. ¿Cuántas EMPRESAS (no visitantes sueltos) han entrado en la ficha?
--   2. ¿Cuántas han llegado a mirar los datos de contacto?
--
-- La segunda es la señal más valiosa que produce la plataforma: una
-- empresa que abre el teléfono de un club está a un paso de escribirle.
-- Es también la métrica con la que se defiende la cuota: "este mes tres
-- empresas miraron tu contacto" vale más que cualquier gráfica.
--
-- Se guarda quién, no solo cuántos, porque son datos de empresa (una
-- persona jurídica mirando una oferta comercial), no de navegación
-- personal: el club ve el nombre de la empresa, igual que vería quién
-- entra por la puerta del pabellón.
-- ---------------------------------------------------------------------

-- 1. Las visitas pasan a saber si venían de una empresa registrada.
alter table public.club_page_views
  add column if not exists company_id uuid references auth.users (id) on delete set null;

create index if not exists club_page_views_company_idx
  on public.club_page_views (club_id, company_id, created_at desc)
  where company_id is not null;

comment on column public.club_page_views.company_id is
  'Empresa registrada que hizo la visita, si había sesión iniciada. Null en visitas anónimas.';

-- 2. Aperturas de los datos de contacto.
create table if not exists public.club_contact_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  company_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists club_contact_views_club_idx
  on public.club_contact_views (club_id, created_at desc);

create index if not exists club_contact_views_company_idx
  on public.club_contact_views (club_id, company_id)
  where company_id is not null;

alter table public.club_contact_views enable row level security;
-- Sin políticas: la escribe y la lee el servidor con la clave de
-- servicio, igual que el resto de tablas de eventos (0014).

comment on table public.club_contact_views is
  'Una fila cada vez que alguien despliega los datos de contacto de un club. Es la señal previa al primer correo.';
