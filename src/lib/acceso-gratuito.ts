import type { SubscriptionStatus } from "@/lib/subscription-mappers";

/**
 * El acceso gratuito que ApoyaClub le regala a un club invitado.
 *
 * No es un estado nuevo: es el mes de prueba de siempre (migración
 * 0018) con la fecha de fin puesta más lejos. Esa decisión ahorra media
 * plataforma —el club ya sale en el buscador, ya tiene panel, ya recibe
 * el aviso antes de que se le acabe, y el cron que cierra las pruebas
 * vencidas lo cierra solo el día que toque— y evita inventar un segundo
 * camino por el que un club puede tener acceso, que es justo el tipo de
 * cosa que un día deja a alguien dentro sin que nadie sepa por qué.
 *
 * Lo único que hace falta es saber distinguir, al mirar la lista, un
 * club invitado de uno que acaba de registrarse. De ahí el umbral: si
 * a la prueba le quedan más de 45 días, no es la prueba normal de 30,
 * es un regalo.
 */
export const DIAS_PARA_CONSIDERARLO_REGALO = 45;

/** El día de hoy en formato "AAAA-MM-DD". */
export function hoyISO(ahora: Date = new Date()): string {
  return ahora.toISOString().slice(0, 10);
}

/** La fecha de dentro de un año, para proponerla en el formulario. */
export function unAnioDesde(ahora: Date = new Date()): string {
  const dentroDeUnAnio = new Date(
    Date.UTC(ahora.getUTCFullYear() + 1, ahora.getUTCMonth(), ahora.getUTCDate()),
  );
  return dentroDeUnAnio.toISOString().slice(0, 10);
}

/** Días que faltan para una fecha, contando desde hoy. Negativo si ya pasó. */
export function diasHasta(fecha: string | null, ahora: Date = new Date()): number {
  if (!fecha) return 0;

  const fin = Date.parse(fecha);
  if (Number.isNaN(fin)) return 0;

  const inicio = Date.parse(`${hoyISO(ahora)}T00:00:00.000Z`);
  return Math.ceil((fin - inicio) / 86_400_000);
}

/** true si a este club se le ha regalado el acceso, no es su prueba normal. */
export function esAccesoRegalado(
  estado: SubscriptionStatus,
  finDePrueba: string | null,
  ahora: Date = new Date(),
): boolean {
  if (estado !== "trialing" || !finDePrueba) return false;
  return diasHasta(finDePrueba, ahora) > DIAS_PARA_CONSIDERARLO_REGALO;
}

/**
 * La fecha que ha escrito el administrador, o null si no vale.
 *
 * Se rechaza una fecha ya pasada porque el efecto sería el contrario
 * del que busca quien la escribe: en vez de regalar acceso, se lo
 * quitaría esa misma noche sin avisar.
 */
export function fechaDeAccesoValida(valor: string, ahora: Date = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  if (Number.isNaN(Date.parse(valor))) return null;
  if (valor < hoyISO(ahora)) return null;
  return valor;
}

/** El instante exacto que se guarda: el final del día elegido, no su principio. */
export function finalDelDia(fecha: string): string {
  return `${fecha}T23:59:59.000Z`;
}
