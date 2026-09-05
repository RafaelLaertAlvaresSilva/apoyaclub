import type { Role } from "@/lib/types";

/**
 * Las áreas privadas de la web, con el rol que puede entrar en cada
 * una. Lo usa el middleware para decidir si una ruta hay que
 * protegerla.
 *
 * Es una lista aparte de `RUTA_POR_ROL` a propósito, y conviene que lo
 * siga siendo. `RUTA_POR_ROL` responde a "¿a dónde mando a este usuario
 * después de iniciar sesión?", y ahí un rol puede apuntar a la portada
 * ("/"). Esta lista responde a otra cosa: "¿qué rutas hay que
 * proteger?", y ahí "/" no cabe.
 *
 * Cuando eran la misma lista, poner la portada como destino de un rol
 * convirtió la web entera en zona privada: toda ruta empieza por "/",
 * así que cualquier página pública pasaba a exigir sesión y a un club
 * con la sesión abierta se le devolvía a su panel al pulsar el logo.
 * De ahí el test de `areas-privadas.test.ts`.
 */
export const AREAS_PRIVADAS: readonly (readonly [Role, string])[] = [
  ["club", "/panel"],
  ["admin", "/admin"],
] as const;

/**
 * El área privada a la que pertenece una ruta (ya sin prefijo de
 * idioma), o null si la ruta es pública.
 */
export function areaPrivadaDe(rutaSinIdioma: string): (typeof AREAS_PRIVADAS)[number] | null {
  return (
    AREAS_PRIVADAS.find(
      ([, prefijo]) => rutaSinIdioma === prefijo || rutaSinIdioma.startsWith(`${prefijo}/`),
    ) ?? null
  );
}
