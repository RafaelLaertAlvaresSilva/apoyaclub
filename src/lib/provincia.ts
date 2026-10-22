/** Palabras que, dentro del nombre de una provincia, van en minúscula. */
const EN_MINUSCULA = new Set(["de", "del", "la", "las", "los", "y"]);

/**
 * Deja la provincia escrita como en el resto de la web: "ALICANTE" y
 * "alicante" pasan a "Alicante", y "santa cruz de tenerife" a "Santa
 * Cruz de Tenerife".
 *
 * Existe porque la provincia de una empresa se escribe a mano, y el
 * filtro del directorio sale de lo que haya escrito cada una: con una
 * empresa en "ALICANTE" y otra en "Alicante", el desplegable enseñaba
 * dos provincias que son la misma.
 *
 * Solo se toca lo que está todo en mayúsculas o todo en minúsculas. Si
 * alguien la escribió a su manera ("A Coruña", "Illes Balears"), se
 * respeta: seguramente sabe escribir su provincia mejor que esta regla.
 * La migración 0055 aplica exactamente la misma regla a lo ya guardado.
 */
export function normalizarProvincia(valor: string | null): string | null {
  if (valor == null) return null;
  const limpio = valor.trim().replace(/\s+/g, " ");
  if (limpio === "") return null;
  if (limpio !== limpio.toUpperCase() && limpio !== limpio.toLowerCase()) return limpio;

  return limpio
    .toLowerCase()
    .split(" ")
    .map((palabra, posicion) =>
      posicion > 0 && EN_MINUSCULA.has(palabra) ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1),
    )
    .join(" ");
}
