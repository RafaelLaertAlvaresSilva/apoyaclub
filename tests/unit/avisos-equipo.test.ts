import { describe, expect, it } from "vitest";
import { htmlDelAviso, importeDeStripe, queHaCambiado } from "@/lib/avisos-equipo";

describe("avisos al equipo: qué ha cambiado en la suscripción", () => {
  it("fin de la prueba con cobro = primer cobro", () => {
    expect(queHaCambiado({ status: "trialing" }, { status: "active", cancel_at_period_end: false })).toBe("primer-cobro");
  });

  it("cobro que falla, y cobro que se recupera", () => {
    expect(queHaCambiado({ status: "active" }, { status: "past_due", cancel_at_period_end: false })).toBe("cobro-fallido");
    expect(queHaCambiado({ status: "trialing" }, { status: "past_due", cancel_at_period_end: false })).toBe("cobro-fallido");
    expect(queHaCambiado({ status: "past_due" }, { status: "active", cancel_at_period_end: false })).toBe("cobro-recuperado");
  });

  it("cancelación programada", () => {
    expect(queHaCambiado({ cancel_at_period_end: false }, { status: "active", cancel_at_period_end: true })).toBe("cancelada");
  });

  it("una renovación normal o un cambio de tarjeta no avisan", () => {
    expect(queHaCambiado({}, { status: "active", cancel_at_period_end: false })).toBeNull();
    expect(queHaCambiado({ status: "active" }, { status: "active", cancel_at_period_end: false })).toBeNull();
    expect(queHaCambiado({ cancel_at_period_end: true }, { status: "active", cancel_at_period_end: false })).toBeNull();
  });
});

describe("avisos al equipo: el correo", () => {
  it("escapa lo que escribe la gente y quita las líneas vacías", () => {
    const html = htmlDelAviso({ asunto: "📩 Hola", lineas: ["Empresa: <script>x</script>", null, "", false] });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html.match(/<li/g)).toHaveLength(1);
  });

  it("importe en euros y en reales", () => {
    expect(importeDeStripe(2990, "eur", "month")?.replace(/\s/g, " ")).toBe("29,90 € al mes");
    expect(importeDeStripe(79000, "brl", "year")).toContain("R$");
    expect(importeDeStripe(null, "eur", "month")).toBeNull();
  });
});
