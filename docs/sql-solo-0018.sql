-- ---------------------------------------------------------------------
-- El mes gratis empieza al crear el club, sin pasar por Stripe.
--
-- Hasta ahora `subscription_status` se quedaba en null hasta que el club
-- pasaba por el checkout, y las vistas públicas solo muestran clubes en
-- prueba o activos. Resultado: un club recién registrado no aparecía ni
-- en su propia página ni en el buscador, y para verse tenía que poner
-- una tarjeta. Justo lo contrario de lo que dice la oferta ("1 mes
-- gratis") y de lo que hace falta para enseñárselo a los primeros
-- clubes.
--
-- Con esto, al crearse la ficha del club empieza su mes de prueba. Si
-- después se suscribe, el webhook de Stripe manda: escribe el estado
-- real de la suscripción encima.
-- ---------------------------------------------------------------------

create or replace function public.iniciar_prueba_gratuita()
returns trigger
language plpgsql
as $$
begin
  -- Solo si nadie ha dicho lo contrario: si la fila llega ya con estado
  -- (por ejemplo desde el webhook de Stripe o desde los datos de
  -- prueba), se respeta tal cual.
  if new.subscription_status is null then
    new.subscription_status := 'trialing';
    new.trial_ends_at := coalesce(new.trial_ends_at, now() + interval '30 days');
    new.current_period_end := coalesce(new.current_period_end, new.trial_ends_at);
  end if;

  return new;
end;
$$;

comment on function public.iniciar_prueba_gratuita() is
  'Arranca el mes gratis al crear la ficha de un club, sin tarjeta ni Stripe (migración 0018).';

drop trigger if exists clubs_iniciar_prueba on public.clubs;
create trigger clubs_iniciar_prueba
  before insert on public.clubs
  for each row execute function public.iniciar_prueba_gratuita();

-- Los clubes que ya existían sin estado también entran en su mes
-- gratis: hasta ahora estaban invisibles sin saberlo.
update public.clubs
   set subscription_status = 'trialing',
       trial_ends_at = coalesce(trial_ends_at, now() + interval '30 days'),
       current_period_end = coalesce(current_period_end, now() + interval '30 days')
 where subscription_status is null;
