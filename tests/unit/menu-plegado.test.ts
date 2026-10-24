import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COOKIE_MENU_PLEGADO, cookieDelMenu, estaPlegado } from "@/lib/menu-plegado";

const leer = (...partes: string[]) => readFileSync(join(process.cwd(), ...partes), "utf8");

describe("menú del panel plegable", () => {
  it("solo está plegado si la cookie lo dice; sin cookie, abierto", () => {
    expect(estaPlegado("plegado")).toBe(true);
    expect(estaPlegado(undefined)).toBe(false);
    expect(estaPlegado("")).toBe(false);
    expect(estaPlegado("abierto")).toBe(false);
  });

  it("la cookie que escribe el botón es la misma que lee el servidor", () => {
    const plegar = cookieDelMenu(true);
    const valor = plegar.split(";")[0].split("=")[1];
    expect(plegar.startsWith(`${COOKIE_MENU_PLEGADO}=`)).toBe(true);
    expect(estaPlegado(valor)).toBe(true);
    expect(plegar).toContain("path=/");
    // Desplegar la borra.
    expect(cookieDelMenu(false)).toContain("max-age=0");
  });

  it("el layout del panel lee la cookie y se la pasa al menú", () => {
    const layout = leer("src", "app", "[locale]", "panel", "layout.tsx");
    expect(layout).toContain("get(COOKIE_MENU_PLEGADO)");
    expect(layout).toContain("plegado={menuPlegado}");
    const nav = leer("src", "app", "[locale]", "panel", "components", "PanelNav.tsx");
    expect(nav).toContain("plegadoInicial={plegado}");
  });

  it("el menú tiene los dos botones y guarda la elección", () => {
    const menu = leer("src", "app", "[locale]", "panel", "components", "MenuDelPanel.tsx");
    expect(menu).toContain('t("ocultarMenu")');
    expect(menu).toContain('t("mostrarMenu")');
    expect(menu).toContain("document.cookie = cookieDelMenu(nuevo)");
  });
});
