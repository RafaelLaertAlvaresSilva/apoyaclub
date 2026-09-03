import { describe, expect, it } from "vitest";
import { perfilDePrueba } from "../fixtures/club";

/**
 * Los hitos llegan del navegador como JSON construido por el propio
 * formulario, y su enlace de vídeo se pinta luego como un enlace en la
 * ficha pública. Sin filtrar el esquema, un `javascript:` guardado ahí se
 * ejecutaría en el navegador de quien visite la página del club.
 *
 * `sanearHitos` vive dentro de un módulo "use server", que no se puede
 * importar desde una prueba; lo que se fija aquí es el contrato de la
 * forma que espera el resto del código.
 */
describe("forma de un hito", () => {
  it("admite hitos sin foto ni vídeo", () => {
    const perfil = perfilDePrueba({ milestones: [{ year: 1999, text: "Fundación" }] });
    expect(perfil.milestones[0].photoUrl).toBeUndefined();
    expect(perfil.milestones[0].videoUrl).toBeUndefined();
  });

  it("admite hitos con foto y vídeo", () => {
    const perfil = perfilDePrueba({
      milestones: [
        {
          year: 2019,
          text: "Ascenso a Primera Nacional",
          photoUrl: "https://ejemplo.es/ascenso.jpg",
          videoUrl: "https://youtube.com/watch?v=abc",
        },
      ],
    });

    expect(perfil.milestones[0].photoUrl).toBe("https://ejemplo.es/ascenso.jpg");
    expect(perfil.milestones[0].videoUrl).toBe("https://youtube.com/watch?v=abc");
  });
});
