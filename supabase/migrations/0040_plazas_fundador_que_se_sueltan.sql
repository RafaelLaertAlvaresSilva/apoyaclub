-- ---------------------------------------------------------------------
-- Una plaza de fundador reservada y no pagada vuelve al montón.
--
-- La plaza se reserva ANTES de abrir el pago, y eso está bien: si se
-- reservase después, dos clubes podrían pagar la misma y habría que
-- devolverle el dinero a uno. Lo que faltaba era lo contrario: nadie
-- soltaba la plaza si el club se echaba atrás.
--
-- Pasó en la primera prueba real. Un club abrió el pago de Fundador, no
-- lo terminó, y acabó contratando Temporada; su ficha se quedó diciendo
-- "Plan Temporada" y debajo "eres el club fundador nº 1", con la plaza
-- gastada para siempre. Con 50 plazas contadas y clubes mirando precios
-- antes de decidirse, diez arrepentimientos dejan diez plazas muertas y
-- el undécimo club, que sí quiere pagar, se encuentra con que no quedan.
--
-- Lo que NO cambia: un club que llegó a contratar Fundador conserva su
-- número aunque luego se dé de baja. Esa plaza sí se gastó.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists founder_reserved_at timestamptz;

comment on column public.clubs.founder_reserved_at is
  'Cuándo se reservó la plaza de fundador (migración 0040). Sirve para soltar las reservas que nunca llegaron a pago.';

-- Las plazas que ya existían se dan por reservadas ahora: así ninguna
-- que esté a mitad de un pago en este momento se suelta por sorpresa.
update public.clubs
   set founder_reserved_at = now()
 where founder_number is not null
   and founder_reserved_at is null;

-- La reserva, ahora con fecha.
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
  select founder_number into v_actual from public.clubs where id = p_club_id;
  if v_actual is not null then
    return v_actual;
  end if;

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
         founder_reserved_at = now(),
         plan = 'fundador'
   where id = p_club_id;

  return v_asignado;
end;
$$;

/**
 * Suelta la plaza de un club concreto.
 *
 * Se llama en el momento en que el club contrata otro plan: ahí ya no
 * hay ninguna duda, ha elegido, y no tiene sentido hacerle esperar a
 * que pase el cron para devolver la plaza.
 *
 * No toca el plan: de eso se encarga quien la llama, que es el único
 * que sabe cuál es el nuevo.
 */
create or replace function public.liberar_plaza_fundador(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Esta función corre con permisos elevados, así que tiene que
  -- comprobar de quién es la plaza. Sin esto, cualquier club con la
  -- sesión abierta podría dejar sin plaza de fundador a otro con una
  -- sola llamada. `auth.uid()` es null cuando la llama el servidor con
  -- la clave de servicio, y ahí sí se permite.
  if auth.uid() is not null and auth.uid() <> p_club_id then
    raise exception 'No puedes soltar la plaza de fundador de otro club.';
  end if;

  update public.clubs
     set founder_number = null,
         founder_reserved_at = null
   where id = p_club_id;
end;
$$;

comment on function public.liberar_plaza_fundador(uuid) is
  'Devuelve al montón la plaza de fundador de un club (migración 0040).';

revoke all on function public.liberar_plaza_fundador(uuid) from public;
grant execute on function public.liberar_plaza_fundador(uuid) to authenticated, service_role;

/**
 * Suelta las reservas que no llegaron a nada. Devuelve cuántas.
 *
 * Dos casos, y solo dos:
 *
 *   1. El club acabó en otro plan. No hay nada que esperar: eligió.
 *   2. El club sigue marcado como fundador pero nunca hubo suscripción
 *      en Stripe, y la reserva ya tiene sus horas. Una sesión de pago de
 *      Stripe caduca a las 24 h, así que pasado ese plazo no va a llegar
 *      ningún pago tardío que nos pille soltando la plaza.
 *
 * Un club que sí contrató Fundador y después canceló no entra por
 * ninguno de los dos: conserva su número.
 */
create or replace function public.liberar_plazas_fundador_caducadas(p_horas int default 24)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_soltadas int;
begin
  with liberadas as (
    update public.clubs
       set founder_number = null,
           founder_reserved_at = null,
           -- Al que nunca llegó a pagar se le quita también el plan: si
           -- se le dejara puesto, su panel seguiría diciéndole "Plan
           -- Fundador" para siempre por haber abierto una pantalla de
           -- pago que cerró. Al que sí pagó no se le toca.
           plan = case
                    when plan = 'fundador' and stripe_subscription_id is null then null
                    else plan
                  end
     where founder_number is not null
       and (
         plan is distinct from 'fundador'
         or (
           stripe_subscription_id is null
           and coalesce(founder_reserved_at, now()) < now() - make_interval(hours => p_horas)
         )
       )
    returning 1
  )
  select count(*)::int into v_soltadas from liberadas;

  return v_soltadas;
end;
$$;

comment on function public.liberar_plazas_fundador_caducadas(int) is
  'Devuelve al montón las plazas de fundador reservadas que nunca llegaron a pago (migración 0040). La llama el cron diario.';

revoke all on function public.liberar_plazas_fundador_caducadas(int) from public;
grant execute on function public.liberar_plazas_fundador_caducadas(int) to service_role;
