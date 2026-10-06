import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PANEL = join(process.cwd(), "src", "app", "[locale]", "panel");

/**
 * El archivo sin sus comentarios.
 *
 * Las comprobaciones de "aquí no aparece tal clase" miran el código, no
 * lo que se cuenta sobre él: el comentario que explica por qué se quitó
 * `bg-teal-700` contiene esas mismas letras, y sin esto la prueba se
 * caía por su propia explicación.
 */
function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const LISTA = readFileSync(
  join(PANEL, "renovaciones", "components", "ListaDeRenovaciones.tsx"),
  "utf8",
);
const PAGINA = readFileSync(join(PANEL, "renovaciones", "page.tsx"), "utf8");

/**
 * Renovaciones tiene que parecerse al resto del panel.
 *
 * Esto no es una manía de orden: la sección salió escrita a mano, con
 * su propio verde (`bg-teal-700`), sus propios campos y la tarjeta del
 * estado "sin fecha" en `bg-zinc-50` con el borde a rayas. Como el
 * fondo del panel también es gris claro, esa tarjeta se confundía con
 * la página: al lado de Patrocinadores —donde la tarjeta es blanca y
 * se recorta sobre el fondo— parecían dos webs distintas. El usuario
 * lo vio en cuanto abrió la sección.
 *
 * El fallo de fondo es que había dos maneras de pintar lo mismo, y la
 * segunda no se enteraba de los cambios de la primera. Estas pruebas
 * leen el archivo tal cual y cierran esa puerta: no comprueban que se
 * vea bonito —eso no lo puede comprobar una prueba—, comprueban que
 * esta sección no se invente colores que el panel ya tiene resueltos.
 */
describe("Renovaciones usa los colores del panel", () => {
  // Si el archivo cambia de nombre o se vacía, el resto de las
  // comprobaciones pasarían sin mirar nada.
  it("encuentra los dos archivos de la sección", () => {
    expect(LISTA).toContain("function ListaDeRenovaciones");
    expect(PAGINA).toContain("function RenovacionesPage");
  });

  it("pinta los campos con los del panel y no con los suyos", () => {
    // `Campo` y `clasesInput` son los de `SeccionCard`, los mismos de
    // las cuarenta casillas del panel.
    expect(LISTA).toContain('from "../../components/SeccionCard"');
    expect(LISTA).toContain("<Campo");
    expect(LISTA).toContain("className={clasesInput}");
  });

  it("guarda con el botón del sistema de diseño", () => {
    // `Button` es el que lleva el verde de la casa (brand-teal-dark).
    // Escrito a mano, el mismo verde acababa saliendo en quince tonos.
    expect(LISTA).toContain('from "@/components/ui/Button"');
    expect(LISTA).toContain("<Button type=\"submit\"");
  });

  it("avisa con los avisos del resto de la web", () => {
    expect(LISTA).toContain('from "@/components/AvisoError"');
    expect(LISTA).toContain("<AvisoError");
    expect(LISTA).toContain("<AvisoExito");
  });

  /**
   * La que de verdad arregla lo que se veía mal.
   *
   * La tarjeta de cada patrocinador es blanca SIEMPRE. El estado se
   * dice con el color del borde y un halo, nunca tiñendo el fondo:
   * sobre el gris claro del panel, una tarjeta teñida desaparece.
   */
  it("deja la tarjeta de cada patrocinador en blanco en los cinco estados", () => {
    expect(LISTA).toContain("rounded-xl border bg-white p-5");

    // El bloque ASPECTO, que es donde vive el aspecto de cada estado.
    const aspecto = LISTA.slice(LISTA.indexOf("const ASPECTO"), LISTA.indexOf("export function"));
    expect(aspecto.length).toBeGreaterThan(200);

    // Los cinco estados siguen ahí...
    for (const estado of ["pasada", "urgente", "proxima", "al-dia", "sin-fecha"]) {
      expect(aspecto).toContain(estado);
    }

    // ...y ninguno pinta fondo ni borde a rayas. `bg-` y `border-dashed`
    // dentro de ASPECTO son justo lo que hacía desaparecer la tarjeta;
    // el fondo de las pastillas va en su propia clave y por eso se mira
    // solo la de la caja.
    const cajas = [...aspecto.matchAll(/caja: "([^"]*)"/g)].map((m) => m[1]);
    expect(cajas).toHaveLength(5);
    for (const caja of cajas) {
      expect(caja).not.toContain("bg-");
      expect(caja).not.toContain("dashed");
    }
  });

  it("no se inventa verdes fuera de la paleta del panel", () => {
    // `bg-teal-700` era el del botón de guardar escrito a mano. El menú
    // del panel sí lo usa, pero ahí es el fondo del apartado abierto,
    // no un botón.
    const codigo = sinComentarios(LISTA);
    expect(codigo).not.toContain("bg-teal-700");
    expect(codigo).not.toContain("bg-teal-800");
  });

  it("da el aviso de arriba con la misma forma que los demás", () => {
    // Igual que AvisoError/AvisoExito: rounded-lg, borde 200, fondo 50.
    expect(PAGINA).toContain("rounded-lg border border-amber-200 bg-amber-50 px-4 py-3");
    expect(sinComentarios(PAGINA)).not.toContain("border-amber-300");
  });
});
