# ApoyaClub

Plataforma que conecta clubes deportivos con empresas patrocinadoras.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Supabase
(Postgres + Auth), Stripe (más adelante), Vercel.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto de Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. En **Project Settings -> API** copia:
   - `Project URL`
   - la clave `anon public`
   - la clave `service_role` (secreta, nunca la expongas en el navegador)
3. Copia `.env.local.example` como `.env.local` y rellena esos tres valores.

```bash
cp .env.local.example .env.local
```

4. Ejecuta las migraciones SQL de `supabase/migrations/`, en orden, en
   **SQL Editor** del proyecto de Supabase, pegando el contenido de cada
   archivo y pulsando "Run":
   - `0001_club_profile.sql`: tablas del perfil del club, sus políticas
     de RLS y el bucket de Storage `club-media` (con sus propias
     políticas) donde se guardan el logo y las fotos.
   - `0002_club_public_page.sql`: añade el `slug` de cada club, los
     campos de contacto público y la vista `club_public_profiles` que
     usa la página pública (`/club/[slug]`, Fase 5).
   - `0003_opportunities.sql`: crea la tabla `opportunities` (catálogo de
     oportunidades de patrocinio, Fase 6) y sus políticas de RLS.
   - `0004_search.sql`: coordenadas del club (`latitude`/`longitude`),
     los campos nuevos de `opportunities` (`collaboration_type`,
     `objectives`, `period`) y la vista pública `opportunity_search_view`
     que usa el buscador (`/buscar`, Fase 7).
   - `0005_company_and_contact_requests.sql`: perfil de empresa
     (`companies`), listas de favoritos (`company_favorite_lists`,
     `company_favorites`) y solicitudes de contacto (`contact_requests`),
     con sus políticas de RLS (Fase 8).

### 3. Configurar las URLs de autenticación en Supabase

En **Authentication -> URL Configuration**:

- **Site URL**: `http://localhost:3000` en local (o el dominio de
  producción cuando despliegues).
- **Redirect URLs**: añade `http://localhost:3000/auth/callback` (y la
  versión con tu dominio de producción cuando lo tengas, ej.
  `https://tuapp.vercel.app/auth/callback`).

Esto es necesario para que los enlaces de verificación de email y de
recuperación de contraseña funcionen correctamente.

La confirmación de email ya está activada por defecto en los proyectos
nuevos de Supabase (**Authentication -> Sign In / Providers -> Email** ->
"Confirm email"). Si la desactivaste, vuelve a activarla para que se
cumpla el requisito de verificación de email.

### 4. Arrancar en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Cómo funciona la autenticación (Fase 3)

- **Registro**: dos formularios independientes, `/registro-club` y
  `/registro-empresa`. Cada uno crea el usuario con Supabase Auth y le
  asigna su rol (`club` o `empresa`) en `app_metadata`, un dato que solo
  puede escribir el servidor (con la clave `service_role`), nunca el
  propio usuario.
- **Verificación de email**: tras registrarse, Supabase envía un correo
  de confirmación. El enlace pasa por `/auth/callback`, que intercambia
  el código por una sesión y redirige al panel correspondiente.
- **Inicio de sesión**: `/login`.
- **Recuperación de contraseña**: `/recuperar-password` para solicitar el
  enlace y `/actualizar-password` para establecer la nueva contraseña
  (también a través de `/auth/callback`).
- **Rutas privadas**: `middleware.ts` protege `/panel` (clubes) y
  `/empresa` (empresas). Si no hay sesión, redirige a `/login`; si el rol
  no corresponde a la ruta, redirige a la ruta correcta según el rol.

El panel de empresa (`/empresa`) sigue siendo, de momento, solo una
página protegida con el nombre del usuario y un botón de cerrar sesión;
esa fase se hará más adelante.

## Página pública del club (Fase 5)

Cada club tiene una página pública, sin necesidad de sesión, en
`/club/[slug]`. Pensada para compartirse (por ejemplo por WhatsApp) con
empresas que todavía no conocen la plataforma.

- **Slug**: se asigna solo una vez, en la base de datos (trigger de
  `0002_club_public_page.sql`), a partir del nombre del club. No cambia
  aunque el club edite después su nombre, para no romper enlaces ya
  compartidos.
- **Qué se ve**: solo las secciones que el club haya rellenado (nada de
  bloques vacíos). El bloque "Oportunidades disponibles" es la
  excepción: siempre aparece, con un mensaje de que aún no hay
  oportunidades publicadas (esa funcionalidad llegará en otra fase).
- **Contacto público**: el correo con el que se contacta al club es
  siempre el de su cuenta (no se guarda en ningún sitio nuevo). El
  teléfono y el nombre de la persona de contacto son opcionales
  (sección Identidad del panel) y solo se muestran si el club marca la
  casilla de autorización correspondiente.
- **Quién puede leer qué**: la tabla `clubs` sigue con RLS restringido
  al propio club (sin cambios). La página pública lee de la vista
  `club_public_profiles`, que expone el perfil a cualquier visitante
  pero ya se encarga de ocultar el teléfono y el nombre de contacto
  cuando no hay autorización — así ese filtro no depende de que el
  código de la página lo aplique bien, está también a nivel de base de
  datos. `club_teams` y `club_sponsors` sí tienen una política de
  lectura pública directa (no tienen datos sensibles).
- **SEO y Open Graph**: metadatos, datos estructurados
  (`SportsOrganization`) y una imagen de Open Graph generada al vuelo
  por club (nombre, deporte, localidad y su logo si tiene). Para que
  las URLs de esa imagen salgan bien en producción, define
  `NEXT_PUBLIC_SITE_URL` con el dominio real (ver
  `.env.local.example`).
- **Rendimiento**: la página no depende de la sesión del visitante (usa
  la clave anónima directamente, sin cookies), así que se puede cachear
  (se revalida cada 60 segundos) y las imágenes se sirven optimizadas
  por `next/image`.

## Oportunidades de patrocinio (Fase 6)

En `/panel/oportunidades` el club gestiona su catálogo de oportunidades
de patrocinio: crear, editar, duplicar, archivar/restaurar y eliminar.
Requiere haber completado antes la Identidad del club (Fase 4), porque
cada oportunidad cuelga de esa fila.

- **Campos**: nombre, tipo, qué incluye (descripción), duración y valor.
  Cada campo lleva su propia ayuda contextual con ejemplos reales. El
  **valor lo fija siempre el club**: la plataforma no sugiere ni impone
  ningún precio ni rango.
- **Plantillas rápidas**: para no partir de cero, agrupadas por tipo
  (equipación, pabellón y partidos, redes y contenido, eventos y
  torneos, cantera, servicios en especie). Solo rellenan el nombre y la
  descripción; el club sigue decidiendo el valor.
- **Estados**: disponible, reservada y cerrada, con cambio en un clic
  desde el listado. Archivar oculta la oportunidad (del panel por
  defecto y siempre del catálogo público) sin borrarla; se puede
  restaurar en cualquier momento.
- **Listado**: con filtro por estado y ordenación por valor.
- **Página pública**: las oportunidades disponibles (y no archivadas)
  aparecen automáticamente en `/club/[slug]`, en tarjetas con nombre,
  qué incluye, duración y valor, ordenadas de mayor a menor valor.

Cómo está construido: tabla `opportunities` (una fila por oportunidad,
`club_id` referencia a `clubs`), con RLS igual que `club_teams` /
`club_sponsors` (el club solo lee y escribe las suyas) más una política
de lectura pública restringida a `status = 'available'` y
`archived_at is null`, que es también el filtro que usa la página
pública al consultar la tabla.

Desde la Fase 7, el formulario también tiene tres campos opcionales más
(periodo, forma de colaboración y objetivo) que solo alimentan los
filtros del buscador: ver la sección siguiente.

## Nivel de patrocinador, exclusividad y equipo (Fase 6, ampliación)

Cada oportunidad puede indicar además:

- **Nivel de patrocinador**: principal, oficial, colaborador o libre
  (por defecto). Es lo primero que mira una empresa y se puede filtrar
  por él en `/buscar` (`?patrocinio=principal,oficial`).
- **Exclusividad de sector**: texto libre ("automoción", "seguros"). Se
  muestra en la tarjeta pública y en el buscador.
- **Equipo asociado**: un equipo concreto del club (`club_teams`) o el
  club entero. Se valida en el servidor contra los equipos del propio
  club.

Las oportunidades publicadas antes de la migración `0011` quedan en
nivel "libre", que es exactamente lo que eran.

## Buscador para empresas (Fase 7)

`/buscar` es el buscador público (sin sesión) de oportunidades y clubes:
la funcionalidad que conecta de verdad a las empresas con los clubes.

- **Filtros**: ubicación (provincia, ciudad/código postal y radio en
  km), deporte/categoría/género/nivel de equipo, tipo de oportunidad
  (los 6 de la Fase 6), presupuesto (rango en euros y periodo), forma de
  colaboración (dinero/producto/servicio/mixta) y objetivo (familias,
  jóvenes, comunidad local, deporte femenino, deporte base, visibilidad,
  contenido, clientes, empleados, RSC). Los filtros se reflejan en la
  URL (`/buscar?deporte=...&radio=...`) para poder compartir una
  búsqueda.
- **Dos vistas de resultados**: por oportunidad y por club (agrupando
  las oportunidades de cada club), con un botón para alternar sin
  recargar.
- **Orden**: por cercanía, por valor o por novedad.
- **Paginación**: la primera página se renderiza en el servidor; el
  botón "Cargar más" pide las siguientes a `/api/buscar` sin recargar la
  página.
- **Móvil**: los filtros van en un panel desplegable (cajón lateral); en
  escritorio son una barra lateral fija.
- **Estado vacío**: si no hay resultados, se sugiere ampliar el radio
  (con un botón que lo duplica) o quitar todos los filtros.

Cómo está construido:

- **Geocodificación**: `lib/geocoding.ts` usa el geocodificador gratuito
  de OpenStreetMap (Nominatim, sin clave de API) para convertir
  ciudad/provincia/código postal en coordenadas. Se llama automáticamente
  al guardar la sección Identidad del panel del club (`clubs.latitude`/
  `clubs.longitude`), y también al buscar por radio en `/buscar` (para
  ubicar el centro de búsqueda). Si Nominatim no responde, el guardado
  del club no se bloquea: simplemente ese club se queda sin coordenadas
  hasta el siguiente guardado.
- **Radio en km (MVP)**: con pocos clubes en la plataforma no compensa
  añadir una extensión geoespacial a Postgres. En su lugar,
  `lib/search.ts` prefiltra en SQL por una caja delimitadora simple
  sobre `latitude`/`longitude` (usa el índice `clubs_lat_lng_idx`) y
  calcula la distancia exacta (fórmula de Haversine) y el orden/paginado
  ya en el servidor de Next.js, sobre un lote acotado de candidatos. Si
  el catálogo de clubes crece mucho, esto se puede sustituir por una
  función RPC con la extensión `earthdistance` sin tocar el resto del
  buscador: toda la lógica de distancia vive aislada en `lib/geocoding.ts`
  y `lib/search.ts`.
- **Consulta pública**: todo pasa por la vista `opportunity_search_view`
  (migración `0004_search.sql`), que junta cada oportunidad disponible y
  no archivada con los datos de su club, con el mismo patrón que
  `club_public_profiles` (Fase 5): se crea con permisos del propietario
  de las tablas, así que no hace falta ninguna política de RLS pública
  nueva sobre `clubs`. El filtro por deporte/categoría/género/nivel de
  equipo se resuelve aparte, con una consulta a `club_teams` (esos
  campos son texto libre, así que las opciones del desplegable se
  calculan a partir de los valores que ya existen, no de una lista fija).
- **Tipos y funciones puras** (`lib/search-types.ts`) están separados de
  las consultas a Supabase (`lib/search.ts`) para poder importarlos
  también desde componentes de cliente (el panel de filtros) sin
  arrastrar el cliente de Supabase al navegador.

## Perfil del club (Fase 4)

`/panel` es el panel del club para completar su perfil, dividido en 8
secciones que se guardan de forma independiente (cada una con su propio
botón de guardar y su propia confirmación):

1. **Identidad**: nombre y localidad (únicos campos obligatorios), logo,
   fotos, vídeo (enlace), descripción, provincia, código postal,
   instalaciones, web y redes sociales.
2. **Nivel deportivo**: máxima categoría, competiciones, logros.
3. **Equipos**: alta y baja de equipos (deporte, categoría, género,
   primer equipo/cantera, número de jugadores).
4. **Cantera**: solo datos agregados (equipos, jugadores, familias).
5. **Historia**: año de fundación e hitos.
6. **Audiencia**: seguidores por red social, alcance estimado, asistencia
   media.
7. **Comunidad**: acciones sociales, educativas o benéficas.
8. **Patrocinadores actuales**: nombre, logo y web.

Hasta que no se guarda la Identidad (con nombre y localidad), el resto de
secciones quedan bloqueadas en el panel, porque son datos que cuelgan de
esa fila del club.

Cómo está construido:

- **Datos**: tabla `clubs` (una fila por club, id = id del usuario) más
  `club_teams` y `club_sponsors` para los datos repetibles. Todas con RLS:
  cada club solo puede leer y escribir sus propias filas.
- **Imágenes**: el logo, las fotos y los logos de patrocinadores se
  comprimen en el navegador (sin subir ninguna librería nueva, con
  `<canvas>`) antes de subirse al bucket de Storage `club-media`, dentro
  de la carpeta del propio club.
- **Indicador de progreso**: el panel muestra un "% de perfil completado"
  calculado a partir de cuántos campos opcionales de cada sección están
  rellenos, para animar a completarlo.
- **Guardado por sección**: cada sección es una Server Action distinta
  (`src/app/panel/actions.ts`) que actualiza solo sus columnas, así que
  guardar una sección nunca pisa los datos de otra.

## Panel de empresa y solicitudes de contacto (Fase 8)

`/empresa` es el panel de la empresa, con dos secciones:

1. **Perfil de empresa**: nombre, sector, localidad, web, presupuesto
   orientativo (un rango en euros, opcional) y objetivos de patrocinio
   (mismo catálogo que el buscador, Fase 7). Todos los campos son
   opcionales: a diferencia del club, no hay ninguna sección obligatoria
   que bloquee el resto.
2. **Favoritos** (`/empresa/favoritos`): listas con nombre propio en las
   que la empresa organiza las oportunidades que va guardando desde la
   página pública de cada club (botón "Guardar" en cada oportunidad).
   Puede crear listas nuevas, renombrarlas, eliminarlas y quitar
   elementos sueltos.

Desde la página pública de un club (`/club/[slug]`), una empresa con
sesión iniciada puede pulsar **"Solicitar contacto"** — a nivel de club
(cabecera y sección de contacto) o sobre una oportunidad concreta (en su
tarjeta) — y escribir un mensaje. Eso crea una solicitud que:

- Aparece en el panel del club, en **`/panel/solicitudes`**, con los
  datos de la empresa (nombre, sector, localidad, web, presupuesto
  orientativo, objetivos y su email de contacto) y el mensaje.
- Se envía también por email al club, con un enlace directo a
  `/panel/solicitudes` para responder (ver más abajo).
- Tiene un estado que gestiona el club con un clic: **nueva**, **vista**,
  **en conversación**, **cerrada** o **descartada**.

**Quién ve el botón de solicitar contacto y de guardar en favoritos**: un
visitante sin sesión ve el botón igualmente, pero al pulsarlo va a
`/login` (y vuelve a la misma página tras iniciar sesión); un club que
visite la página de otro club no los ve, porque no tienen sentido para su
rol. Esa comprobación se hace en el navegador (`useSesionActual`, en
`club/[slug]/hooks/`) y no en el servidor, precisamente para no obligar a
la página pública del club a dejar de ser estática y cacheable (Fase 5).

**Importante, como en el resto de la plataforma**: ApoyaClub solo pone en
contacto a las dos partes. No hay chat interno, ni gestión de contratos,
ni cobros entre club y empresa — la conversación sigue por email o
teléfono, directamente entre ellos.

Cómo está construido:

- **Tablas nuevas** (migración `0005_company_and_contact_requests.sql`):
  `companies` (una fila por empresa, id = id del usuario, igual que
  `clubs`), `company_favorite_lists` y `company_favorites` (listas y
  elementos guardados), y `contact_requests` (una fila por solicitud,
  con `opportunity_id` opcional: puede ser sobre una oportunidad
  concreta o sobre el club en general). Todas con RLS: cada empresa solo
  ve y gestiona sus propios datos, y un club solo ve y cambia el estado
  de las solicitudes que ha recibido.
- **Email transaccional**: aislado en `lib/email/resend.ts`, que llama a
  la API HTTP de Resend con `fetch` (sin añadir su paquete como
  dependencia nueva). Si `RESEND_API_KEY`/`RESEND_FROM_EMAIL` no están
  configuradas, la solicitud se crea igual y simplemente no se envía el
  email — nunca bloquea el flujo. Ver `.env.local.example` para cómo
  configurarlo.

## Variables de entorno

Ver `.env.local.example`. Nunca se escriben claves directamente en el
código; todo se lee de variables de entorno.

## Dossier comercial en PDF (Fase 9)

En `/panel/dossier` el club genera su dossier comercial: un PDF en A4,
listo para enviar por email o WhatsApp, con la marca del club en
portada y el pie de ApoyaClub en cada página.

- **Secciones a elegir**: identidad, historia, equipos, cantera,
  audiencia, instalaciones y patrocinadores actuales. Solo se pueden
  marcar las que ya tienen contenido (mismo criterio que la página
  pública del club, Fase 5): no se ofrece incluir un bloque vacío.
- **Oportunidades a elegir**: además de las disponibles, se pueden
  incluir oportunidades reservadas (es el documento comercial del
  propio club, no el catálogo público).
- **Descargar**: genera el PDF al momento con lo que esté marcado en
  ese instante en el formulario (no hace falta guardar nada antes).
- **Compartir con un enlace público**: opcional, sin necesidad de
  sesión (`/dossier/[token]`), con fecha de caducidad opcional. Al
  activarlo se guarda qué secciones y oportunidades lleva ese enlace;
  al reactivarlo tras haberlo desactivado se genera un token nuevo,
  para que un enlace ya desactivado no pueda volver a funcionar por
  sorpresa.

Cómo está construido:

- **Sin archivos guardados**: el PDF no se almacena en ningún sitio.
  Se genera en el servidor (nunca en el navegador) al vuelo, tanto al
  descargarlo desde el panel como al abrir el enlace público, a partir
  de los datos actuales del club — así el dossier siempre refleja la
  última versión del perfil y no hay nada que limpiar ni sincronizar.
  El generador vive en `lib/dossier-pdf.tsx` (con
  [`@react-pdf/renderer`](https://react-pdf.org/), que compone el PDF
  directamente en Node sin necesidad de un navegador headless, ideal
  para una función serverless de Vercel) y lo usan dos rutas: el Route
  Handler autenticado `panel/dossier/pdf` (descarga) y el público
  `dossier/[token]` (enlace compartido).
- **Configuración** (migración `0006_dossier.sql`): tabla
  `club_dossiers` (una fila por club, como `clubs`/`companies`) con las
  secciones y oportunidades elegidas y los datos del enlace público.
  Con RLS igual que el resto (el propio club lee y escribe solo su
  fila); no tiene ninguna política de lectura pública porque el enlace
  compartido no se sirve a través de RLS, sino con la clave de
  servicio, comprobando a mano el token, la activación y la caducidad
  (igual que ya se hace para leer el email de contacto en la página
  pública del club, Fase 5).

## Suscripción y pagos con Stripe (Fase 10)

Los clubes pagan 29,90 €/mes (IVA incluido), con 30 días de prueba
gratuita la primera vez y sin cobro inicial. Las empresas siguen
entrando gratis. La plataforma no gestiona el cobro del patrocinio
entre club y empresa: solo cobra la propia suscripción del club.

### Puesta en marcha (además de lo del apartado 2)

1. Ejecuta la migración `0006_dossier.sql` si aún no lo habías hecho, y
   después `supabase/migrations/0007_subscriptions.sql` (columnas de
   suscripción en `clubs`, y las vistas públicas actualizadas para
   ocultar los clubes sin suscripción activa ni en prueba).
2. Crea una cuenta de Stripe (gratis, sin verificación para trabajar en
   modo test) y sigue los 4 pasos de `.env.local.example` para rellenar
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` y
   `CRON_SECRET`.
3. En local, instala la [CLI de Stripe](https://stripe.com/docs/stripe-cli)
   y deja corriendo en otra terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   (te da un `whsec_...` distinto al de producción: úsalo en tu
   `.env.local` mientras pruebas en local).
4. Para probar el pago, usa una
   [tarjeta de prueba de Stripe](https://stripe.com/docs/testing) (por
   ejemplo `4242 4242 4242 4242`, cualquier fecha futura y cualquier
   CVC).
5. En producción (Vercel): añade las mismas variables de entorno con
   tus claves de producción, crea el endpoint de webhook apuntando a tu
   dominio real, y añade `CRON_SECRET` — Vercel detecta `vercel.json` y
   programa solo el cron diario de avisos de caducidad.

### Cómo funciona

- **Un único plan**: un Price de Stripe de 29,90€/mes con
  `tax_behavior: inclusive`, así el club siempre ve 29,90€ finales sin
  que la plataforma tenga que calcular ni desglosar el IVA aparte.
- **Empezar a pagar**: desde `/panel/suscripcion`, el club abre una
  sesión de **Stripe Checkout** (`iniciarSuscripcion`,
  `app/panel/suscripcion/actions.ts`) con `trial_period_days: 30`: pide
  la tarjeta pero no cobra nada hasta que termina la prueba.
- **Gestionar el pago**: el botón "Gestionar suscripción" abre el
  **portal de cliente** de Stripe (`abrirPortalCliente`), donde el club
  cambia de tarjeta, ve sus facturas o cancela, sin que ApoyaClub tenga
  que construir ninguna de esas pantallas.
- **Estado siempre sincronizado por webhook**: `stripe_customer_id`,
  `stripe_subscription_id`, `subscription_status` (`trialing` / `active`
  / `past_due` / `unpaid` / `canceled`, entre otros), `trial_ends_at`,
  `current_period_end` y `cancel_at_period_end` (columnas nuevas de
  `clubs`, migración `0007`) se actualizan **solo** desde
  `app/api/stripe/webhook/route.ts`, nunca desde las Server Actions:
  así el estado que ve el club siempre refleja lo que de verdad ha
  pasado en Stripe, incluso si cambia algo directamente desde el
  Dashboard.
- **Visibilidad pública**: un club conserva todos sus datos siempre,
  pero su página pública (`/club/[slug]`) y sus oportunidades solo se
  muestran mientras `subscription_status` es `trialing` o `active` —
  es el filtro que ya aplican las vistas `club_public_profiles` y
  `opportunity_search_view` (migración `0007`), así que ningún código
  de página tiene que comprobarlo aparte. El panel (`/panel/...`) sigue
  accesible siempre: el club nunca pierde el acceso a sus propios
  datos, y en `/panel/suscripcion` puede reactivarse cuando quiera.
  **Nota**: al aplicar la migración `0007`, cualquier club que ya
  existiera en tu base de datos (de fases anteriores) empezará con
  `subscription_status` a `null` y por tanto oculto, hasta que se
  suscriba desde el panel (o le pongas el estado a mano en SQL mientras
  pruebas).
- **Avisos en el panel**: `app/panel/layout.tsx` añade una franja en la
  parte superior de todo el panel cuando la suscripción necesita
  atención (sin empezar, con el cobro pendiente, cancelada, o activa
  pero con una cancelación programada); el detalle completo (estado y
  fecha de renovación o de caducidad) está siempre en
  `/panel/suscripcion`.
- **Avisos por email a 7/3/1 días**: solo cuando el club ha cancelado
  (`cancel_at_period_end = true`): es la única fecha de caducidad que
  se conoce con certeza de antemano (un cobro fallido, en cambio, entra
  en los reintentos automáticos de Stripe sin una fecha fija). El cron
  diario `app/api/cron/subscription-reminders/route.ts` (programado en
  `vercel.json`) revisa cada club con cancelación programada y manda,
  como mucho un aviso por ejecución, el más urgente que todavía no se
  haya enviado (columnas `reminder_7d_sent_at` / `reminder_3d_sent_at` /
  `reminder_1d_sent_at`); si el club deshace la cancelación, el webhook
  vacía esas tres columnas para que una futura cancelación las vuelva a
  disparar.

## Legal, privacidad y menores (Fase 11)

Los clubes con cantera gestionan datos relacionados con menores, así que
este bloque no es opcional para poder lanzar.

### Puesta en marcha (además de lo del apartado 2)

1. Ejecuta la migración `supabase/migrations/0008_legal_privacy.sql`:
   crea `consent_records`, el registro con fecha de los consentimientos
   del usuario, con sus políticas de RLS.

### Cómo funciona

- **Páginas legales**: `/aviso-legal`, `/privacidad`, `/cookies` y
  `/condiciones-de-uso` son plantillas de partida (componente
  `AvisoRevisionJuridica` en cada una) escritas a partir de lo que la
  aplicación realmente hace. **No están listas para publicarse: hace
  falta que un abogado las revise** antes de que sean el texto legal
  real del servicio. Cuando se revisen, sube la fecha correspondiente en
  `src/lib/legal.ts` (`LEGAL_VERSIONS`).
- **Banner de cookies**: `CookieBanner` (en el layout raíz) muestra
  "Aceptar" y "Rechazar" con el mismo peso visual y guarda la elección
  con fecha en `localStorage` del navegador. Solo hay cookies técnicas
  activas hoy (sesión de Supabase Auth); si se añaden cookies de
  analítica o publicidad, hay que actualizar este banner y
  `/cookies` antes de activarlas.
- **Aceptación de términos al registrarse**: `/registro-club` y
  `/registro-empresa` tienen una casilla obligatoria de aceptación de
  las Condiciones de Uso y la Política de Privacidad; al crear la
  cuenta se registra ese consentimiento en `consent_records`
  (`registrarConsentimiento`, `src/lib/consent.ts`) usando el cliente
  admin, porque con la confirmación de email activada todavía no hay
  sesión en ese momento.
- **Menores en el perfil del club**: los datos de cantera
  (`CanteraForm`) solo piden totales agregados (equipos, jugadores,
  familias), nunca nombres ni fichas de menores concretos. Antes de
  subir cualquier foto en "Identidad → Fotos del club"
  (`IdentidadForm`), se muestra un aviso explícito y una casilla
  obligatoria de confirmación de que las fotos no incluyen menores
  identificables sin consentimiento; al marcarla se registra también en
  `consent_records` (`registrarConfirmacionMenores`,
  `app/panel/actions.ts`).
- **Exportar y eliminar la cuenta**: tanto el club
  (`/panel/privacidad`) como la empresa (`/empresa/privacidad`) pueden
  descargar un JSON con todos sus datos (`/panel/exportar` y
  `/empresa/exportar`) y eliminar su cuenta de forma permanente
  escribiendo "ELIMINAR" para confirmar. Eliminar la cuenta del club
  cancela primero cualquier suscripción activa en Stripe y borra sus
  imágenes de Storage; en ambos casos, el resto de las filas (perfil,
  equipos, patrocinadores, oportunidades, dossier, favoritos,
  solicitudes de contacto, consentimientos) se borran solas por las
  claves foráneas `on delete cascade` al eliminar el usuario de
  Supabase Auth (`eliminarCuentaClub` / `eliminarCuentaEmpresa`). No hay
  papelera ni recuperación.

**Pendiente antes de dar por cerrada esta fase**: revisión por un
abogado de las cuatro páginas legales y de qué debe conservarse (y
durante cuánto tiempo) en `consent_records` tras eliminar una cuenta —
ambos puntos quedan señalados en el propio código.

## Panel de administración y métricas (Fase 12)

Panel interno de administración, solo para el equipo de ApoyaClub: ver
de un vistazo cuántos clubes están en prueba y cuántos han pagado,
cuánta actividad hay en la plataforma, y poder suspender o verificar un
club. No es una funcionalidad para clubes ni empresas: no hay ningún
enlace hacia aquí en el resto de la aplicación.

### Puesta en marcha (además de lo del apartado 2)

1. Ejecuta la migración `supabase/migrations/0009_admin_panel.sql`:
   añade `verified` y `admin_suspended` a `clubs`, crea `search_logs`
   (con RLS y sin ninguna política: solo la clave de servicio puede
   leerla o escribirla) y actualiza `club_public_profiles` y
   `opportunity_search_view` para que un club suspendido desaparezca de
   la página pública y del buscador.
2. Define `ADMIN_SIGNUP_KEY` en tus variables de entorno (ver
   `.env.local.example`): un secreto largo cualquiera. Sin él no se
   puede crear ninguna cuenta de administrador.
3. Crea tu primera cuenta de admin entrando a `/registro-admin` (sin
   enlace público, solo por URL) con esa clave. Igual que el resto de
   registros, hay que confirmar el email antes de poder iniciar sesión
   en `/login`.

### Cómo funciona

- **Acceso en dos capas**: `/admin` está protegido por rol "admin"
  tanto en `middleware.ts` (igual que `/panel` y `/empresa`) como en
  `src/app/admin/layout.tsx`; además, cada Server Action de
  `/admin/clubes` vuelve a comprobar el rol antes de tocar nada, igual
  que las del resto de la aplicación. El acceso no depende de ocultar
  el enlace: no existe ningún enlace, ni siquiera oculto, hacia `/admin`
  ni hacia `/registro-admin`.
- **Resumen** (`/admin`): tarjetas con clubes en prueba/de pago/
  registrados, empresas registradas, oportunidades publicadas,
  solicitudes de contacto enviadas, búsquedas realizadas y la
  conversión de prueba a pago (`src/lib/admin-metrics.ts`).
- **Clubes** (`/admin/clubes`): un listado con **todas** las cuentas con
  rol "club", no solo las que ya tienen fila en `clubs` (esa tabla se
  crea con `upsert` al guardar el primer dato del perfil, Fase 4, así
  que un club recién registrado que aún no ha abierto su panel también
  tiene que aparecer, con 0% de perfil). Muestra su fecha de alta real,
  el % de perfil completado, el estado de su suscripción y dos acciones
  de un clic:
  - **Suspender / reactivar**: bloqueo total (`admin_suspended`). Un
    club suspendido pierde el acceso a su panel (`middleware.ts` lo
    manda a `/cuenta-suspendida`) y desaparece de su página pública y
    del buscador, sin importar su suscripción.
  - **Verificar / quitar verificación**: insignia pública ("Verificado")
    en `/club/[slug]`, sin relación con la suscripción.
- **Empresas** (`/admin/empresas`): mismo tipo de listado, solo lectura.
- **Búsquedas realizadas**: cada búsqueda nueva en `/buscar` (no cada
  "cargar más", que reutiliza los mismos filtros) se registra en
  `search_logs` (`registrarBusqueda`, en `lib/search.ts`), sin ningún
  dato de quién busca — solo para esta métrica.
- **Conversión de prueba a pago**: es una aproximación, porque no hay
  ningún histórico de eventos de suscripción, solo el estado actual de
  cada club — ver el comentario de `ESTADOS_CONVERTIDOS` en
  `lib/admin-metrics.ts` para la definición exacta y su límite
  conocido.

## Internacionalización (Fase 14)

Arquitectura multiidioma lista para funcionar, pero **todavía sin
traducir nada**: hoy solo existe español, y el objetivo de esta fase es
que añadir un segundo idioma sea cuestión de horas (crear su carpeta de
mensajes y su entrada en la tabla de configuración) y no un rediseño de
la aplicación.

### Cómo funciona

- **Librería**: [next-intl](https://next-intl.dev), la opción estándar
  para App Router con rutas con prefijo de idioma.
- **Rutas**: toda la app vive bajo `src/app/[locale]/...` (español por
  ahora: `/es/...`, siempre con prefijo — `localePrefix: "always"` en
  `src/i18n/routing.ts` — así no hay que cambiar ninguna URL el día que
  se añada el segundo idioma). Las rutas de API (`/api/...`) se quedan
  **fuera** de `[locale]`, tal cual: no son páginas, y el webhook de
  Stripe y el cron necesitan una URL fija.
- **`src/i18n/routing.ts`**: la única fuente de verdad de qué idiomas
  existen (`locales`) y cuál es el de por defecto. La usan el
  middleware, la navegación y la carga de mensajes.
- **`src/i18n/navigation.ts`**: sustitutos de `next/link` y
  `next/navigation` que ya anteponen el idioma actual a cualquier ruta
  interna (`Link`, `redirect`, `useRouter`, `usePathname`). Se usan
  igual que los originales; solo cambia de dónde se importan. Dentro de
  una Server Action o Route Handler, `redirect(...)` necesita el idioma
  explícito — `redirect({ href: "/login", locale })`, con `locale`
  sacado de `getLocale()` (`next-intl/server`) o de `params.locale` — y
  hay que escribirlo siempre como `return redirect(...)`, no como
  sentencia suelta: si no, TypeScript dejar de detectar que esa rama no
  sigue adelante y da error en el código de después (una limitación
  conocida del tipado de next-intl, no un bug de la app).
  Para una URL **externa** (p. ej. la de Stripe Checkout en
  `panel/suscripcion/actions.ts`) hay que seguir usando el `redirect` de
  `next/navigation` tal cual — el de next-intl asume que el destino es
  una ruta interna y le antepondría el idioma, rompiendo la URL.
- **`src/middleware.ts`**: encadena el middleware de next-intl (decide
  el idioma y redirige si la URL no lleva prefijo) con la comprobación
  de sesión/rol que ya existía (Fase 3/12), reutilizando la misma
  respuesta para que las cookies de sesión y el idioma resuelto viajen
  juntos.
- **Textos de interfaz**: en `messages/<locale>/*.json`, repartidos por
  módulo (`common`, `home`, `auth`, `club`, `buscar`, `panel`,
  `empresa`, `admin`, `legal`, `emails`) en vez de un único archivo
  gigante — `src/i18n/request.ts` los carga y fusiona. La extracción
  **ya está hecha** para toda la interfaz: landing, buscador, página
  pública del club, registro y acceso, panel del club, área de empresa,
  panel de administración, componentes compartidos y los emails. El
  texto en español no ha cambiado en ningún sitio: lo único que cambia
  es dónde vive.
  - En componentes de cliente se usa `useTranslations("espacio")`; en
    componentes de servidor y Server Actions, `await
    getTranslations("espacio")`. Los emails piden el traductor con el
    idioma explícito (`routing.defaultLocale`) porque el cron no viene
    de ninguna URL con prefijo de idioma.
  - Las claves se generan a partir del propio texto
    (`guardarPerfil`, `noHayOportunidades`…), así que se leen sin abrir
    el JSON. Las listas (FAQ, pasos, ejemplos de la landing) se leen con
    `t.raw`, y el texto con `<strong>` dentro, con `t.rich`.
  - `tests/unit/i18n-claves.test.ts` recorre el código, encuentra cada
    traductor y comprueba que todas las claves existen en
    `messages/es`. Una clave mal escrita falla en los tests en vez de
    aparecer rota en producción.
- **Las cuatro páginas legales se quedan fuera a propósito**: sus textos
  están pendientes de revisión jurídica y, cuando se abra otro país, no
  se traducen — los reescribe un abogado de ese país. Cuando estén
  cerrados se extraen a `legal.json` como el resto.
- **Formato de moneda, fecha y número**: `src/config/locales.ts` (moneda,
  huso horario) y `src/lib/format.ts` (`formatearMoneda`,
  `formatearFecha`, `formatearNumero`), en vez de instancias sueltas de
  `Intl.NumberFormat("es-ES")` por el código. Solo están migrados a este
  helper los sitios nuevos; las instancias sueltas ya existentes
  (`club/[slug]/page.tsx`, `dossier-pdf.tsx`,
  `panel/suscripcion/page.tsx`) siguen como estaban — de momento dan el
  mismo resultado porque solo hay un idioma — y quedan pendientes de
  pasar por el helper cuando se extraigan los textos de esos módulos.
- **Provincia y deporte**: ya eran texto libre que escribe el club
  (`ClubProfile.province`, `ClubTeam.sport`) y el buscador los saca de
  los valores reales guardados (`lib/search.ts`), no de una lista fija
  en el código — no ha hecho falta crear ninguna tabla de configuración
  para esto. Si algún mercado futuro necesitara una lista cerrada (p.
  ej. un desplegable de provincias), iría en `src/config/locales.ts`.
- **Enlaces sin idioma que ya funcionaban solos**: cualquier enlace
  interno con `<a href="/privacidad">` en vez de `Link` (páginas
  legales, `CookieBanner`) sigue funcionando — next-intl redirige igual
  a `/es/privacidad` — pero da un salto extra; están señalados para
  pasarlos a `Link` cuando se extraigan los textos de esas páginas.
- **Enlaces por email y PDF sin petición de por medio** (recordatorio
  de suscripción por cron, dossier en PDF): usan el idioma por defecto
  (`routing.defaultLocale`) porque no hay ninguna petición de usuario de
  la que sacar el idioma real.

### Cómo añadir un idioma nuevo (cuando llegue el momento)

1. Añadirlo a `locales` en `src/i18n/routing.ts`.
2. Crear `messages/<locale>/*.json` (un archivo por módulo, mismas
   claves que `messages/es/`).
3. Añadir su entrada en `LOCALE_CONFIG` (`src/config/locales.ts`):
   moneda y huso horario.
4. Traducir. Nada de rutas, middleware ni componentes debería tener que
   tocarse.


## Calidad: tests, datos de prueba y monitorización (Fase 15)

### Tests

```bash
npm test          # tests unitarios (Vitest)
npm run test:e2e  # flujos completos (Playwright)
```

- **Unitarios** (`tests/unit/`): lógica pura, sin base de datos ni red.
  Cubren el porcentaje de perfil completado, la ida y vuelta entre los
  filtros del buscador y la URL (incluida la basura que hay que
  ignorar), la agrupación de resultados por club, los estados de
  suscripción, el mapeo de oportunidades y las claves de traducción.
- **Extremo a extremo** (`tests/e2e/`): los cinco flujos críticos
  (registro de club, alta de oportunidad, búsqueda, solicitud de
  contacto y suscripción). Se ejecutan contra una instancia real, así
  que **hay que apuntarlos a un proyecto de Supabase de pruebas, nunca
  al de producción**. Los tests que necesitan credenciales que no todo
  el mundo tiene se saltan solos explicando qué falta:

  ```bash
  # .env.test.local (o variables de entorno)
  E2E_CLUB_EMAIL=...      # un club de prueba ya confirmado
  E2E_CLUB_PASSWORD=...
  E2E_EMPRESA_EMAIL=...   # una empresa de prueba ya confirmada
  E2E_EMPRESA_PASSWORD=...
  PLAYWRIGHT_BASE_URL=... # opcional: si no, arranca `npm run dev` solo
  ```

### Datos de prueba

```bash
npm run seed          # 15 clubes por toda España, con equipos y ~35 oportunidades
npm run seed:limpiar  # borra solo lo que creó el script
```

Se niega a ejecutarse contra producción y marca todos los clubes que
crea con el sufijo `@seed.apoyaclub.test`. Sirve para ver el buscador con
volumen: sin datos no se puede comprobar el criterio de la Fase 7 ("con
10 clubes, una búsqueda de balonmano a 50 km de Valencia hasta 500 €").

### Monitorización

Sentry (opcional) recoge los errores de navegador, servidor y edge. Sin
`NEXT_PUBLIC_SENTRY_DSN` no se inicializa nada y la aplicación funciona
igual. Los dos sitios donde un fallo no lo ve nadie —el webhook de
Stripe y el cron de avisos— pasan por `avisarDeFallo()`
(`src/lib/monitoring.ts`), que etiqueta el error con `zona`: en Sentry,
crea una alerta por email para `zona = stripe-webhook` y
`zona = cron-suscripciones`.

Las variables (`NEXT_PUBLIC_SENTRY_DSN`, y `SENTRY_ORG`,
`SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` solo en Vercel) están explicadas
en `.env.local.example`.

## Migraciones nuevas (0010 - 0012)

Ejecútalas en el SQL Editor de Supabase, en orden, como las anteriores:

- `0010_antiabuso_y_geocache.sql`: tabla `rate_limit_hits` y función
  `consume_rate_limit` (límites de los formularios públicos), y
  `geocode_cache` (la misma ciudad no se pregunta dos veces a
  Nominatim). Las dos con RLS y sin políticas: solo las toca el
  servidor.
- `0011_sponsor_level.sql`: `sponsor_level` (principal / oficial /
  colaborador / libre), `exclusivity` y `team_id` en `opportunities`,
  más la vista del buscador ampliada con esos campos y los del equipo
  asociado.
- `0012_endurecer_acceso_publico.sql`: retira a `anon` el permiso de
  lectura que Supabase concede por defecto sobre las tablas que ningún
  visitante sin sesión necesita (`clubs`, `companies`,
  `contact_requests`, favoritos, dossiers, consentimientos). La RLS
  dejaba de ser el único cerrojo. Las dos vistas públicas siguen siendo
  `SECURITY DEFINER` a propósito; el motivo está escrito en la propia
  migración.

## Límites y protección de los formularios públicos

- Formulario de contacto de la landing: 3 envíos por hora y IP, 5 al día
  por email.
- Solicitud de contacto de una empresa a un club: 10 por hora y empresa.
- Campo trampa (honeypot) invisible en los dos formularios: si viene
  relleno se responde como si todo hubiera ido bien y no se envía nada.
- Geocodificación: caché en base de datos (180 días, guarda también los
  fallos) y tope global de 30 llamadas por minuto a Nominatim. Si se
  supera, la búsqueda sigue funcionando sin filtro de radio en vez de
  romperse.

Si la comprobación de límite falla (la migración 0010 todavía no está
aplicada, Supabase no responde), **se deja pasar**: el objetivo es
frenar ráfagas automáticas, no bloquear a un club real.


## Retención: primeros pasos, métricas y emails del ciclo

Tres piezas que responden a la misma pregunta —"¿y esto para qué me
sirve?"— que un club se hace el día que le llega el recibo.

### Primeros pasos (panel del club)

Un bloque con los tres pasos que dejan la página presentable (identidad,
equipos, primera oportunidad). Desaparece solo cuando están los tres
hechos. La lógica es una función pura, `lib/onboarding.ts`, con sus
tests: qué cuenta como hecho no depende de cómo se pinte.

### Tu mes en ApoyaClub

Cuatro cifras arriba del panel, comparadas con el mismo periodo anterior:

| Métrica | De dónde sale |
|---|---|
| Apariciones en búsquedas | `club_search_appearances`, una fila por búsqueda en la que sale el club |
| Visitas a tu página | `club_page_views`, desde el cliente porque `/club/[slug]` va cacheada |
| Dossieres abiertos | `dossier_views`, al abrirse el enlace público |
| Solicitudes recibidas | `contact_requests`, que ya existía |

Las tres tablas nuevas guardan solo club y fecha: ni IP, ni identificador
de usuario, ni datos de sesión. Las visitas se deduplican por pestaña
(`sessionStorage`) y, en el servidor, por IP y hora reutilizando
`consume_rate_limit`. Si el periodo anterior está a cero no se enseña
porcentaje, y si no hay ningún dato el bloque explica qué hacer en vez de
enseñar cuatro ceros.

### Emails del ciclo

Además de los tres que ya había (nueva solicitud, caducidad tras
cancelar, contacto de la landing), el cron diario y el panel mandan:

- **Bienvenida** al club (con los tres pasos) y a la empresa, cuando
  confirman su cuenta.
- **Respuesta del club**: aviso a la empresa cuando el club abre la
  conversación o descarta su solicitud. Solo si el estado cambia de
  verdad.
- **Solicitudes sin abrir**: recordatorio al club a las 48 horas, un
  email por club aunque tenga varias esperando.
- **Fin del mes gratis**: a 3 y 1 día del primer cobro.

Lo que se manda una sola vez queda apuntado en `email_log`; el
recordatorio de solicitudes, en `contact_requests.unread_reminder_sent_at`.
El cálculo de "qué aviso toca hoy" vive en `lib/fechas.ts`, con tests: es
donde un error se traduce en un email enviado el día que no toca.

### Analítica de producto

`@vercel/analytics` en el layout. No usa cookies ni identifica a nadie,
así que no depende del banner de consentimiento; solo envía datos en los
despliegues de Vercel con la analítica activada, en local no hace nada.
Sirve para lo que la base de datos no puede contar: cuánta gente llega a
la landing y se va sin registrarse.

## Migraciones 0013 y 0014

- `0013_emails_del_ciclo.sql`: tabla `email_log` y
  `contact_requests.unread_reminder_sent_at`.
- `0014_metricas_del_club.sql`: `club_page_views`,
  `club_search_appearances` y `dossier_views`.


## Servicios que el club necesita (`/servicios`)

La otra dirección de la plataforma. El buscador de patrocinio va de
dinero: la empresa paga y el club le da visibilidad. Esto va de lo
contrario, y es la puerta de entrada de la empresa pequeña que no tiene
presupuesto de patrocinio pero sí una clínica de fisioterapia, una
furgoneta o una imprenta.

- El club los publica en su panel, en la pestaña **Servicios que
  buscamos**: categoría, qué necesita y el detalle. Puede marcarlos como
  cubiertos sin perder el histórico.
- Aparecen en su ficha pública con un botón "Puedo ofrecerlo", que
  reutiliza la solicitud de contacto de la Fase 8.
- `/servicios` es el listado para empresas, filtrable por tipo y
  provincia, enlazado desde `/buscar` y en el sitemap.

Como el resto de lo público, sale de una vista (`club_service_needs_public`)
que solo muestra necesidades abiertas de clubes con suscripción activa o
en prueba y no suspendidos.

## Oportunidades repartidas entre varias empresas

"Buscamos 10 empresas que pongan 100 € cada una para el torneo de
Navidad". Se activa poniendo el número de plazas en el formulario de la
oportunidad: a partir de dos, el valor pasa a entenderse **por empresa** y
tanto el buscador como la ficha del club muestran cuántas plazas quedan.

Las plazas cubiertas las lleva el club a mano: la plataforma no reserva
plazas ni cobra nada, igual que no interviene en el resto del acuerdo.

## Plantillas de oportunidad

Están en la tabla `opportunity_templates` (migración 0015), sembrada con
las catorce que antes vivían en el código. Un club puede compartir las
suyas con el botón **Compartir como plantilla**: se comparte el título y
la descripción, nunca el valor ni la exclusividad. Si la migración no
está aplicada, el panel enseña las plantillas del código.

## Migraciones 0015 a 0017

- `0015_plantillas_oportunidad.sql`: `opportunity_templates`.
- `0016_servicios_que_busca_el_club.sql`: `club_service_needs` y su vista
  pública.
- `0017_oportunidades_por_plazas.sql`: `slots_total` y `slots_taken` en
  `opportunities`.
