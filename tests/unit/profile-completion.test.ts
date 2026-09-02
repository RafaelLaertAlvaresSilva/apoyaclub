import { describe, expect, it } from "vitest";
import { calcularPorcentajeCompletado } from "@/lib/profile-completion";
import { equipoDePrueba, patrocinadorDePrueba, perfilDePrueba } from "../fixtures/club";

describe("calcularPorcentajeCompletado", () => {
  it("es 0 cuando todavía no hay club", () => {
    expect(calcularPorcentajeCompletado(null, [], [])).toBe(0);
  });

  it("es 0 con un club recién creado (solo nombre y localidad)", () => {
    expect(calcularPorcentajeCompletado(perfilDePrueba(), [], [])).toBe(0);
  });

  it("sube al rellenar una sección y nunca pasa de 100", () => {
    const soloEquipos = calcularPorcentajeCompletado(perfilDePrueba(), [equipoDePrueba()], []);
    expect(soloEquipos).toBeGreaterThan(0);
    expect(soloEquipos).toBeLessThan(100);

    const completo = calcularPorcentajeCompletado(
      perfilDePrueba({
        logoUrl: "https://ejemplo/logo.png",
        photoUrls: ["https://ejemplo/foto.jpg"],
        videoUrl: "https://ejemplo/video",
        description: "Un club de barrio con 40 años de historia.",
        website: "https://ejemplo",
        socialLinks: { instagram: "https://instagram.com/club" },
        topCategory: "Primera Nacional",
        competitions: "Liga y Copa",
        achievements: "Campeón autonómico 2024",
        youthTeamsCount: 8,
        youthPlayersCount: 120,
        youthFamiliesCount: 95,
        foundingYear: 1986,
        milestones: [{ year: 1986, text: "Fundación del club" }],
        followersByNetwork: { instagram: 3200 },
        estimatedReach: 25000,
        averageAttendance: 350,
        communityActions: [{ title: "Escuela inclusiva", description: "Plazas gratuitas para familias del barrio." }],
        facilities: "Pabellón municipal",
      }),
      [equipoDePrueba()],
      [patrocinadorDePrueba()],
    );

    expect(completo).toBe(100);
  });

  it("ninguna sección pesa más que otra: rellenar solo una no llega a la mitad", () => {
    const soloIdentidad = calcularPorcentajeCompletado(
      perfilDePrueba({
        logoUrl: "https://ejemplo/logo.png",
        photoUrls: ["https://ejemplo/foto.jpg"],
        videoUrl: "https://ejemplo/video",
        description: "Texto",
        website: "https://ejemplo",
        socialLinks: { instagram: "https://instagram.com/club" },
      }),
      [],
      [],
    );

    expect(soloIdentidad).toBeLessThan(50);
  });
});
