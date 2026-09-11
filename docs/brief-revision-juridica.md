# Brief para la revisión jurídica

Lo que necesita saber un abogado para revisar ApoyaClub, en una página.
La idea es que no tenga que reconstruir el producto a partir de los
textos: cuanto más claro sea esto, más barata y más rápida sale la
revisión.

**Qué hay que revisar:** los cuatro textos legales del sitio. Están
completos —ya no queda ningún hueco sin redactar— pero **los ha escrito
quien programó la plataforma, no un abogado**, y siguen marcados como
pendientes de revisión. La idea es que sirvan de borrador que corregir,
no de texto definitivo.

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

- **El club es el cliente de pago.** Primer mes gratis y después uno de
  estos tres planes, todos con IVA incluido y sin permanencia:
  mensual 29,90 €/mes, temporada 249 €/año y fundador 199 €/año (este
  último limitado a las 50 primeras plazas, con el precio congelado
  mientras el club siga de alta).
- Además, la plataforma puede **invitar a un club**: se le amplía la
  prueba gratuita hasta una fecha concreta desde el panel de
  administración. No paga nada y no da ninguna tarjeta.
- **La empresa entra gratis y ya no necesita cuenta.** Busca sin
  registrarse y escribe al club desde un formulario en el que deja
  nombre, correo y, si quiere, empresa y teléfono. No hay cuentas de
  empresa: se retiraron, y con ellas los datos que se les pedían.
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
- Empresa: **ya no hay cuentas de empresa**. De quien escribe a un club
  solo queda lo que pone en el formulario de contacto: nombre, correo y,
  opcionalmente, empresa y teléfono.
- Solicitudes de contacto, con el mensaje que escribe la empresa. Se
  guardan en la cuenta del club destinatario.
- **Datos fiscales del club** para poder facturarle: razón social,
  domicilio y NIF o CIF. Los recoge Stripe en la pasarela de pago y se
  guardan en Stripe, no en la base de datos de la plataforma.
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

**Lo que el club apunta de su propia actividad** (responsable: la
plataforma como encargada; el club decide qué escribe):

- **Público en los partidos**: fecha, rival, competición, equipo, si se
  jugó en casa y cuánta gente hubo. Son cifras de aforo, no personas.
  De ahí sale la asistencia media que enseña su ficha.
- **Patrocinadores actuales** del club: nombre de la empresa, logo y
  categoría. Y, si el club lo activa, un aviso por correo a esos
  patrocinadores anunciándoles que el club está en la plataforma. El
  correo sale a nombre del club, se manda una sola vez por empresa y el
  club confirma antes que tiene relación con ella. **Pregunta para el
  abogado:** ¿basta con esa confirmación del club, o hace falta algo más
  para escribir a esas empresas?
- **Tareas y compromisos** con un patrocinador, con fechas.
- **Lo que el club necesita** (fisioterapia, transporte, imprenta…),
  publicado como oportunidad al revés para que una empresa se ofrezca.

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
  almacena datos de tarjeta. Stripe recoge y guarda los datos fiscales
  del club (domicilio y NIF/CIF) y emite las facturas; el club puede
  descargarlas y corregir esos datos desde el portal de Stripe.
- **Resend** — envío de los emails transaccionales. Dominio verificado
  en su región de Irlanda.
- **Cloudflare** — DNS del dominio y reenvío del correo de
  `info@apoyaclub.com` al buzón del titular.
- **Sentry** — errores técnicos, configurado para no enviar datos
  personales ni contenido de formularios.
- **OpenStreetMap (Nominatim)** — se le manda una ciudad o un código
  postal para calcular coordenadas; no se le manda ningún dato personal.

Dónde están los datos, con lo que se sabe hoy:

- Supabase: proyecto en **AWS eu-west-1 (Irlanda)**.
- Resend: región de **Irlanda**.
- Vercel: el proyecto **no tiene región fijada**, así que la ejecución
  del servidor puede ocurrir fuera del EEE. Se puede fijar a Fráncfort o
  París, pero solo en el plan de pago.
- Stripe, Sentry y Cloudflare: compañías con matriz fuera del EEE.

**Pregunta para el abogado:** con este reparto, ¿cómo hay que redactar
la sección de transferencias internacionales y qué garantías hay que
citar? El texto actual dice lo de arriba en castellano llano y está sin
revisar.

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
7. Facturación: el precio se anuncia con el IVA incluido. ¿Hay que
   desglosarlo en algún sitio de la web además de en la factura?
8. Clubes invitados: se les da acceso gratuito durante un tiempo sin que
   firmen nada distinto. ¿Hace falta algo por escrito?
9. El aviso a los patrocinadores actuales del club (arriba, en "lo que
   el club apunta"): es el punto que más dudas me genera después del de
   los menores.
10. Registro de actividades de tratamiento y contratos de encargado con
    Supabase, Vercel, Stripe, Resend, Sentry y Cloudflare: no están
    hechos.
