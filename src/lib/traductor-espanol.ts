import { createTranslator } from "next-intl";
import type { TraducirAlcance } from "@/lib/alcance";
import mensajesDelPanel from "../../messages/es/panel.json";

/**
 * Los textos del panel en español, para lo que se genera fuera de una
 * página y todavía no se ha traducido: el dossier en PDF y en Word.
 *
 * Las funciones de `lib/alcance.ts` piden la función de traducir porque
 * en el panel salen en el idioma de quien lo mira. El dossier, de
 * momento, sale siempre en español, y esto le da esa misma función sin
 * tener que montar una petición. Solo se importa desde el servidor.
 */
export function traductorDelAlcanceEnEspanol(): TraducirAlcance {
  const t = createTranslator({ locale: "es", messages: { panel: mensajesDelPanel } });
  // Sin los tipos de cada clave: las claves llegan armadas al vuelo.
  const traducir = t as unknown as (clave: string, valores?: Record<string, string | number>) => string;
  return (clave, valores) => traducir(`panel.alcance.informe.${clave}`, valores);
}
