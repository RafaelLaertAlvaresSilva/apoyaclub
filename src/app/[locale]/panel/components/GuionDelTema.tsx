/**
 * Decide el tema ANTES de que el navegador pinte nada.
 *
 * EL PARPADEO ES EL PROBLEMA. Si esto se hiciera en React, el navegador
 * pintaría primero la página clara —que es lo que viene en el HTML del
 * servidor— y medio segundo después se volvería oscura. Un fogonazo
 * blanco en toda la pantalla cada vez que el club entra en su panel, y
 * justo de noche, que es cuando usa el modo oscuro. Se nota muchísimo y
 * no hay forma de arreglarlo después.
 *
 * Por eso va como un `<script>` suelto y no como un componente normal:
 * el navegador lo ejecuta mientras lee el HTML, antes de pintar.
 *
 * Y POR ESO VIVE EN EL ESQUELETO DE TODA LA WEB y no dentro del panel.
 * Dentro del panel quedaba demasiado abajo: el navegador ya había
 * pintado el fondo claro de la página antes de llegar a él. Medido
 * grabando los fotogramas que el navegador pinta de verdad, quedaba uno
 * claro. Puesto el primero de todo, no queda ninguno. El candado de
 * `location.pathname` es lo que impide que toque nada fuera del panel.
 *
 * QUÉ DECIDE. Si el club ha elegido a mano, manda su elección. Si no,
 * lo que diga el móvil o el ordenador. En los dos casos deja escrito
 * `claro` u `oscuro` en el <html>, de modo que el CSS no tiene que
 * saber nada de ajustes del sistema: mira un atributo y ya.
 *
 * Y SI FALLA, NO SE LLEVA LA PÁGINA POR DELANTE. Todo va dentro de un
 * try: en navegación privada, con las cookies bloqueadas o con el
 * almacenamiento lleno, `localStorage` lanza un error. Sin el try, ese
 * error dejaría el panel en blanco. Con él, el club ve el modo claro,
 * que es un mal menor razonable.
 */

export const CLAVE_DEL_TEMA = "apoyaclub-tema-panel";

const GUION = `
(function () {
  try {
    // Solo en el panel. Este guion vive en el esqueleto de TODA la web
    // —tiene que ir ahí para correr antes del primer pintado— así que
    // es él quien mira dónde está. En la portada o en la página pública
    // de un club no hace nada.
    if (!/\\/panel(\\/|$)/.test(location.pathname)) return;
    var elegido = localStorage.getItem('${CLAVE_DEL_TEMA}');
    var oscuro = elegido
      ? elegido === 'oscuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.temaPanel = oscuro ? 'oscuro' : 'claro';
  } catch (e) {
    document.documentElement.dataset.temaPanel = 'claro';
  }
})();
`;

/**
 * Lo mismo que hace el guion, pero en condiciones de poder llamarlo.
 *
 * Hace falta porque el guion de arriba SOLO se ejecuta cuando la página
 * se carga entera. Si el club llega al panel desde otra página de la
 * web pulsando un enlace, Next cambia el contenido sin recargar y ese
 * `<script>` no se vuelve a ejecutar: React no ejecuta los guiones que
 * mete por su cuenta. Sin esto, entrar al panel desde la portada lo
 * dejaba en claro aunque el club tuviera elegido el oscuro.
 *
 * Si se cambia una de las dos, hay que cambiar la otra.
 */
export function aplicarTema() {
  try {
    const elegido = localStorage.getItem(CLAVE_DEL_TEMA);
    const oscuro = elegido
      ? elegido === "oscuro"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.temaPanel = oscuro ? "oscuro" : "claro";
  } catch {
    document.documentElement.dataset.temaPanel = "claro";
  }
}

/**
 * Y quitarlo al salir del panel.
 *
 * El atributo vive en el <html>, que es el mismo para toda la web. Si
 * el club le da a "Volver a la portada", Next cambia el contenido sin
 * recargar y el atributo se quedaría puesto: la portada saldría con el
 * fondo oscuro y todo lo demás claro.
 */
export function olvidarTema() {
  delete document.documentElement.dataset.temaPanel;
}

export function GuionDelTema() {
  /**
   * `dangerouslySetInnerHTML` es la única forma de meter un script que
   * corra antes de que React tome el control. El contenido es nuestro y
   * fijo: no entra en él nada escrito por nadie, que es lo que haría
   * peligroso un script así.
   *
   * QUEDA UN FOTOGRAMA. Medido grabando lo que el navegador pinta de
   * verdad, en la versión de producción: al abrir el panel de cero se
   * ve un fotograma (unos 16 ms) con el fondo claro antes de que entre
   * el oscuro. Para quitarlo del todo habría que mandar el tema desde
   * el servidor en una cookie, y eso obliga a que TODAS las páginas de
   * la web se generen en cada visita —incluidas las públicas, que hoy
   * se sirven ya hechas—, lo que es mal negocio por 16 ms. Se probó a
   * subirlo con `next/script` y `beforeInteractive`: Next lo deja
   * igualmente en el cuerpo, así que no cambia nada.
   *
   * Al movarse DENTRO del panel no hay ningún parpadeo, porque la
   * página no se vuelve a cargar.
   */
  return <script dangerouslySetInnerHTML={{ __html: GUION }} />;
}
