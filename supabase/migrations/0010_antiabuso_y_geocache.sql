-- ---------------------------------------------------------------------
-- Fase 15: protección anti-abuso de los formularios públicos y caché de
-- geocodificación.
--
-- Dos problemas que tenía la aplicación:
--
-- 1. Ni el formulario de contacto de la landing ni la solicitud de
--    contacto de una empresa tenían ningún límite de envíos. Un script
--    podía llenar la bandeja de un club (y la factura de Resend) en
--    minutos.
-- 2. Cada búsqueda con radio geocodificaba la ciudad llamando a
--    Nominatim (OpenStreetMap), que es gratuito pero pide como mucho una
--    petición por segundo. Una ráfaga de búsquedas anónimas bastaba para
--    que nos bloquearan la IP y el radio dejara de funcionar para todos.
--
-- Las dos tablas son de uso interno: RLS activada y ninguna política,
-- así que solo la clave de servicio (código de servidor) las toca.
-- ---------------------------------------------------------------------

-- 1. Contador de intentos por "cubo" (formulario) e identificador
--    (IP, id de empresa, email...).
create table if not exists public.rate_limit_hits (
  id bigserial primary key,
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, identifier, created_at desc);

alter table public.rate_limit_hits enable row level security;

comment on table public.rate_limit_hits is
  'Fase 15: intentos registrados para limitar los formularios públicos. Solo la clave de servicio escribe y lee aquí (RLS activa sin políticas).';

-- 2. Cuenta un intento y dice si se puede seguir adelante.
--    Devuelve true cuando queda cupo (y lo consume), false cuando se ha
--    superado el límite. De paso limpia lo que ya ha caducado para esa
--    misma clave, así que la tabla no crece indefinidamente.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_hits
   where bucket = p_bucket
     and identifier = p_identifier
     and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*)
    into v_count
    from public.rate_limit_hits
   where bucket = p_bucket
     and identifier = p_identifier
     and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket, identifier) values (p_bucket, p_identifier);
  return true;
end;
$$;

comment on function public.consume_rate_limit(text, text, integer, integer) is
  'Fase 15: true si queda cupo para (bucket, identifier) en la ventana dada, consumiéndolo; false si se ha superado el límite.';

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from anon;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from authenticated;

-- 3. Caché de geocodificación: la misma ciudad no se vuelve a preguntar
--    a Nominatim. Se guardan también los fallos (`found = false`) para
--    no reintentar en bucle una dirección que no existe.
create table if not exists public.geocode_cache (
  query text primary key,
  latitude double precision,
  longitude double precision,
  found boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.geocode_cache enable row level security;

comment on table public.geocode_cache is
  'Fase 15: resultados de geocodificación (Nominatim) cacheados por texto de consulta normalizado. Solo la clave de servicio accede.';
