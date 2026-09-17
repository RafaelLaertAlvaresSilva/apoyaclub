-- ---------------------------------------------------------------------
-- Las bajas: qué clubes se han ido y cuándo.
--
-- Hasta ahora, cuando un club borraba su cuenta desde "Privacidad" no
-- quedaba absolutamente nada: la fila se va en cascada y el usuario de
-- Auth también. Eso está bien para el derecho de supresión, pero deja
-- ApoyaClub sin poder responder a la única pregunta que importa cuando
-- alguien se va: cuántos se van, cuándo y después de cuánto tiempo.
--
-- Esta tabla es el registro de esas bajas. Guarda lo justo para contar
-- y para llamar por teléfono si procede:
--
--   · El nombre del club, que es el de una entidad, no el de una
--     persona.
--   · Dónde está, qué plan tenía y si llegó a pagar alguna vez.
--   · Cuándo se dio de alta y cuándo se fue.
--
-- Y NO guarda nada personal: ni el correo, ni el teléfono, ni el
-- nombre de la persona de contacto. Todo eso se va con la cuenta, como
-- tiene que irse. Si algún club pide que se borre también su rastro de
-- aquí, se borra su fila y ya está: nada depende de ella.
-- ---------------------------------------------------------------------

create table if not exists public.club_closures (
  id uuid primary key default gen_random_uuid(),

  -- Sin clave foránea a propósito: la fila del club ya no existe
  -- cuando esta se escribe.
  club_id uuid not null,

  club_name text not null,
  city text,
  province text,

  plan text,
  -- El estado de la suscripción en el momento de irse.
  subscription_status text,
  -- Si llegó a pagar alguna vez, o se fue durante la prueba.
  ever_paid boolean not null default false,

  signed_up_at timestamptz,
  closed_at timestamptz not null default now(),

  -- Quién cerró: el propio club desde su panel, o ApoyaClub.
  closed_by text not null default 'club'
    constraint club_closures_closed_by_check check (closed_by in ('club', 'admin')),

  -- Lo que contó el club al irse, si contó algo.
  reason text
);

comment on table public.club_closures is
  'Registro de bajas de clubes (migración 0045). Se escribe al eliminar la cuenta. No contiene datos personales: ni correo, ni teléfono, ni persona de contacto.';

create index if not exists club_closures_closed_at_idx
  on public.club_closures (closed_at desc);

-- Solo la escribe y la lee el servidor, con la clave de servicio: aquí
-- no entra nadie con sesión de club. Sin GRANT no hay forma de tocarla
-- desde el navegador, ni siquiera con la RLS abierta.
alter table public.club_closures enable row level security;

revoke all on public.club_closures from anon, authenticated;
