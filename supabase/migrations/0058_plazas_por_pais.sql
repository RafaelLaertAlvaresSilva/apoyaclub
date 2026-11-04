-- ---------------------------------------------------------------------
-- Plazas por país: cada país tiene sus 50 plazas de Fundador y sus 20
-- de "6 meses gratis" (decidido por Rafael el 4-11-2026).
--
-- El país de un club vive en su cuenta (`auth.users.raw_app_meta_data
-- ->> 'pais'`: ES, PT o BR), donde el club no puede cambiarlo. Las
-- cuentas antiguas no tienen país: son todas de España.
--
-- 1) `pais_de_la_cuenta(uuid)`: el país de una cuenta, con España por
--    defecto. Solo para estas funciones.
--
-- 2) Fundador: `reservar_plaza_fundador` cuenta solo las plazas del
--    país del club, y numera dentro de su país (el primer fundador de
--    Brasil es el n.º 1 de Brasil). Por eso el número deja de ser único
--    en toda la tabla: ahora es único dentro de cada país. Dos reservas
--    a la vez no pueden coger el mismo número porque las dos pasan, una
--    detrás de otra, por el bloqueo de la fila de ajustes.
--    `plazas_fundador_libres(pais)` dice cuántas quedan en un país; la
--    versión sin argumento sigue existiendo y es la de España.
--
-- 3) 6 meses gratis: `plazas_piloto_ocupadas(pais)` cuenta solo las
--    cuentas del piloto de ese país; la versión sin argumento sigue
--    contándolas todas (por si la web publicada aún la usa).
--
-- Es seguro volver a ejecutarla.
-- ---------------------------------------------------------------------

create or replace function public.pais_de_la_cuenta(p_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
           when u.raw_app_meta_data ->> 'pais' in ('ES', 'PT', 'BR') then u.raw_app_meta_data ->> 'pais'
           else 'ES'
         end
    from auth.users u
   where u.id = p_id;
$$;

comment on function public.pais_de_la_cuenta(uuid) is
  'País de una cuenta (ES, PT o BR; España si no tiene). Migración 0058.';

revoke all on function public.pais_de_la_cuenta(uuid) from public, anon, authenticated;
grant execute on function public.pais_de_la_cuenta(uuid) to service_role;

-- El número de fundador pasa a ser único dentro de cada país.
drop index if exists public.clubs_founder_number_idx;

create or replace function public.reservar_plaza_fundador(p_club_id uuid)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_total int;
  v_ocupadas int;
  v_asignado int;
  v_actual int;
  v_pais text;
begin
  -- `auth.uid()` es null cuando la llama el servidor con la clave de
  -- servicio, y ahí sí se permite.
  if auth.uid() is not null and auth.uid() <> p_club_id then
    raise exception 'No puedes reservar una plaza de fundador para otro club.';
  end if;

  select founder_number into v_actual from public.clubs where id = p_club_id;
  if v_actual is not null then
    return v_actual;
  end if;

  -- Bloquea la fila de ajustes: las reservas pasan de una en una.
  select valor into v_total
    from public.plataforma_ajustes
   where clave = 'plazas_fundador'
     for update;

  if v_total is null then
    return null;
  end if;

  v_pais := coalesce(public.pais_de_la_cuenta(p_club_id), 'ES');

  select count(*) into v_ocupadas
    from public.clubs c
   where c.founder_number is not null
     and coalesce(public.pais_de_la_cuenta(c.id), 'ES') = v_pais;

  if v_ocupadas >= v_total then
    return null;
  end if;

  select coalesce(max(c.founder_number), 0) + 1 into v_asignado
    from public.clubs c
   where coalesce(public.pais_de_la_cuenta(c.id), 'ES') = v_pais;

  update public.clubs
     set founder_number = v_asignado,
         founder_reserved_at = now(),
         plan = 'fundador'
   where id = p_club_id;

  return v_asignado;
end;
$$;

revoke all on function public.reservar_plaza_fundador(uuid) from public, anon;
grant execute on function public.reservar_plaza_fundador(uuid) to authenticated, service_role;

create or replace function public.plazas_fundador_libres(p_pais text)
returns int
language sql
stable
security definer
set search_path = public, auth
as $$
  select greatest(
    0,
    coalesce((select valor from public.plataforma_ajustes where clave = 'plazas_fundador'), 0)
      - (select count(*)::int
           from public.clubs c
          where c.founder_number is not null
            and coalesce(public.pais_de_la_cuenta(c.id), 'ES') = p_pais)
  );
$$;

comment on function public.plazas_fundador_libres(text) is
  'Plazas de fundador libres en un país (ES, PT o BR). Migración 0058.';

grant execute on function public.plazas_fundador_libres(text) to anon, authenticated, service_role;

create or replace function public.plazas_piloto_ocupadas(p_pais text)
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select count(*)::integer
    from auth.users
   where raw_app_meta_data ->> 'piloto' = 'true'
     and case
           when raw_app_meta_data ->> 'pais' in ('ES', 'PT', 'BR') then raw_app_meta_data ->> 'pais'
           else 'ES'
         end = p_pais;
$$;

comment on function public.plazas_piloto_ocupadas(text) is
  'Cuántas cuentas de un país se han apuntado a los 6 meses gratis (migración 0058). Solo para el servidor.';

revoke all on function public.plazas_piloto_ocupadas(text) from public, anon, authenticated;
grant execute on function public.plazas_piloto_ocupadas(text) to service_role;
