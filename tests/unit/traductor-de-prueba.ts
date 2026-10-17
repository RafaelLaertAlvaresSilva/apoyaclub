import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";

/**
 * Un traductor como el de `useTranslations`, armado con los mismos
 * archivos de `messages/`, para probar las funciones que reciben los
 * textos ya traducidos (las plantillas de correo del club, por ejemplo)
 * sin tener que montar next-intl.
 *
 *   const t = traductorDePrueba("es", "panel", "plantillas");
 *   t("comun.saludo") // "Hola,"
 */
export function traductorDePrueba(idioma: string, archivo: string, espacio = "") {
  const mensajes: unknown = JSON.parse(
    readFileSync(join(process.cwd(), "messages", idioma, `${archivo}.json`), "utf8"),
  );

  return (clave: string, valores?: Record<string, string | number>): string => {
    const ruta = [...(espacio ? espacio.split(".") : []), ...clave.split(".")];
    const texto = ruta.reduce<unknown>(
      (actual, parte) => (actual && typeof actual === "object" ? (actual as Record<string, unknown>)[parte] : undefined),
      mensajes,
    );
    if (typeof texto !== "string") throw new Error(`No existe el mensaje ${archivo}.${ruta.join(".")}`);
    return String(new IntlMessageFormat(texto, idioma).format(valores));
  };
}
