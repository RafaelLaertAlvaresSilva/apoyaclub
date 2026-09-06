-- ---------------------------------------------------------------------
-- 0037 — El registro de público en los partidos.
--
-- Hasta ahora el club escribía a mano un número en su ficha,
-- `clubs.average_attendance`, y ese número era exactamente eso: un
-- número escrito a mano. Una empresa que se plantea poner 1.200 € en
-- una valla no tiene forma de saber si detrás hay un recuento o una
-- corazonada, y el club que sí cuenta a su gente no tiene manera de
-- demostrarlo.
--
-- Esta tabla es el recuento. Una fila = un partido jugado, con cuánta
-- gente hubo. De ahí salen la media, el total de la temporada y el
-- mejor partido, que es lo que de verdad se le enseña a un patrocinador:
-- "por delante de tu valla han pasado 4.300 personas este año".
--
-- Decisiones:
--
--   * `attendance` es obligatorio. La tabla se llama registro de
--     público: un partido sin el dato de público no aporta nada aquí y
--     ensuciaría todas las medias con filas vacías.
--
--   * No se guarda ninguna media. Se calcula al leer, como el
--     "caducado" de las tareas (migración 0030). Una media guardada se
--     queda vieja en cuanto alguien corrige un partido, y nadie se
--     entera.
--
--   * `clubs.average_attendance` se queda tal cual, escrita a mano. El
--     club decide con un botón si quiere llevarse la media real a su
--     ficha; no se le pisa el dato por detrás.
--
--   * Es privada. La ficha pública enseña el resumen a través de
--     `average_attendance`, no partido a partido: el calendario de un
--     club de cantera no tiene por qué ser público.
-- ---------------------------------------------------------------------

create table if not exists public.club_matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  played_on date not null,
  -- Contra quién. Texto libre: aquí no hay una base de datos de rivales
  -- de regional y no la va a haber.
  opponent text not null,
  -- Liga, copa, amistoso, torneo de verano...
  competition text,
  -- Qué equipo del club jugó: "Primer equipo masculino", "Cadete A".
  -- Sin esto, un club con ocho equipos mezcla en la misma media al
  -- primer equipo y a los prebenjamines.
  team text,
  -- En casa o fuera. La media que le importa a un patrocinador de valla
  -- es la de casa, y sin este campo no se pueden separar.
  home boolean not null default true,

  attendance integer not null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.club_matches
  drop constraint if exists club_matches_attendance_check;
alter table public.club_matches
  add constraint club_matches_attendance_check
  check (attendance between 0 and 200000);

alter table public.club_matches
  drop constraint if exists club_matches_textos_check;
alter table public.club_matches
  add constraint club_matches_textos_check
  check (
    length(opponent) between 1 and 120
    and (competition is null or length(competition) <= 120)
    and (team is null or length(team) <= 120)
    and (notes is null or length(notes) <= 1000)
  );

-- La consulta de siempre: los partidos de un club, del más reciente al
-- más antiguo.
create index if not exists club_matches_club_fecha_idx
  on public.club_matches (club_id, played_on desc);

drop trigger if exists set_club_matches_updated_at on public.club_matches;
create trigger set_club_matches_updated_at
  before update on public.club_matches
  for each row execute function public.set_updated_at();

alter table public.club_matches enable row level security;

drop policy if exists "club_matches_select_own" on public.club_matches;
create policy "club_matches_select_own"
  on public.club_matches for select
  using (auth.uid() = club_id);

drop policy if exists "club_matches_insert_own" on public.club_matches;
create policy "club_matches_insert_own"
  on public.club_matches for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_matches_update_own" on public.club_matches;
create policy "club_matches_update_own"
  on public.club_matches for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_matches_delete_own" on public.club_matches;
create policy "club_matches_delete_own"
  on public.club_matches for delete
  using (auth.uid() = club_id);

-- Los permisos de tabla van aparte de las políticas: son dos puertas
-- distintas y esta base no recibió nunca los permisos automáticos de
-- Supabase (ver migraciones 0023 y 0028).
grant select, insert, update, delete on public.club_matches to authenticated;
grant all privileges on public.club_matches to service_role;
revoke all on public.club_matches from anon;

comment on table public.club_matches is
  'Registro privado de público por partido. De aquí salen la media, el total y el mejor partido; no se guarda ninguna media calculada.';
comment on column public.club_matches.home is
  'true = partido en casa. La media que le interesa a un patrocinador de valla o de megafonía es la de casa.';
