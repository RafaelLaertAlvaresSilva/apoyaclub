import type { SubscriptionStatus } from "@/lib/subscription-mappers";

/**
 * Quién puede usar el panel del club, y quién no.
 *
 * La regla es la que pidió el negocio: el mes de prueba es uno solo y,
 * cuando termina, la plataforma se usa pagando. Antes el club seguía
 * entrando a todo con la suscripción cerrada y lo único que perdía era
 * la visibilidad pública.
 *
 * Con dos excepciones que no son negociables:
 *
 * 1. La página de privacidad sigue abierta siempre. Es donde el club
 *    descarga sus datos y borra su cuenta, y el RGPD no permite
 *    condicionar esos derechos a que alguien pague. Un club que no paga
 *    tiene el mismo derecho a llevarse lo suyo que uno que sí.
 *
 * 2. Un cobro fallido no es lo mismo que no pagar. Cuando a un club se
 *    le caduca la tarjeta, Stripe reintenta durante días: mientras dura
 *    eso el club sigue entrando, con el aviso rojo que ya ve. Se cierra
 *    cuando Stripe da el cobro por perdido ("unpaid") o cuando la
 *    suscripción se cancela.
 */

/** Estados con los que el club entra a todo su panel. */
const ESTADOS_CON_ACCESO: readonly SubscriptionStatus[] = ["trialing", "active", "past_due"];

export function puedeUsarElPanel(estado: SubscriptionStatus): boolean {
  return ESTADOS_CON_ACCESO.includes(estado);
}

/**
 * Rutas del panel que siguen abiertas aunque no haya suscripción.
 *
 * "/panel/suscripcion" porque es adonde se le manda a pagar, y
 * "/panel/privacidad" por lo dicho arriba.
 */
export const RUTAS_ABIERTAS_SIN_SUSCRIPCION = [
  "/panel/suscripcion",
  "/panel/privacidad",
] as const;

/** La ruta va sin el prefijo de idioma: "/panel/oportunidades". */
export function esRutaAbiertaSinSuscripcion(rutaSinIdioma: string): boolean {
  return RUTAS_ABIERTAS_SIN_SUSCRIPCION.some(
    (abierta) => rutaSinIdioma === abierta || rutaSinIdioma.startsWith(`${abierta}/`),
  );
}

/**
 * Los días de prueba que le quedan al club, para no regalarle un mes
 * por segunda vez.
 *
 * El checkout de Stripe daba 30 días de prueba a todo el que contratara,
 * sin mirar si ya se había gastado su mes gratis: un club que se
 * registraba, lo usaba entero y luego se suscribía acababa con dos meses
 * regalados en vez de uno. Ahora Stripe solo continúa la prueba que ya
 * estaba corriendo.
 *
 * No se limita a 30: un club invitado tiene la prueba estirada hasta la
 * fecha que se le prometió, y si decide pagar antes de tiempo esa
 * promesa se respeta igual.
 */
export function diasDePruebaQueQuedan(
  finDePrueba: string | null,
  ahora: Date = new Date(),
): number {
  if (!finDePrueba) return 0;

  const fin = Date.parse(finDePrueba);
  if (Number.isNaN(fin)) return 0;

  const dias = Math.ceil((fin - ahora.getTime()) / 86_400_000);
  if (dias <= 0) return 0;

  // Stripe no admite pruebas de más de 730 días. Nunca deberíamos
  // llegar aquí, pero una fecha mal puesta en el panel de admin no
  // puede tumbar un cobro.
  return Math.min(dias, 730);
}
