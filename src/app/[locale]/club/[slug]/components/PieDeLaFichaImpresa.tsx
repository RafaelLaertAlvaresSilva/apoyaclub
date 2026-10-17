import QRCode from "qrcode";
import { getTranslations } from "next-intl/server";

/**
 * Lo que solo sale en papel, al pie de la ficha impresa.
 *
 * Una hoja impresa no tiene botones: la empresa que la recibe en mano
 * no puede pulsar "Solicitar contacto". El QR la lleva a esta misma
 * página desde el móvil, y la dirección escrita sirve para quien no lo
 * escanea.
 *
 * NI TELÉFONO NI CORREO DEL CLUB. La página pública tampoco los enseña:
 * el contacto pasa por ApoyaClub, y el papel no debe saltarse eso.
 *
 * El QR se genera en el servidor, como SVG y a partir de una dirección
 * que construye la propia página (nunca de algo que escriba el club),
 * así que pintarlo tal cual es seguro.
 */
export async function PieDeLaFichaImpresa({
  url,
  nombreClub,
}: {
  url: string;
  nombreClub: string;
}) {
  const qr = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
  });
  const direccionLegible = url.replace(/^https?:\/\//, "");
  const t = await getTranslations("club.ficha.pieImpreso");

  return (
    <div className="mt-6 hidden break-inside-avoid items-center gap-5 border-t border-zinc-300 pt-5 print:flex">
      <div
        className="h-24 w-24 shrink-0 [&>svg]:h-full [&>svg]:w-full"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <div className="min-w-0 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">
          {t("teInteresa", { club: nombreClub })}
        </p>
        <p className="mt-1 break-all text-zinc-600">{direccionLegible}</p>
        <p className="mt-2 text-xs text-zinc-500">{t("publicado")}</p>
      </div>
    </div>
  );
}
