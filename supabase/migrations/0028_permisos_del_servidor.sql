-- ---------------------------------------------------------------------
-- Permisos de la cuenta con la que trabaja el servidor.
--
-- La migración 0023 arregló los permisos de tabla del usuario con sesión
-- (`authenticated`) porque un club no podía ni guardar su ficha. Pero se
-- dejó fuera a `service_role`, que es la cuenta con la que la plataforma
-- hace todo lo que no puede hacer el propio usuario:
--
--   - contar las visitas a una ficha y las aperturas de contacto,
--   - apuntar las búsquedas,
--   - leer las métricas del club y las del administrador,
--   - mandar los correos del cron.
--
-- Sin esos permisos nada de eso falla a la vista: está escrito para no
-- tumbar la página que lo dispara, así que se traga el error y devuelve
-- cero. El club acaba viendo "todavía no tienes movimientos este mes"
-- después de que una empresa haya entrado en su ficha, haya abierto su
-- teléfono y le haya escrito. Es la peor forma de fallar: en silencio y
-- diciendo justo lo contrario de la verdad.
--
-- Aquí se le dan a `service_role` los permisos que Supabase concede por
-- defecto y que en este proyecto no llegaron a aplicarse.
-- ---------------------------------------------------------------------

grant usage on schema public to service_role;

-- Todo sobre las tablas: es la cuenta del servidor, y su acceso lo
-- limita el código, no la base de datos. La clave nunca sale del
-- servidor (`SUPABASE_SERVICE_ROLE_KEY`, jamás en el navegador).
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Y lo mismo para las tablas que se creen a partir de ahora, para que
-- este agujero no vuelva a abrirse con la próxima migración.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant all privileges on functions to service_role;

-- Las mismas concesiones por defecto para quien tiene sesión iniciada,
-- por el mismo motivo: la migración 0023 arregló las tablas que existían
-- entonces, no las que vengan después.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage on sequences to authenticated;

-- Y se vuelven a cerrar las tablas internas, que el `grant all` de
-- arriba no toca (solo afecta a service_role) pero conviene dejar
-- explícito: nadie con sesión, ni sin ella, las lee ni las escribe.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;
revoke all on public.club_page_views from anon, authenticated;
revoke all on public.club_search_appearances from anon, authenticated;
revoke all on public.club_contact_views from anon, authenticated;
revoke all on public.dossier_views from anon, authenticated;
revoke all on public.search_logs from anon, authenticated;
revoke all on public.email_log from anon, authenticated;
revoke all on public.plataforma_ajustes from anon, authenticated;
