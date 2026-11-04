import type { Pais } from "@/lib/paises";

const PREFIJO_DEL_PAIS: Record<Pais, string> = { ES: "34", PT: "351", BR: "55" };

/**
 * El enlace para abrir un chat de WhatsApp con un teléfono que el club
 * escribió a mano: "600 12 34 56", "+34 600123456", "0034 600…",
 * "(11) 91234-5678". WhatsApp necesita el número entero con el prefijo
 * del país y sin nada más; si el club no lo puso, se pone el de su país.
 *
 * Null si no queda un número con sentido.
 */
export function enlaceWhatsapp(telefono: string | null | undefined, pais: Pais): string | null {
  if (!telefono) return null;
  const limpio = telefono.trim();
  let digitos = limpio.replace(/\D/g, "");
  if (!digitos) return null;

  if (limpio.startsWith("+")) {
    // Ya trae el prefijo.
  } else if (digitos.startsWith("00")) {
    digitos = digitos.slice(2);
  } else {
    const prefijo = PREFIJO_DEL_PAIS[pais];
    // En Brasil a veces se marca el 0 delante del código de zona.
    if (pais === "BR" && digitos.startsWith("0")) digitos = digitos.slice(1);
    // Ya lo trae si empieza por el prefijo Y es más largo que un número
    // nacional (9 cifras en España y Portugal; 10 u 11 en Brasil, donde
    // además hay una zona, Rio Grande do Sul, que empieza por 55).
    const largoNacional = pais === "BR" ? 11 : 9;
    if (!(digitos.startsWith(prefijo) && digitos.length > largoNacional)) digitos = `${prefijo}${digitos}`;
  }

  if (digitos.length < 10 || digitos.length > 15) return null;
  return `https://wa.me/${digitos}`;
}
