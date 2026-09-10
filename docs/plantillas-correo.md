# Plantillas de correo (Supabase → Authentication → Emails → Templates)

Estos son los correos que recibe un club cuando se registra o cuando
pierde la contraseña. Por defecto llegan en inglés y firmados por
"Supabase Auth", que es exactamente lo que no queremos que vea alguien
a quien estamos pidiendo 29,90 € al mes.

## Cómo se cambian

En el navegador: Supabase → proyecto **apoyaclub** → **Authentication**
→ **Emails** → pestaña **Templates**. Se elige la plantilla en la lista
de la izquierda, se borra lo que hay en el recuadro grande, se pega lo
de abajo y se pincha **Save**. Una por una.

El **Subject** (asunto) está indicado en cada apartado y va en su
campo, no dentro del HTML.

## Por qué el enlace es `/auth/confirm` y no el de siempre

`{{ .ConfirmationURL }}` lleva un código atado al navegador que empezó
el registro. Si el club se registra en el ordenador del club y abre el
correo en el móvil, ese enlace falla. Por eso las plantillas usan
`{{ .TokenHash }}` contra la ruta `/auth/confirm`, que funciona desde
cualquier dispositivo.

---

## 1. Confirm signup

**Subject:** `Confirma tu correo y activa tu club en ApoyaClub`

```html
<div style="margin:0;padding:24px 0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#14304f;padding:24px 32px;">
      <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Apoya<span style="color:#14b8a6;">Club</span></span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">Ya casi está</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
        Has creado una cuenta de club en ApoyaClub. Solo falta confirmar que este correo es tuyo.
      </p>
      <p style="margin:0 0 28px;">
        <a href="{{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=signup"
           style="display:inline-block;background:#14b8a6;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">
          Confirmar mi correo
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#64748b;">
        Si el botón no funciona, copia y pega esta dirección en el navegador:
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#0f766e;word-break:break-all;">
        {{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=signup
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
        Si no has sido tú, puedes ignorar este mensaje: sin confirmar, la cuenta no se activa.
      </p>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        ApoyaClub · <a href="{{ .SiteURL }}" style="color:#0f766e;text-decoration:none;">apoyaclub.com</a><br>
        ¿Dudas? Responde a este correo y te contestamos.
      </p>
    </div>
  </div>
</div>
```

---

## 2. Reset password

**Subject:** `Cambiar tu contraseña de ApoyaClub`

```html
<div style="margin:0;padding:24px 0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#14304f;padding:24px 32px;">
      <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Apoya<span style="color:#14b8a6;">Club</span></span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">Cambiar la contraseña</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
        Has pedido cambiar la contraseña de tu cuenta. Pincha el botón y elige una nueva.
      </p>
      <p style="margin:0 0 28px;">
        <a href="{{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/actualizar-password"
           style="display:inline-block;background:#14b8a6;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">
          Elegir contraseña nueva
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#64748b;">
        Si el botón no funciona, copia y pega esta dirección en el navegador:
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#0f766e;word-break:break-all;">
        {{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/actualizar-password
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
        Si no has pedido tú este cambio, ignora el mensaje: tu contraseña actual sigue funcionando.
      </p>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        ApoyaClub · <a href="{{ .SiteURL }}" style="color:#0f766e;text-decoration:none;">apoyaclub.com</a><br>
        ¿Dudas? Responde a este correo y te contestamos.
      </p>
    </div>
  </div>
</div>
```

---

## 3. Change Email Address

**Subject:** `Confirma tu nuevo correo de ApoyaClub`

```html
<div style="margin:0;padding:24px 0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#14304f;padding:24px 32px;">
      <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Apoya<span style="color:#14b8a6;">Club</span></span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">Confirma el correo nuevo</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
        Has pedido cambiar el correo de tu cuenta de <strong>{{ .Email }}</strong> a <strong>{{ .NewEmail }}</strong>.
      </p>
      <p style="margin:0 0 28px;">
        <a href="{{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=email_change"
           style="display:inline-block;background:#14b8a6;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">
          Confirmar el cambio
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#64748b;">
        Si el botón no funciona, copia y pega esta dirección en el navegador:
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#0f766e;word-break:break-all;">
        {{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=email_change
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
        Si no has sido tú, ignora este mensaje y el correo de la cuenta no cambiará.
      </p>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        ApoyaClub · <a href="{{ .SiteURL }}" style="color:#0f766e;text-decoration:none;">apoyaclub.com</a><br>
        ¿Dudas? Responde a este correo y te contestamos.
      </p>
    </div>
  </div>
</div>
```

---

## 4. Magic Link

Hoy ApoyaClub entra con correo y contraseña, así que esta plantilla no
se usa. Se deja traducida por si algún día se activa, y para que nadie
reciba nunca un correo en inglés.

**Subject:** `Tu enlace de acceso a ApoyaClub`

```html
<div style="margin:0;padding:24px 0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#14304f;padding:24px 32px;">
      <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Apoya<span style="color:#14b8a6;">Club</span></span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">Entra en tu cuenta</h1>
      <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#334155;">
        Pincha el botón para entrar. El enlace caduca en una hora y solo se puede usar una vez.
      </p>
      <p style="margin:0 0 28px;">
        <a href="{{ .SiteURL }}/es/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink"
           style="display:inline-block;background:#14b8a6;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">
          Entrar en ApoyaClub
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
        Si no has pedido tú este acceso, ignora el mensaje.
      </p>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        ApoyaClub · <a href="{{ .SiteURL }}" style="color:#0f766e;text-decoration:none;">apoyaclub.com</a>
      </p>
    </div>
  </div>
</div>
```

---

## Comprobación

Después de guardar las plantillas, registrar un club de prueba con un
correo distinto y mirar tres cosas:

1. Que el asunto y el texto llegan en castellano.
2. Que el remitente es `ApoyaClub <info@apoyaclub.com>`.
3. Que el botón funciona **abriendo el correo en el móvil**, no solo en
   el ordenador donde se hizo el registro. Ese es el caso que antes
   fallaba.
