-- ---------------------------------------------------------------------
-- Tres planes en vez de uno.
--
-- Hasta ahora solo existía la cuota mensual de 29,90 €. El problema no
-- es el precio (es el más bajo del mercado español de software para
-- clubes), sino el ritmo de cobro: el patrocinio es estacional y una
-- junta directiva aprueba gastos una vez al año, no cada mes. Un club
-- que paga mes a mes se da de baja en enero, cuando no está buscando
-- patrocinadores.
--
--   mensual    29,90 €/mes  IVA incl.  — sigue existiendo
--   temporada  249 €/año    IVA incl.  — el que se quiere vender
--   fundador   199 €/año    IVA incl.  — solo las 50 primeras plazas,
--                                        precio congelado de por vida
--
-- El plan se guarda aquí, no solo en Stripe, porque hace falta para el
-- área financiera del administrador y para saber cuántas plazas de
-- fundador quedan sin tener que preguntárselo a Stripe en cada visita.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists plan text,
  add column if not exists founder_number int;

alter table public.clubs drop constraint if exists clubs_plan_check;
alter table public.clubs
  add constraint clubs_plan_check
  check (plan is null or plan in ('mensual', 'temporada', 'fundador'));

-- Dos clubes no pueden ser el mismo número de fundador.
create unique index if not exists clubs_founder_number_idx
  on public.clubs (founder_number)
  where founder_number is not null;

comment on column public.clubs.plan is
  'Plan contratado: mensual, temporada o fundador. Null mientras está en el mes gratis sin haber elegido.';
comment on column public.clubs.founder_number is
  'Número de plaza de fundador (1-50). Se asigna al contratar el plan fundador y no se libera aunque el club se dé de baja: la plaza se gastó.';

-- ---------------------------------------------------------------------
-- Plazas de fundador
-- ---------------------------------------------------------------------
-- El número total vive en la base de datos y no en el código para poder
-- ampliarlo sin desplegar, que es justo la decisión que se querrá tomar
-- deprisa si las 50 se agotan.
create table if not exists public.plataforma_ajustes (
  clave text primary key,
  valor int not null,
  actualizado_en timestamptz not null default now()
);

comment on table public.plataforma_ajustes is
  'Ajustes numéricos de la plataforma que el administrador puede cambiar sin desplegar código.';

insert into public.plataforma_ajustes (clave, valor)
values ('plazas_fundador', 50)
on conflict (clave) do nothing;

alter table public.plataforma_ajustes enable row level security;
-- Sin políticas: solo la clave de servicio la lee y la escribe.

/**
 * Reserva la siguiente plaza de fundador para un club, si queda alguna.
 * Devuelve el número asignado, o null si ya están todas ocupadas.
 *
 * Se hace en la base de datos y no en el código de la app porque dos
 * clubes pueden pulsar "contratar" a la vez: el bloqueo de la fila de
 * ajustes serializa las dos peticiones y evita repartir la misma plaza
 * dos veces.
 */
create or replace function public.reservar_plaza_fundador(p_club_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_ocupadas int;
  v_asignado int;
  v_actual int;
begin
  -- Si este club ya tenía plaza, se le devuelve la suya.
  select founder_number into v_actual from public.clubs where id = p_club_id;
  if v_actual is not null then
    return v_actual;
  end if;

  -- El bloqueo de esta fila es lo que serializa las peticiones a la vez.
  select valor into v_total
    from public.plataforma_ajustes
   where clave = 'plazas_fundador'
     for update;

  if v_total is null then
    return null;
  end if;

  select count(*) into v_ocupadas from public.clubs where founder_number is not null;

  if v_ocupadas >= v_total then
    return null;
  end if;

  select coalesce(max(founder_number), 0) + 1 into v_asignado from public.clubs;

  update public.clubs
     set founder_number = v_asignado,
         plan = 'fundador'
   where id = p_club_id;

  return v_asignado;
end;
$$;

comment on function public.reservar_plaza_fundador(uuid) is
  'Asigna la siguiente plaza de fundador libre a un club. Null si ya no quedan.';

/** Cuántas plazas de fundador quedan libres. */
create or replace function public.plazas_fundador_libres()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce((select valor from public.plataforma_ajustes where clave = 'plazas_fundador'), 0)
      - (select count(*)::int from public.clubs where founder_number is not null)
  );
$$;

grant execute on function public.plazas_fundador_libres() to anon, authenticated;
