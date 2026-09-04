-- ---------------------------------------------------------------------
-- 0030 — Lo que el club le ha prometido a cada patrocinador.
--
-- Un club cierra un patrocinio y con él se lleva una lista de deberes:
-- dos publicaciones en Instagram, un vídeo, una visita de los jugadores
-- a la tienda, el logo en la camiseta. Esa lista hoy vive en la cabeza
-- del que firmó, y por eso el motivo real de que un patrocinador de
-- barrio no renueve casi nunca es el precio: es que en junio nadie sabe
-- decir qué recibió a cambio de sus 1.200 €.
--
-- Esta tabla es esa lista. Una fila = una cosa que hay que hacer para
-- una empresa antes de una fecha.
--
-- Dos decisiones que conviene no deshacer sin pensarlo:
--
--   * `company_name` es texto libre y obligatorio; `sponsor_id` es
--     opcional. La mayoría de los patrocinadores de un club de barrio
--     no van a estar registrados en ApoyaClub ni falta que hace, y
--     obligar a que lo estén dejaría la función sin usar.
--
--   * "Caducado" NO se guarda. Es `status = 'pendiente'` con la fecha
--     ya pasada, y se calcula al mirarlo. Guardarlo obligaría a un
--     proceso que fuera cambiando filas cada noche, y el día que ese
--     proceso fallara el club vería tareas en verde que llevan un mes
--     vencidas — que es peor que no tener la función.
-- ---------------------------------------------------------------------

create table if not exists public.club_sponsor_tasks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  -- A quién se lo ha prometido.
  company_name text not null,
  -- Si además es uno de los patrocinadores de su ficha, se enlaza. Al
  -- borrar el patrocinador la tarea se queda: lo prometido sigue siendo
  -- historia del club aunque la relación se acabe.
  sponsor_id uuid references public.club_sponsors (id) on delete set null,

  -- Qué hay que hacer. Texto libre a propósito: la acción publicitaria
  -- de un club de balonmano no se parece a la de uno de piragüismo, y
  -- un desplegable cerrado solo obliga a elegir "otros".
  action text not null,
  notes text,

  starts_on date,
  due_on date not null,

  status text not null default 'pendiente',
  done_at timestamptz,
  -- Enlace a la publicación, al vídeo o a la foto de la visita. Es lo
  -- que el club le enseña al patrocinador cuando toca renovar; sin esto
  -- la tarea marcada es la palabra de uno contra la del otro.
  proof_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.club_sponsor_tasks
  drop constraint if exists club_sponsor_tasks_status_check;
alter table public.club_sponsor_tasks
  add constraint club_sponsor_tasks_status_check
  check (status in ('pendiente', 'hecho', 'cancelado'));

-- Una tarea hecha tiene fecha de cuándo se hizo, y una que no lo está
-- no la tiene. Sin esto, "hecho" acaba significando cosas distintas
-- según quién lo marcara.
alter table public.club_sponsor_tasks
  drop constraint if exists club_sponsor_tasks_hecho_check;
alter table public.club_sponsor_tasks
  add constraint club_sponsor_tasks_hecho_check
  check ((status = 'hecho') = (done_at is not null));

alter table public.club_sponsor_tasks
  drop constraint if exists club_sponsor_tasks_fechas_check;
alter table public.club_sponsor_tasks
  add constraint club_sponsor_tasks_fechas_check
  check (starts_on is null or due_on >= starts_on);

alter table public.club_sponsor_tasks
  drop constraint if exists club_sponsor_tasks_textos_check;
alter table public.club_sponsor_tasks
  add constraint club_sponsor_tasks_textos_check
  check (
    length(company_name) between 1 and 120
    and length(action) between 1 and 200
    and (notes is null or length(notes) <= 1000)
    and (proof_url is null or length(proof_url) <= 500)
  );

-- La consulta de siempre: las tareas de un club ordenadas por fecha.
create index if not exists club_sponsor_tasks_club_fecha_idx
  on public.club_sponsor_tasks (club_id, due_on);

-- La del aviso de "hoy toca": solo las que siguen pendientes.
create index if not exists club_sponsor_tasks_pendientes_idx
  on public.club_sponsor_tasks (club_id, due_on)
  where status = 'pendiente';

drop trigger if exists set_club_sponsor_tasks_updated_at on public.club_sponsor_tasks;
create trigger set_club_sponsor_tasks_updated_at
  before update on public.club_sponsor_tasks
  for each row execute function public.set_updated_at();

alter table public.club_sponsor_tasks enable row level security;

-- Esto es la agenda interna del club. No la ve nadie más: ni las
-- empresas, ni el público. Por eso no hay ninguna política de lectura
-- pública ni la tabla entra en ninguna vista.
drop policy if exists "club_sponsor_tasks_select_own" on public.club_sponsor_tasks;
create policy "club_sponsor_tasks_select_own"
  on public.club_sponsor_tasks for select
  using (auth.uid() = club_id);

drop policy if exists "club_sponsor_tasks_insert_own" on public.club_sponsor_tasks;
create policy "club_sponsor_tasks_insert_own"
  on public.club_sponsor_tasks for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_sponsor_tasks_update_own" on public.club_sponsor_tasks;
create policy "club_sponsor_tasks_update_own"
  on public.club_sponsor_tasks for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_sponsor_tasks_delete_own" on public.club_sponsor_tasks;
create policy "club_sponsor_tasks_delete_own"
  on public.club_sponsor_tasks for delete
  using (auth.uid() = club_id);

-- Los permisos de tabla van aparte de las políticas: son dos puertas
-- distintas y esta base no recibió nunca los permisos automáticos de
-- Supabase (ver migraciones 0023 y 0028). Sin esto, RLS da igual: la
-- consulta ni siquiera llega a evaluarse y sale "permission denied".
grant select, insert, update, delete on public.club_sponsor_tasks to authenticated;
grant all privileges on public.club_sponsor_tasks to service_role;
revoke all on public.club_sponsor_tasks from anon;

comment on table public.club_sponsor_tasks is
  'Agenda privada del club: lo que le ha prometido a cada patrocinador y para cuándo. No es pública ni la ve la empresa.';
comment on column public.club_sponsor_tasks.status is
  'pendiente | hecho | cancelado. "Caducado" no se guarda: es pendiente con due_on ya pasada, y se calcula al leerlo.';
