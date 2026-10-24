/**
 * Si el club ha plegado el menú de la izquierda del panel (en el
 * ordenador), para trabajar con más ancho en las herramientas.
 *
 * Se guarda en una cookie y no en `localStorage` a propósito: la cookie
 * la lee el servidor al pintar la página, así que el menú ya llega
 * plegado. Con `localStorage` se vería un instante abierto y luego se
 * cerraría de golpe en cada cambio de página.
 */
export const COOKIE_MENU_PLEGADO = "menu-panel";

const VALOR_PLEGADO = "plegado";

/** Lo que dice la cookie (o su ausencia): abierto salvo que diga plegado. */
export function estaPlegado(valor: string | undefined | null): boolean {
  return valor === VALOR_PLEGADO;
}

/** La cookie entera, lista para `document.cookie`. Un año, todo el sitio. */
export function cookieDelMenu(plegado: boolean): string {
  return plegado
    ? `${COOKIE_MENU_PLEGADO}=${VALOR_PLEGADO}; path=/; max-age=31536000; samesite=lax`
    : `${COOKIE_MENU_PLEGADO}=; path=/; max-age=0; samesite=lax`;
}
