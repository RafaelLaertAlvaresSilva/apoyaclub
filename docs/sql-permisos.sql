-- ---------------------------------------------------------------------
-- ApoyaClub: permisos de tabla (migracion 0023).
--
-- Arregla el error "permission denied for table clubs" al guardar la
-- ficha del club. Da permiso explicito sobre cada tabla a quien tiene
-- sesion iniciada, y vuelve a cerrar las que solo debe tocar el
-- servidor.
--
-- Se puede ejecutar varias veces sin romper nada.
-- Se pega en Supabase -> SQL Editor -> New query -> Run.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Dar permiso de tabla explícito a quien tiene sesión iniciada.
--
-- En Postgres hay dos puertas antes de escribir en una tabla: el permiso
-- de tabla (GRANT) y, después, la regla de fila (RLS). Todas las
-- migraciones anteriores escribieron con cuidado las reglas de fila y
-- ninguna se ocupó de la primera puerta: se daba por hecho el permiso
-- automático que Supabase concede a las tablas nuevas.
--
-- Cuando ese automatismo no se aplica —y no siempre se aplica—, un club
-- con sesión iniciada y todos sus permisos en regla se encuentra con
-- "permission denied for table clubs" al intentar guardar su ficha. La
-- ficha no se puede rellenar, el logo no se puede subir y nada de esto
-- lo arregla el propio club.
--
-- Aquí se concede lo justo, tabla por tabla. No es un permiso general:
-- la RLS sigue decidiendo qué filas ve y toca cada uno, y las tablas que
-- solo escribe el servidor se quedan fuera a propósito.
-- ---------------------------------------------------------------------

-- Uso del esquema. Sin esto, ningún GRANT de tabla sirve de nada.
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. Tablas del club: las gestiona su dueño desde el panel.
-- ---------------------------------------------------------------------
grant select, insert, update on public.clubs to authenticated;
grant select, insert, update, delete on public.club_teams to authenticated;
grant select, insert, update, delete on public.club_sponsors to authenticated;
grant select, insert, update, delete on public.club_service_needs to authenticated;
grant select, insert, update, delete on public.opportunities to authenticated;
grant select, insert, update, delete on public.club_dossiers to authenticated;

-- Un club no se borra a sí mismo desde el panel (la baja de la cuenta va
-- por otro camino), así que `clubs` no lleva delete.

-- ---------------------------------------------------------------------
-- 2. Tablas de la empresa.
-- ---------------------------------------------------------------------
grant select, insert, update on public.companies to authenticated;
grant select, insert, update, delete on public.company_favorites to authenticated;
grant select, insert, update, delete on public.company_favorite_lists to authenticated;

-- ---------------------------------------------------------------------
-- 3. Tablas que comparten los dos lados.
-- ---------------------------------------------------------------------
-- Las solicitudes las crea la empresa y las actualiza el club al
-- responderlas; ninguno de los dos las borra.
grant select, insert, update on public.contact_requests to authenticated;

-- Las plantillas de oportunidad: se leen las públicas y las propias, y
-- cada uno gestiona las suyas.
grant select, insert, delete on public.opportunity_templates to authenticated;

-- El registro de consentimientos se escribe al aceptar las condiciones y
-- no se modifica nunca: es su valor como prueba.
grant select, insert on public.consent_records to authenticated;

-- ---------------------------------------------------------------------
-- 4. Lectura pública sin sesión
-- ---------------------------------------------------------------------
-- La ficha pública de un club la ve cualquiera, y se sirve de estas dos
-- tablas hijas más las vistas públicas (que ya tienen su grant).
grant select on public.club_teams to anon;
grant select on public.club_sponsors to anon;
grant select on public.opportunities to anon;
grant select on public.opportunity_templates to anon;

-- ---------------------------------------------------------------------
-- 5. Lo que sigue siendo solo del servidor
-- ---------------------------------------------------------------------
-- Estas tablas las escribe la plataforma con su clave de servicio y no
-- las toca nadie más: ni con sesión iniciada ni sin ella. Se revoca de
-- forma explícita para que ningún permiso automático las abra por la
-- puerta de atrás.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;
revoke all on public.club_page_views from anon, authenticated;
revoke all on public.club_search_appearances from anon, authenticated;
revoke all on public.club_contact_views from anon, authenticated;
revoke all on public.dossier_views from anon, authenticated;
revoke all on public.search_logs from anon, authenticated;
revoke all on public.email_log from anon, authenticated;
revoke all on public.plataforma_ajustes from anon, authenticated;

-- Y lo que la migración 0012 ya había cerrado a los visitantes sin
-- sesión, por si el permiso automático lo hubiera vuelto a abrir.
revoke select on public.clubs from anon;
revoke select on public.companies from anon;
revoke select on public.contact_requests from anon;
revoke select on public.company_favorites from anon;
revoke select on public.company_favorite_lists from anon;
revoke select on public.club_dossiers from anon;
revoke select on public.consent_records from anon;
revoke select on public.club_service_needs from anon;

-- ---------------------------------------------------------------------
-- 6. Secuencias
-- ---------------------------------------------------------------------
-- Las tablas con id autonumérico necesitan además permiso sobre su
-- secuencia para poder insertar. Ninguna de las que puede escribir un
-- usuario con sesión lo usa hoy (todas van con uuid), pero dejarlo
-- escrito evita el mismo susto la próxima vez que se añada una.
grant usage on all sequences in schema public to authenticated;
