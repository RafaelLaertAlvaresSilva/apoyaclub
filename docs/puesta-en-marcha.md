# Puesta en marcha: lo que hay que hacer una vez

Cinco cosas, con lo que cuesta cada una. Las dos primeras las puedes
hacer en diez minutos; las otras tres dependen de terceros.

## 0. Antes de nada: ¿tienes ya un proyecto de Supabase?

Tu `.env.local` de local tiene valores de relleno
(`NEXT_PUBLIC_SUPABASE_URL=https://placeholder...`), puestos en su día
para poder ver el diseño sin base de datos. Así que hay dos casos:

- **Todavía no hay proyecto de Supabase.** Créalo en supabase.com (es
  gratis para empezar), y aplica **todas** las migraciones de golpe con
  [`docs/migraciones-todas.sql`](./migraciones-todas.sql).
- **Ya tienes el proyecto con las migraciones 0001 a 0009 aplicadas.**
  Entonces solo faltan las nuevas:
  [`docs/migraciones-0010-a-0017.sql`](./migraciones-0010-a-0017.sql).

## 1. Aplicar las migraciones (2 minutos)

Supabase → SQL Editor → pegar el archivo que te toque según el punto
anterior → Run.

Es el contenido de las migraciones en orden, sin cambios. Todas son
idempotentes: si ya habías aplicado alguna suelta, no pasa nada por
ejecutarlo otra vez.

Después, en Supabase → Authentication → URL Configuration, añade tu URL
de producción y `…/auth/callback` a las Redirect URLs, y comprueba que
"Confirm email" sigue activado.

Hasta que no se apliquen las migraciones, lo que necesita tabla nueva no
aparece (las métricas del panel, los servicios, las plazas), pero la
aplicación no se rompe: está escrita para seguir funcionando sin ellas.

## 2. Completar `.env.local` (5 minutos)

Ahora mismo tu `.env.local` solo tiene tres variables, y con valores de
relleno. Con eso se ve el diseño, pero **no** funcionan el login, el
buscador, el panel, los emails, el dossier, la suscripción ni las
métricas.

Copia de `.env.local.example` las que faltan y rellena al menos:

| Variable | De dónde sale | Sin ella no funciona |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | absolutamente todo |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | panel, emails, dossier, métricas, límites |
| `RESEND_API_KEY` y `RESEND_FROM_EMAIL` | resend.com | todos los emails |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MENSUAL`, `STRIPE_PRICE_TEMPORADA`, `STRIPE_PRICE_FUNDADOR`, `STRIPE_WEBHOOK_SECRET` | Stripe | la suscripción |
| `CRON_SECRET` | invéntala, cualquier cadena larga | el cron diario de avisos |
| `CONTACT_EMAIL` | tu email | el formulario de contacto de la landing |
| `ADMIN_SIGNUP_KEY` | invéntala | crear cuentas de administrador |

En Vercel hay que poner las mismas, más `NEXT_PUBLIC_SITE_URL` con el
dominio real.

## 2 bis. Los tres precios de Stripe

Dentro de un único producto ("Suscripción ApoyaClub") se crean **tres
precios**, todos con *Tax behavior: Inclusive* para que el club vea
siempre el importe final:

| Plan | Importe | Cada | Variable |
| --- | --- | --- | --- |
| Mensual | 29,90 € | 1 mes | `STRIPE_PRICE_MENSUAL` |
| Temporada | 249,00 € | 1 año | `STRIPE_PRICE_TEMPORADA` |
| Fundador | 199,00 € | 1 año | `STRIPE_PRICE_FUNDADOR` |

El plan fundador tiene 50 plazas. El número se guarda en la tabla
`plataforma_ajustes` (clave `plazas_fundador`) y se puede subir o bajar
desde el SQL Editor sin tocar el código:

```sql
update public.plataforma_ajustes set valor = 75 where clave = 'plazas_fundador';
```

Mientras no queden plazas, el plan fundador deja de ofrecerse solo.

## 3. Sentry (5 minutos, cuenta gratuita)

1. Crear un proyecto de tipo **Next.js** en sentry.io.
2. Pegar el DSN en `NEXT_PUBLIC_SENTRY_DSN`, en local y en Vercel.
3. En Vercel, añadir `SENTRY_ORG`, `SENTRY_PROJECT` y
   `SENTRY_AUTH_TOKEN` para que las trazas señalen la línea real de
   código y no el bundle minificado.
4. **Lo que de verdad importa:** crear una alerta por email para los
   errores con la etiqueta `zona` igual a `stripe-webhook` o
   `cron-suscripciones`. Son los dos sitios donde un fallo no lo ve
   nadie: un cobro que no sincroniza deja a un club pagando con la
   página apagada, o al revés.

Sin DSN no se envía nada y la aplicación funciona igual.

## 4. Analítica (1 minuto)

Vercel → el proyecto → pestaña **Analytics** → activar. El código ya
está puesto en el layout; no usa cookies ni identifica a nadie, así que
no depende del banner de consentimiento.

## 5. Revisión jurídica (depende del abogado)

Manda [`docs/brief-revision-juridica.md`](./brief-revision-juridica.md)
junto con los cuatro textos legales. El brief está escrito para que el
abogado no tenga que reconstruir el producto: explica el modelo, qué
datos se tratan, cómo se tratan los de cantera, qué encargados hay y las
seis preguntas concretas que conviene hacerle.

Es lo único bloqueante que queda antes de abrir el registro a clubes
reales.

## Y lo que no es una tarea técnica

[`docs/captacion-primeros-clubes.md`](./captacion-primeros-clubes.md):
a quién llamar, qué pedirles exactamente, el mensaje de WhatsApp, el
email, el guion de la llamada y las cuatro objeciones que te van a
poner. El producto ya está listo para enseñárselo a un club.


## Comprobar que todo está en su sitio

Con el `.env.local` real y las migraciones aplicadas:

```bash
npm run dev     # la aplicación entera, no solo el diseño
npm test        # 43 tests, deberían pasar todos
npm run seed    # opcional: 15 clubes de prueba para ver el buscador con volumen
```

Si `npm run dev` arranca y puedes registrar un club, crear una
oportunidad y verla en `/es/buscar`, está todo conectado.
