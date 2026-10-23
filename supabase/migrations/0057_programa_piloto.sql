-- ---------------------------------------------------------------------
-- Programa piloto: 6 meses gratis para los clubes que llegan por la
-- campaña (apoyaclub.com/piloto).
--
-- Cómo se marca un club del piloto: al registrarse desde la página del
-- piloto, el servidor le pone `piloto: true` en `app_metadata` (con la
-- clave de servicio, como el rol). El propio usuario no puede cambiar
-- `app_metadata`, así que nadie puede apuntarse por su cuenta.
--
-- 1) La prueba gratis que arranca al crear la ficha del club (0018)
--    dura 6 meses en vez de 30 días si el club es del piloto. La función
--    pasa a SECURITY DEFINER porque tiene que mirar `auth.users`, que el
--    club con su sesión no puede leer.
--
-- 2) `plazas_piloto_ocupadas()`: cuántas cuentas se han apuntado ya al
--    piloto. La página del piloto la usa para decir cuántas plazas
--    quedan y cerrar cuando se llenan. Solo la puede llamar el servidor.
--
-- Es seguro volver a ejecutarla.
-- ---------------------------------------------------------------------

create or replace function public.iniciar_prueba_gratuita()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  es_piloto boolean := false;
begin
  -- Solo si nadie ha dicho lo contrario: si la fila llega ya con estado
  -- (por ejemplo desde el webhook de Stripe o desde los datos de
  -- prueba), se respeta tal cual.
  if new.subscription_status is null then
    select coalesce(u.raw_app_meta_data ->> 'piloto', '') = 'true'
      into es_piloto
      from auth.users u
     where u.id = new.id;

    new.subscription_status := 'trialing';
    new.trial_ends_at := coalesce(
      new.trial_ends_at,
      now() + case when coalesce(es_piloto, false) then interval '6 months' else interval '30 days' end
    );
    new.current_period_end := coalesce(new.current_period_end, new.trial_ends_at);
  end if;

  return new;
end;
$$;

comment on function public.iniciar_prueba_gratuita() is
  'Arranca la prueba gratis al crear la ficha de un club: 30 días, o 6 meses si viene del programa piloto (migraciones 0018 y 0057).';

create or replace function public.plazas_piloto_ocupadas()
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select count(*)::integer
    from auth.users
   where raw_app_meta_data ->> 'piloto' = 'true';
$$;

comment on function public.plazas_piloto_ocupadas() is
  'Cuántas cuentas se han apuntado al programa piloto (migración 0057). Solo para el servidor.';

revoke all on function public.plazas_piloto_ocupadas() from public, anon, authenticated;
grant execute on function public.plazas_piloto_ocupadas() to service_role;
