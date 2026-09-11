/**
 * Quién está detrás de ApoyaClub.
 *
 * El artículo 10 de la LSSI obliga a que el titular de una web
 * comercial se identifique: nombre, NIF, domicilio y un correo de
 * contacto. Hasta ahora esas cuatro cosas estaban en las páginas
 * legales escritas entre corchetes, tal cual, a la vista de cualquiera
 * que entrara. Ni cumplía la ley ni daba buena impresión al primer club
 * que se leyera las condiciones.
 *
 * Viven en variables de entorno y no escritas en el código por una
 * razón práctica: así las rellena quien las tiene —el titular— sin
 * tocar ningún archivo, y el día que haya sociedad se cambian en Vercel
 * en dos minutos sin desplegar nada a mano.
 *
 * Son públicas por ley, así que van como NEXT_PUBLIC: no hay nada que
 * esconder aquí, al contrario.
 */

function leer(valor: string | undefined): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

export const TITULAR = {
  nombre: leer(process.env.NEXT_PUBLIC_TITULAR_NOMBRE),
  nif: leer(process.env.NEXT_PUBLIC_TITULAR_NIF),
  direccion: leer(process.env.NEXT_PUBLIC_TITULAR_DIRECCION),
  /** El de contacto público. Si no se dice otra cosa, el de siempre. */
  email: leer(process.env.NEXT_PUBLIC_TITULAR_EMAIL) ?? "info@apoyaclub.com",
  /** Solo si algún día hay sociedad inscrita. */
  registro: leer(process.env.NEXT_PUBLIC_TITULAR_REGISTRO),
} as const;

/** true cuando se puede publicar la identificación completa. */
export const TITULAR_COMPLETO = Boolean(TITULAR.nombre && TITULAR.nif && TITULAR.direccion);

/**
 * La frase de identificación, ya montada.
 *
 * Si falta algún dato devuelve null en vez de una frase con huecos: más
 * vale que la página diga claramente que está incompleta a que publique
 * "domicilio en [dirección completa]" y parezca que nadie la ha leído.
 */
export function fraseDeIdentificacion(): string | null {
  if (!TITULAR_COMPLETO) return null;

  const registro = TITULAR.registro ? `, inscrito en ${TITULAR.registro}` : "";
  return `${TITULAR.nombre}, con NIF ${TITULAR.nif}, domicilio en ${TITULAR.direccion} y correo electrónico de contacto ${TITULAR.email}${registro}.`;
}
