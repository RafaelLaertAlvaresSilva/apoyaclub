import { SITE_URL } from "@/lib/site";

/**
 * El marco de todos los correos de ApoyaClub: fondo gris claro, el logo
 * arriba, el contenido en una tarjeta blanca y un pie con la web.
 *
 * Hasta ahora cada correo era un bloque de texto suelto con un botón,
 * sin logo ni nada que dijera de quién venía. En la bandeja de un club
 * eso se confunde con publicidad; con el logo y la tarjeta se ve que es
 * de la herramienta que usa.
 *
 * Va en tablas y con los estilos escritos en cada etiqueta porque así
 * es como se ve igual en Gmail, Outlook y el correo del móvil: los
 * clientes de correo no leen hojas de estilo.
 *
 * El logo es un PNG (`public/correo/logo.png`): Outlook no enseña WebP.
 *
 * `conLogo: false` es para los correos que salen a nombre del club (el
 * aviso al patrocinador): ahí la relación es entre el club y su
 * empresa, y el logo de ApoyaClub arriba la taparía.
 */
export function envolverCorreo(contenido: string, { conLogo = true }: { conLogo?: boolean } = {}): string {
  const web = SITE_URL.replace(/\/$/, "");
  const dominio = web.replace(/^https?:\/\//, "");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
            <tr>
              <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;border-top:4px solid #0f766e;padding:28px 28px 32px;">
                ${
                  // El logo dentro de la tarjeta blanca: el PNG lleva su
                  // propio fondo blanco y fuera, sobre el gris, se veía
                  // como un recuadro pegado.
                  conLogo
                    ? `<a href="${web}" style="text-decoration:none;display:block;margin:0 0 22px;padding:0 0 18px;border-bottom:1px solid #f1f5f9;">
                  <img src="${web}/correo/logo.png" width="190" alt="ApoyaClub" style="display:block;border:0;width:190px;height:auto;" />
                </a>`
                    : ""
                }
                ${contenido}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 8px 0;font-family:sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">
                ApoyaClub · <a href="${web}" style="color:#64748b;text-decoration:underline;">${dominio}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
