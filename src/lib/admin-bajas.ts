import { createAdminClient } from "@/lib/supabase/admin";
import { esPlanValido, PLANES, type PlanId } from "@/lib/planes";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";

/**
 * Quién se está yendo, y por dónde.
 *
 * Tres cosas distintas que se confunden con facilidad y que hay que
 * mirar juntas:
 *
 *   · Los que se han BORRADO la cuenta. Su fila ya no existe; lo que se
 *     ve aquí es el registro de bajas (migración 0045).
 *   · Los que están DE BAJA: la suscripción cancelada, o suspendidos
 *     por ApoyaClub. La cuenta sigue ahí y se puede recuperar.
 *   · Los que han DEJADO DE PAGAR: un recibo devuelto, una tarjeta
 *     caducada. Todavía no se han ido, y una llamada a tiempo los
 *     conserva. Es el grupo que más urge.
 *
 * Y un cuarto, el más silencioso: los que se quedaron en la prueba y
 * nunca llegaron a pagar. No se han dado de baja de nada, simplemente
 * no volvieron.
 */

export type MotivoDeSalida =
  | "cuenta_borrada"
  | "suscripcion_cancelada"
  | "suspendido"
  | "dejo_de_pagar"
  | "prueba_caducada";

export const ETIQUETA_MOTIVO: Record<MotivoDeSalida, string> = {
  cuenta_borrada: "Cuenta borrada",
  suscripcion_cancelada: "Suscripción cancelada",
  suspendido: "Suspendido por ApoyaClub",
  dejo_de_pagar: "Ha dejado de pagar",
  prueba_caducada: "Prueba caducada sin pagar",
};

/** Lo que más urge, primero. */
export const ORDEN_MOTIVOS: MotivoDeSalida[] = [
  "dejo_de_pagar",
  "prueba_caducada",
  "suscripcion_cancelada",
  "suspendido",
  "cuenta_borrada",
];

export type ClubQueSeVa = {
  /** Null cuando la cuenta ya no existe: no hay ficha que abrir. */
  clubId: string | null;
  slug: string | null;
  nombre: string;
  localidad: string | null;
  provincia: string | null;
  motivo: MotivoDeSalida;
  plan: PlanId | null;
  nombrePlan: string | null;
  /** Cuándo se dio de alta. */
  alta: string | null;
  /** Cuándo se fue, si se fue del todo. */
  baja: string | null;
  /** Días que duró, de alta a baja. Null si sigue ahí o falta la fecha. */
  duracionEnDias: number | null;
  /** Si llegó a pagar alguna vez. */
  llegoAPagar: boolean;
  /** Lo que contó al irse, si contó algo. */
  motivoEscrito: string | null;
};

export type InformeDeBajas = {
  clubes: ClubQueSeVa[];
  /** Cuántos hay de cada motivo. */
  porMotivo: Record<MotivoDeSalida, number>;
  /** De los que se fueron del todo, cuántos habían llegado a pagar. */
  seFueronPagando: number;
};

type FilaClub = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  province: string | null;
  plan: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  admin_suspended: boolean | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string | null;
};

type FilaBaja = {
  club_id: string;
  club_name: string;
  city: string | null;
  province: string | null;
  plan: string | null;
  subscription_status: string | null;
  ever_paid: boolean;
  signed_up_at: string | null;
  closed_at: string;
  reason: string | null;
};

function nombreDelPlan(plan: string | null): { plan: PlanId | null; nombre: string | null } {
  if (!plan || !esPlanValido(plan)) return { plan: null, nombre: null };
  return { plan, nombre: PLANES[plan].nombre };
}

/** Días enteros entre dos fechas. Null si falta alguna. */
export function diasEntre(desde: string | null, hasta: string | null): number | null {
  if (!desde || !hasta) return null;
  const inicio = new Date(desde).getTime();
  const fin = new Date(hasta).getTime();
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return null;
  return Math.max(0, Math.floor((fin - inicio) / (24 * 60 * 60 * 1000)));
}

/**
 * En qué grupo cae un club que sigue existiendo, o null si está bien.
 *
 * El orden importa: un club suspendido por ApoyaClub cuenta como
 * suspendido aunque además deba dinero, porque la primera pregunta es
 * quién lo dejó así.
 */
export function motivoDeSalida(fila: FilaClub, ahora: Date): MotivoDeSalida | null {
  if (fila.admin_suspended) return "suspendido";

  const estado = fila.subscription_status;
  if (estado === "canceled") return "suscripcion_cancelada";
  if (estado === "past_due" || estado === "unpaid") return "dejo_de_pagar";

  // La prueba que se acabó sin llegar a pagar. Se mira la fecha y no
  // solo el estado porque un club puede quedarse en "trialing" para
  // siempre si nunca metió tarjeta.
  const enPrueba = estado === "trialing" || estado === null;
  const pruebaAcabada =
    !!fila.trial_ends_at && new Date(fila.trial_ends_at).getTime() < ahora.getTime();
  if (enPrueba && pruebaAcabada && !fila.stripe_subscription_id) return "prueba_caducada";

  return null;
}

export async function obtenerInformeDeBajas(ahora: Date = new Date()): Promise<InformeDeBajas> {
  const admin = createAdminClient();

  const [{ data: filasClubes }, { data: filasBajas }] = await Promise.all([
    admin
      .from("clubs")
      .select(
        "id, slug, name, city, province, plan, subscription_status, trial_ends_at, admin_suspended, stripe_subscription_id, created_at, updated_at",
      )
      .returns<FilaClub[]>(),
    admin
      .from("club_closures")
      .select("*")
      .order("closed_at", { ascending: false })
      .returns<FilaBaja[]>(),
  ]);

  const clubes: ClubQueSeVa[] = [];

  for (const fila of filasClubes ?? []) {
    const motivo = motivoDeSalida(fila, ahora);
    if (!motivo) continue;

    const { plan, nombre } = nombreDelPlan(fila.plan);
    clubes.push({
      clubId: fila.id,
      slug: fila.slug,
      nombre: fila.name,
      localidad: fila.city,
      provincia: fila.province,
      motivo,
      plan,
      nombrePlan: nombre,
      alta: fila.created_at,
      // Sigue existiendo: no hay fecha de baja. La de la última
      // modificación diría cualquier otra cosa.
      baja: null,
      duracionEnDias: null,
      llegoAPagar: !!fila.stripe_subscription_id && fila.subscription_status !== "trialing",
      motivoEscrito: null,
    });
  }

  // La tabla de bajas puede no existir todavía (migración 0045 sin
  // aplicar): el informe se sigue viendo, sin este grupo.
  for (const fila of filasBajas ?? []) {
    const { plan, nombre } = nombreDelPlan(fila.plan);
    clubes.push({
      clubId: null,
      slug: null,
      nombre: fila.club_name,
      localidad: fila.city,
      provincia: fila.province,
      motivo: "cuenta_borrada",
      plan,
      nombrePlan: nombre,
      alta: fila.signed_up_at,
      baja: fila.closed_at,
      duracionEnDias: diasEntre(fila.signed_up_at, fila.closed_at),
      llegoAPagar: fila.ever_paid,
      motivoEscrito: fila.reason,
    });
  }

  const porMotivo = Object.fromEntries(
    ORDEN_MOTIVOS.map((motivo) => [motivo, 0]),
  ) as Record<MotivoDeSalida, number>;
  for (const club of clubes) porMotivo[club.motivo] += 1;

  return {
    clubes: ordenarClubes(clubes),
    porMotivo,
    seFueronPagando: clubes.filter((club) => club.llegoAPagar).length,
  };
}

/** Por urgencia del motivo y, dentro de cada grupo, lo más reciente
 * primero. */
export function ordenarClubes(clubes: ClubQueSeVa[]): ClubQueSeVa[] {
  return [...clubes].sort((a, b) => {
    const porMotivo = ORDEN_MOTIVOS.indexOf(a.motivo) - ORDEN_MOTIVOS.indexOf(b.motivo);
    if (porMotivo !== 0) return porMotivo;
    return (b.baja ?? b.alta ?? "").localeCompare(a.baja ?? a.alta ?? "");
  });
}
