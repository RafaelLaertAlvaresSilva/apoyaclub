# Brief para la revisión jurídica

Lo que necesita saber un abogado para revisar ApoyaClub, en una página.
La idea es que no tenga que reconstruir el producto a partir de los
textos: cuanto más claro sea esto, más barata y más rápida sale la
revisión.

**Qué hay que revisar:** los cuatro textos legales del sitio, que están
escritos y marcados como pendientes de revisión.

| Texto | Ruta en el sitio | Archivo |
|---|---|---|
| Aviso legal | `/es/aviso-legal` | `src/app/[locale]/aviso-legal/page.tsx` |
| Política de privacidad | `/es/privacidad` | `src/app/[locale]/privacidad/page.tsx` |
| Política de cookies | `/es/cookies` | `src/app/[locale]/cookies/page.tsx` |
| Condiciones de uso | `/es/condiciones-de-uso` | `src/app/[locale]/condiciones-de-uso/page.tsx` |

## Qué es ApoyaClub

Una plataforma web que conecta clubes deportivos con empresas que
quieren patrocinarlos. El club publica una página con su información y
un catálogo de oportunidades de patrocinio; la empresa busca, filtra y
contacta directamente con el club.

- **El club es el cliente de pago**: primer mes gratis y después
  29,90 €/mes con IVA incluido, sin permanencia.
- **La empresa entra gratis**, sin coste ni por buscar ni por contactar.
- **Comisión del 0 %.** La plataforma no cobra nada del patrocinio, no
  interviene en el acuerdo, no actúa como agencia ni como intermediario
  de pagos: pone en contacto a las dos partes y ahí termina su papel.
  Esto es importante para las condiciones de uso: la responsabilidad del
  acuerdo es de club y empresa.
- Titular: autónomo dado de alta en España. Mercado: España; la
  arquitectura está preparada para más países, pero hoy no hay ninguno.

## Datos personales que se tratan

**De los usuarios registrados** (responsable: la plataforma):

- Club: email, contraseña (gestionada por Supabase Auth), nombre del
  club, localidad, provincia, código postal, web y redes, y de forma
  opcional un nombre y un teléfono de contacto que **solo se publican si
  el club marca expresamente la casilla de consentimiento**.
- Empresa: email, contraseña, nombre, sector, localidad, web y
  presupuesto orientativo.
- Solicitudes de contacto entre empresa y club, con el mensaje que
  escribe la empresa.
- Registro de consentimientos con fecha y versión del texto aceptado
  (tabla `consent_records`).

**De terceros, en concreto menores** — es el punto que más conviene
mirar:

- Los datos de cantera se guardan **solo de forma agregada**: número de
  equipos, número de jugadores, número de familias. No hay ninguna ficha
  de un menor concreto, ni nombre, ni fecha de nacimiento, ni ningún
  dato individual, y el modelo de datos no tiene dónde guardarlo.
- Las fotos las sube el club. En el formulario hay un aviso explícito de
  no subir imágenes en las que se identifique con claridad a menores sin
  consentimiento, y una casilla de confirmación que queda registrada.
- **Pregunta para el abogado:** ¿basta con ese aviso y esa casilla, o
  hace falta algo más (por ejemplo, una cláusula específica en las
  condiciones que traslade la responsabilidad al club como responsable
  del tratamiento de las imágenes que sube)?

**Métricas de uso**: se guardan visitas a la página de un club,
apariciones en búsquedas y aperturas de dossier. Son contadores
anónimos: solo el identificador del club y la fecha, sin IP, sin cookie
y sin identificador de usuario. La IP se usa un momento para no contar
dos veces la misma visita y no se almacena.

## Encargados del tratamiento (subencargados)

- **Supabase** — base de datos, autenticación y almacenamiento de
  imágenes.
- **Vercel** — alojamiento de la aplicación, y su analítica sin cookies.
- **Stripe** — cobro de la suscripción del club. La plataforma no
  almacena datos de tarjeta.
- **Resend** — envío de los emails transaccionales.
- **Sentry** — errores técnicos, configurado para no enviar datos
  personales ni contenido de formularios.
- **OpenStreetMap (Nominatim)** — se le manda una ciudad o un código
  postal para calcular coordenadas; no se le manda ningún dato personal.

Conviene revisar si hace falta declarar transferencias internacionales
según dónde estén alojados estos servicios en el plan contratado.

## Cookies

- El banner permite rechazar con la misma facilidad con la que se
  acepta, sin casillas premarcadas.
- La única cookie propia es la de sesión de Supabase Auth (técnica,
  necesaria). La analítica de Vercel no usa cookies.
- **Pregunta para el abogado:** con este escenario, ¿el banner sigue
  siendo obligatorio o basta con la política de cookies?

## Derechos de los usuarios

Ya están implementados y funcionando, no son promesas del texto:

- **Acceso y portabilidad**: cada usuario puede descargar un JSON con
  todos sus datos desde su panel (`/panel/privacidad` y
  `/empresa/privacidad`).
- **Supresión**: puede eliminar su cuenta y todos sus datos asociados,
  escribiendo ELIMINAR para confirmar.
- Falta decidir el **plazo de conservación** de las solicitudes de
  contacto y de los registros de consentimiento: es una pregunta para el
  abogado, no una decisión técnica.

## Lo que conviene preguntar

1. ¿Los cuatro textos cubren lo que hace realmente la plataforma, tal y
   como se describe aquí?
2. Cantera y fotos de menores: ¿el aviso y la casilla son suficientes?
   ¿Hace falta un anexo de encargo de tratamiento con el club?
3. ¿Hace falta banner de cookies en este escenario?
4. Plazos de conservación de datos.
5. Condiciones de uso: ¿queda bien delimitado que la plataforma no
   interviene en el acuerdo entre club y empresa, ni responde de él?
6. Suscripción: derecho de desistimiento en un servicio digital de pago
   recurrente con un mes gratis, y cómo redactarlo en las condiciones.
