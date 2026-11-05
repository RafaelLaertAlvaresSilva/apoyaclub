import type { Pais } from "@/lib/paises";

/**
 * El IVA español en las facturas (pedido por Rafael el 5-11-2026).
 *
 * Los precios en euros llevan el IVA incluido (199 €/año = 164,46 € +
 * 34,54 € de IVA), pero Stripe no tenía ningún impuesto puesto, así que
 * la factura salía con el total y sin la línea de IVA. Ahora, a los
 * clubes de España se les añade en el pago un "tipo de impuesto" de
 * Stripe: IVA 21 % incluido en el precio. El cliente paga lo mismo y la
 * factura separa la base y el IVA.
 *
 * El tipo de impuesto se crea a mano en Stripe (Catálogo de productos →
 * Tasas de impuestos) y su identificador (txr_…) va en la variable
 * STRIPE_TAX_RATE_IVA_ES de Vercel. Sin ella, todo sigue como antes.
 *
 * Quedan fuera, a la espera de lo que diga el gestor:
 *   - Canarias, Ceuta y Melilla: no tienen IVA (Canarias tiene IGIC).
 *   - Portugal: IVA portugués o inversión del sujeto pasivo.
 *   - Brasil y el resto: no llevan IVA español.
 */

/** Códigos postales de fuera del IVA: Las Palmas (35), Santa Cruz de Tenerife (38), Ceuta (51), Melilla (52). */
const PREFIJOS_FUERA_DEL_IVA = ["35", "38", "51", "52"];

/** Provincias de fuera del IVA, por si el código postal no está. */
const PROVINCIAS_FUERA_DEL_IVA = [
  "las palmas",
  "santa cruz de tenerife",
  "tenerife",
  "gran canaria",
  "lanzarote",
  "fuerteventura",
  "la palma",
  "la gomera",
  "el hierro",
  "canarias",
  "ceuta",
  "melilla",
];

function sinTildes(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Si el club está en una parte de España sin IVA (Canarias, Ceuta o
 * Melilla), según su código postal o, si no lo tiene, su provincia.
 */
export function fueraDelIvaEspanol({
  province,
  postalCode,
}: {
  province: string | null | undefined;
  postalCode: string | null | undefined;
}): boolean {
  const cp = String(postalCode ?? "").replace(/\s/g, "");
  if (/^\d{5}$/.test(cp)) return PREFIJOS_FUERA_DEL_IVA.includes(cp.slice(0, 2));
  const provincia = sinTildes(String(province ?? ""));
  return provincia !== "" && PROVINCIAS_FUERA_DEL_IVA.some((una) => provincia.includes(una));
}

/** Si al club se le cobra con el IVA español desglosado. */
export function llevaIvaEspanol(club: {
  pais: Pais;
  province: string | null | undefined;
  postalCode: string | null | undefined;
}): boolean {
  return club.pais === "ES" && !fueraDelIvaEspanol(club);
}

/** El tipo de impuesto de Stripe del IVA español, o null si no está configurado. */
export function tipoDeIvaDeStripe(): string | null {
  const id = process.env.STRIPE_TAX_RATE_IVA_ES?.trim();
  return id && id.startsWith("txr_") ? id : null;
}
