import QRCode from "qrcode";
import { direccionDelQr, type OpcionesDossier, type TipoQr } from "@/lib/dossier-opciones";

export type QrDelDossier = {
  /** Lo que abre al escanearlo. */
  url: string;
  tipo: Exclude<TipoQr, "ninguno">;
  /** La imagen, en PNG: el PDF la quiere como "data:", el Word como bytes. */
  png: Buffer;
  dataUrl: string;
};

/**
 * El código QR del dossier, ya dibujado, o null si el club no quiere
 * ninguno. Va en el recuadro del contacto, al final: en papel no se
 * puede pulsar un enlace, y así la empresa llega con el móvil a lo que
 * el club haya elegido (`lib/dossier-opciones.ts`).
 *
 * Nunca impide sacar el dossier: si algo falla, sale sin QR.
 */
export async function qrDelDossier(
  opciones: Pick<OpcionesDossier, "qr" | "qrEnlace">,
  { ficha, video }: { ficha: string; video: string | null },
): Promise<QrDelDossier | null> {
  const direccion = direccionDelQr(opciones, { ficha, video });
  if (!direccion) return null;
  try {
    const png = await QRCode.toBuffer(direccion.url, {
      type: "png",
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
    });
    return { ...direccion, png, dataUrl: `data:image/png;base64,${png.toString("base64")}` };
  } catch {
    return null;
  }
}
