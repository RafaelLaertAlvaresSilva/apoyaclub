import { notFound } from "next/navigation";

/**
 * Cualquier dirección que no existe dentro de un idioma
 * (`/es/clubs`, `/pt/loquesea`).
 *
 * Sin esta página, Next.js no llegaba a usar el 404 propio
 * (`[locale]/not-found.tsx`): enseñaba el suyo por defecto, en inglés,
 * en blanco y sin forma de volver. Un "no encontrado" lanzado desde
 * dentro del idioma sí lo pinta, con la cabecera y las salidas de
 * siempre. Es lo que recomienda next-intl para esto.
 */
export default function DireccionQueNoExiste() {
  notFound();
}
