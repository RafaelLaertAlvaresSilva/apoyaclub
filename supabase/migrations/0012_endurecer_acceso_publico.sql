-- ---------------------------------------------------------------------
-- Endurecer el acceso anónimo a las tablas base.
--
-- Contexto: las dos vistas públicas (`club_public_profiles` y
-- `opportunity_search_view`) se crean sin `security_invoker`, así que
-- leen las tablas base con los permisos de su propietario y se saltan
-- la RLS. Eso es deliberado y no se cambia aquí, porque es lo que
-- permite publicar una proyección recortada de `clubs`: la vista decide
-- qué columnas salen (por ejemplo, el teléfono solo si el club dio su
-- consentimiento) y qué filas (solo suscripción activa o en prueba, y no
-- suspendidos). Pasarlas a `security_invoker` obligaría a dar a `anon`
-- permiso de lectura sobre esas mismas columnas de `clubs`, con lo que
-- se podría consultar la tabla directamente y leer el teléfono sin
-- consentimiento y los identificadores de Stripe: sería peor, no mejor.
--
-- Lo que sí se corrige es que la RLS fuera el ÚNICO cerrojo sobre las
-- tablas con datos sensibles. Supabase concede por defecto SELECT a los
-- roles `anon` y `authenticated` sobre todo lo que hay en `public`, así
-- que una política mal escrita en el futuro bastaría para exponer una
-- tabla entera. Aquí se retira ese permiso a `anon` en las tablas que
-- ningún visitante sin sesión necesita leer directamente.
--
-- Lo que un visitante anónimo sigue pudiendo leer (y debe poder):
--   - las dos vistas públicas,
--   - `opportunities` (política pública: solo disponibles y no
--     archivadas),
--   - `club_teams` y `club_sponsors`, que alimentan la ficha pública.
-- ---------------------------------------------------------------------

revoke select on public.clubs from anon;
revoke select on public.companies from anon;
revoke select on public.contact_requests from anon;
revoke select on public.company_favorites from anon;
revoke select on public.company_favorite_lists from anon;
revoke select on public.club_dossiers from anon;
revoke select on public.consent_records from anon;

-- Tablas internas creadas en la migración 0010: nadie salvo el servidor
-- las toca, ni siquiera con sesión iniciada.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;

comment on view public.club_public_profiles is 'Vista pública de clubs (Fase 5): usada por /club/[slug]. Igual que `clubs`, pero contact_name/contact_phone solo se ven si contact_public_consent es true, solo incluye clubes con suscripción activa o en prueba (Fase 10) y excluye los suspendidos por un admin (Fase 12). Deliberadamente SECURITY DEFINER: es la única forma de publicar una proyección recortada de `clubs` sin dar acceso directo a la tabla (ver migración 0012). Al añadir una columna a esta vista se está publicando ese dato: revísalo antes.';
