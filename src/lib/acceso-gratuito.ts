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

/** La fecha de dentro de N meses, en "AAAA-MM-DD". */
export function dentroDeMeses(meses: number, ahora: Date = new Date()): string {
  const destino = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + meses, ahora.getUTCDate()),
  );
  return destino.toISOString().slice(0, 10);
}

/**
 * El 30 de junio con el que termina la temporada en curso.
 *
 * En España la temporada va de verano a verano, así que a partir del 1
 * de julio la que cuenta es la del año siguiente. Es la fecha que
 * iguala a todos los clubes invitados: acaban el mismo día, y ese día
 * cae cuando un club decide su presupuesto para la siguiente.
 */
export function finDeTemporada(ahora: Date = new Date()): string {
  const anio = ahora.getUTCMonth() + 1 >= MES_FIN_DE_TEMPORADA ? ahora.getUTCFullYear() + 1 : ahora.getUTCFullYear();
  return `${anio}-06-30`;
}

/** Julio: el primer mes que ya cuenta para la temporada siguiente. */
export const MES_FIN_DE_TEMPORADA = 7;

/** Lo que se puede pedir desde los botones rápidos del panel. */
export type PlazoRegalado = "6-meses" | "1-anio" | "temporada";

export function fechaDelPlazo(plazo: string, ahora: Date = new Date()): string | null {
  if (plazo === "6-meses") return dentroDeMeses(6, ahora);
  if (plazo === "1-anio") return unAnioDesde(ahora);
  if (plazo === "temporada") return finDeTemporada(ahora);
  return null;
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
