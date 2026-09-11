-- ---------------------------------------------------------------------
-- El público, equipo por equipo.
--
-- `club_matches.team` era texto libre con una lista de sugerencias. En
-- la práctica no sugería nada: la consulta que llenaba esa lista pedía
-- una columna `name` que la tabla de equipos nunca ha tenido,
-- así que fallaba en silencio y el club acababa escribiendo el nombre a
-- mano, distinto cada vez. Con "Senior masculino", "senior masc." y
-- "1er equipo" repartidos por la libreta, no hay estadística por equipo
-- que valga.
--
-- Ahora el partido apunta al equipo de verdad. El texto se conserva
-- —es el nombre que tenía el equipo el día del partido— para que un
-- equipo borrado no se lleve por delante su historial de público.
-- ---------------------------------------------------------------------

alter table public.club_matches
  add column if not exists team_id uuid references public.club_teams (id) on delete set null;

comment on column public.club_matches.team_id is
  'Equipo que jugó el partido (migración 0039). Null si el club escribió el nombre a mano o si el equipo se borró después; en ese caso queda el texto de `team`.';

create index if not exists club_matches_team_id_idx
  on public.club_matches (team_id);
