-- ---------------------------------------------------------------------
-- Datos del club que solo pueden tocar el administrador y Stripe.
--
-- EL HUECO. La política `clubs_update_own` (migración 0001) deja que un
-- club con la sesión abierta actualice SU fila, y el permiso de tabla
-- (0023) es de tabla entera: no distingue columnas. El panel solo
-- manda las columnas de la ficha, pero cualquiera que llame a la API
-- directamente con su sesión podía escribir también, en su propia
-- fila, cosas que no le corresponden:
--
--   - `verified`: ponerse él mismo la insignia de club verificado;
--   - `admin_suspended`, `admin_test_mode`: quitarse una suspensión o
--     el modo de pruebas;
--   - `subscription_status`, `trial_ends_at`, `current_period_end`…:
--     darse la suscripción por pagada, o alargarse la prueba, sin pagar;
--   - `founder_number`: quedarse un número de fundador sin pasar por la
--     reserva, que es la que cuenta las 50 plazas.
--
-- EL ARREGLO. Un trigger que, cuando quien escribe es un usuario con
-- sesión (`authenticated`) o un visitante (`anon`), deja esas columnas
-- como estaban. No da error: la fila se guarda igual con todo lo demás.
-- Así, si algún día un formulario manda la fila entera, no se rompe
-- nada; simplemente esas columnas no cambian.
--
-- QUIÉN SIGUE PUDIENDO. El servidor con la clave de servicio (el
-- webhook de Stripe, el administrador, los cron) entra como
-- `service_role`, y el SQL Editor de Supabase como `postgres`: a esos no
-- les afecta. Tampoco a las funciones SECURITY DEFINER (la reserva de
-- plaza de fundador, por ejemplo), que corren como su dueño.
--
-- EL PLAN. El club sí elige su plan desde el panel antes de pagar
-- (`panel/suscripcion/actions.ts`), así que `plan` se le deja cambiar,
-- salvo a "fundador": ese solo lo pone la reserva de plaza, que es la
-- que comprueba que quedan.
--
-- El nombre del trigger empieza por `clubs_aa_` a propósito: Postgres
-- dispara los triggers BEFORE por orden alfabético, y este tiene que ir
-- antes que `clubs_iniciar_prueba` (0018), que es el que arranca el mes
-- gratis al crear la ficha.
-- ---------------------------------------------------------------------

create or replace function public.proteger_columnas_de_admin_y_pago()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Una ficha nueva arranca siempre igual, la cree quien la cree. El
    -- mes gratis lo pone después `clubs_iniciar_prueba`.
    new.verified := false;
    new.verified_at := null;
    new.admin_suspended := false;
    new.admin_suspended_at := null;
    new.admin_test_mode := false;
    new.admin_test_mode_at := null;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_status := null;
    new.trial_ends_at := null;
    new.current_period_end := null;
    new.cancel_at_period_end := false;
    new.reminder_7d_sent_at := null;
    new.reminder_3d_sent_at := null;
    new.reminder_1d_sent_at := null;
    new.founder_number := null;
    new.founder_reserved_at := null;
    if new.plan = 'fundador' then
      new.plan := null;
    end if;
    return new;
  end if;

  -- UPDATE: todo lo de arriba se queda como estaba.
  new.verified := old.verified;
  new.verified_at := old.verified_at;
  new.admin_suspended := old.admin_suspended;
  new.admin_suspended_at := old.admin_suspended_at;
  new.admin_test_mode := old.admin_test_mode;
  new.admin_test_mode_at := old.admin_test_mode_at;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.subscription_status := old.subscription_status;
  new.trial_ends_at := old.trial_ends_at;
  new.current_period_end := old.current_period_end;
  new.cancel_at_period_end := old.cancel_at_period_end;
  new.reminder_7d_sent_at := old.reminder_7d_sent_at;
  new.reminder_3d_sent_at := old.reminder_3d_sent_at;
  new.reminder_1d_sent_at := old.reminder_1d_sent_at;
  new.founder_number := old.founder_number;
  new.founder_reserved_at := old.founder_reserved_at;
  if new.plan = 'fundador' and old.plan is distinct from 'fundador' then
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

comment on function public.proteger_columnas_de_admin_y_pago() is
  'Impide que un club, con su propia sesión, cambie en su fila la verificación, la suspensión, el modo de pruebas, la suscripción o la plaza de fundador (migración 0054).';

drop trigger if exists clubs_aa_proteger_columnas on public.clubs;
create trigger clubs_aa_proteger_columnas
  before insert or update on public.clubs
  for each row execute function public.proteger_columnas_de_admin_y_pago();

-- ---------------------------------------------------------------------
-- La reserva de plaza de fundador comprueba ahora de quién es la plaza.
--
-- Igual que ya hacía `liberar_plaza_fundador` (0040): esta función corre
-- con permisos elevados, y sin la comprobación un club con sesión podía
-- reservar plazas a nombre de otros clubes y agotar las 50 (se soltaban
-- solas a las 24 horas, pero mientras tanto nadie podía hacerse
-- fundador). El resto de la función es la de 0040, sin cambios.
-- ---------------------------------------------------------------------
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
  -- `auth.uid()` es null cuando la llama el servidor con la clave de
  -- servicio, y ahí sí se permite.
  if auth.uid() is not null and auth.uid() <> p_club_id then
    raise exception 'No puedes reservar una plaza de fundador para otro club.';
  end if;

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

revoke all on function public.reservar_plaza_fundador(uuid) from public, anon;
grant execute on function public.reservar_plaza_fundador(uuid) to authenticated, service_role;
