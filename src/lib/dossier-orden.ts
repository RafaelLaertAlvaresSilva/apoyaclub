import type { DossierSectionKey } from "@/lib/types";

/**
 * El orden de los apartados del dossier, que elige el club.
 *
 * Los bloques que se pueden ordenar son las siete secciones que se
 * marcan en el panel más "oportunidades" ("Cómo colaborar"), que no es
 * una sección con casilla (sale si hay oportunidades elegidas) pero sí
 * un apartado que el club puede querer más arriba o más abajo.
 *
 * Se guarda en la misma columna `sections` de `club_dossiers`, en el
 * orden en que van, con "oportunidades" metida en su sitio. Así no hace
 * falta migración: `seccionesValidas` ya ignora lo que no es una
 * sección, de modo que quien solo mira qué secciones van no nota nada.
 *
 * La portada y el contacto del final no se mueven: la portada abre y el
 * contacto cierra, que es a donde tiene que llevar todo lo demás.
 */
export type BloqueDossier = DossierSectionKey | "oportunidades";

/**
 * El orden de siempre, el que tenía el dossier antes de poder
 * cambiarlo: primero quién es el club, luego qué ofrece, a quién llega
 * y quién confía ya en él.
 */
export const ORDEN_POR_DEFECTO: BloqueDossier[] = [
  "identidad",
  "historia",
  "instalaciones",
  "oportunidades",
  "equipos",
  "cantera",
  "audiencia",
  "patrocinadores",
];

/**
 * El orden completo a partir de lo guardado (o de lo que manda el
 * formulario): los bloques conocidos en el orden en que vienen, sin
 * repetir, y los que falten metidos en su sitio de siempre, detrás del
 * bloque que les precede en el orden por defecto.
 *
 * Que falten es lo normal: solo se guardan las secciones marcadas, y un
 * dossier guardado antes de poder ordenar no trae "oportunidades".
 */
export function ordenDelDossier(valores: readonly unknown[]): BloqueDossier[] {
  const orden: BloqueDossier[] = [];
  for (const valor of valores) {
    const bloque = String(valor) as BloqueDossier;
    if (ORDEN_POR_DEFECTO.includes(bloque) && !orden.includes(bloque)) orden.push(bloque);
  }

  ORDEN_POR_DEFECTO.forEach((bloque, indice) => {
    if (orden.includes(bloque)) return;
    // Detrás del anterior en el orden por defecto que ya esté colocado;
    // si no hay ninguno, al principio.
    const anteriores = ORDEN_POR_DEFECTO.slice(0, indice).reverse();
    const ancla = anteriores.find((anterior) => orden.includes(anterior));
    orden.splice(ancla ? orden.indexOf(ancla) + 1 : 0, 0, bloque);
  });

  return orden;
}

/**
 * Lo que se guarda en `sections`: el orden, quedándose solo con las
 * secciones marcadas (y "oportunidades", que no se marca aquí).
 */
export function seccionesParaGuardar(
  orden: readonly BloqueDossier[],
  marcadas: readonly DossierSectionKey[],
): BloqueDossier[] {
  return orden.filter((bloque) => bloque === "oportunidades" || marcadas.includes(bloque));
}

/**
 * Sube (-1) o baja (+1) un bloque un puesto, saltándose los que no se
 * ven en la lista (`visibles`: las secciones que todavía no tienen datos
 * no salen para ordenar). Si no, el botón cambiaría el bloque de sitio
 * con uno escondido y parecería que no hace nada. En el borde, no hace
 * nada.
 */
export function moverBloque(
  orden: readonly BloqueDossier[],
  bloque: BloqueDossier,
  paso: -1 | 1,
  visibles: readonly BloqueDossier[] = orden,
): BloqueDossier[] {
  const enLista = orden.filter((otro) => visibles.includes(otro));
  const vecino = enLista[enLista.indexOf(bloque) + paso];
  if (!enLista.includes(bloque) || !vecino) return [...orden];
  const nuevo = [...orden];
  const a = nuevo.indexOf(bloque);
  const b = nuevo.indexOf(vecino);
  [nuevo[a], nuevo[b]] = [nuevo[b], nuevo[a]];
  return nuevo;
}
