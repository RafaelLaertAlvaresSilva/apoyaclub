import { describe, expect, it } from "vitest";
import {
  ORDEN_MOTIVOS,
  diasEntre,
  motivoDeSalida,
  ordenarClubes,
  type ClubQueSeVa,
} from "@/lib/admin-bajas";

const AHORA = new Date("2026-06-01T12:00:00Z");

type Fila = Parameters<typeof motivoDeSalida>[0];

function fila(cambios: Partial<Fila> = {}): Fila {
  return {
    id: "club-1",
    slug: "club-1",
    name: "Club de Prueba",
    city: "Vigo",
    province: "Pontevedra",
    plan: "mensual",
    subscription_status: "active",
    trial_ends_at: null,
    admin_suspended: false,
    stripe_subscription_id: "sub_1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...cambios,
  };
}

describe("en qué grupo cae cada club", () => {
  it("un club al corriente no sale en el informe", () => {
    expect(motivoDeSalida(fila(), AHORA)).toBeNull();
  });

  it("un club en prueba con la prueba todavía abierta tampoco", () => {
    const club = fila({
      subscription_status: "trialing",
      stripe_subscription_id: null,
      trial_ends_at: "2026-07-01T00:00:00Z",
    });
    expect(motivoDeSalida(club, AHORA)).toBeNull();
  });

  it("el recibo devuelto es lo más urgente", () => {
    expect(motivoDeSalida(fila({ subscription_status: "past_due" }), AHORA)).toBe("dejo_de_pagar");
    expect(motivoDeSalida(fila({ subscription_status: "unpaid" }), AHORA)).toBe("dejo_de_pagar");
  });

  it("la suscripción cancelada es una baja", () => {
    expect(motivoDeSalida(fila({ subscription_status: "canceled" }), AHORA)).toBe(
      "suscripcion_cancelada",
    );
  });

  it("la prueba que se acabó sin tarjeta cuenta como caducada", () => {
    const club = fila({
      subscription_status: "trialing",
      stripe_subscription_id: null,
      trial_ends_at: "2026-02-01T00:00:00Z",
    });
    expect(motivoDeSalida(club, AHORA)).toBe("prueba_caducada");
  });

  it("la prueba acabada pero con suscripción de Stripe no cuenta: ya pasó por caja", () => {
    const club = fila({
      subscription_status: "trialing",
      stripe_subscription_id: "sub_9",
      trial_ends_at: "2026-02-01T00:00:00Z",
    });
    expect(motivoDeSalida(club, AHORA)).toBeNull();
  });

  /**
   * Quién lo dejó así es la primera pregunta. Si ApoyaClub lo suspendió,
   * eso es lo que hay que ver, aunque además deba dinero.
   */
  it("la suspensión de ApoyaClub manda sobre todo lo demás", () => {
    const club = fila({ admin_suspended: true, subscription_status: "past_due" });
    expect(motivoDeSalida(club, AHORA)).toBe("suspendido");
  });
});

describe("cuánto duró", () => {
  it("cuenta los días enteros entre el alta y la baja", () => {
    expect(diasEntre("2026-01-01T00:00:00Z", "2026-01-31T00:00:00Z")).toBe(30);
  });

  it("sin una de las dos fechas no se inventa nada", () => {
    expect(diasEntre(null, "2026-01-31T00:00:00Z")).toBeNull();
    expect(diasEntre("2026-01-01T00:00:00Z", null)).toBeNull();
  });

  it("nunca sale negativo", () => {
    expect(diasEntre("2026-02-01T00:00:00Z", "2026-01-01T00:00:00Z")).toBe(0);
  });
});

describe("el orden del listado", () => {
  function club(cambios: Partial<ClubQueSeVa>): ClubQueSeVa {
    return {
      clubId: "x",
      slug: "x",
      nombre: "X",
      localidad: null,
      provincia: null,
      motivo: "cuenta_borrada",
      plan: null,
      nombrePlan: null,
      alta: null,
      baja: null,
      duracionEnDias: null,
      llegoAPagar: false,
      motivoEscrito: null,
      ...cambios,
    };
  }

  it("delante lo que todavía se puede recuperar", () => {
    const ordenados = ordenarClubes([
      club({ nombre: "Borrado", motivo: "cuenta_borrada" }),
      club({ nombre: "Suspendido", motivo: "suspendido" }),
      club({ nombre: "Sin pagar", motivo: "dejo_de_pagar" }),
    ]);

    expect(ordenados.map((uno) => uno.nombre)).toEqual(["Sin pagar", "Suspendido", "Borrado"]);
  });

  it("dentro de un grupo, lo más reciente primero", () => {
    const ordenados = ordenarClubes([
      club({ nombre: "Viejo", motivo: "cuenta_borrada", baja: "2026-01-01T00:00:00Z" }),
      club({ nombre: "Nuevo", motivo: "cuenta_borrada", baja: "2026-05-01T00:00:00Z" }),
    ]);

    expect(ordenados.map((uno) => uno.nombre)).toEqual(["Nuevo", "Viejo"]);
  });

  it("no pierde ni duplica ninguno", () => {
    const entran = ORDEN_MOTIVOS.map((motivo) => club({ nombre: motivo, motivo }));
    expect(ordenarClubes(entran)).toHaveLength(ORDEN_MOTIVOS.length);
  });
});
