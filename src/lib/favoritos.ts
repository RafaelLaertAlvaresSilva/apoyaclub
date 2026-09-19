/**
 * Lo que una empresa guarda para luego.
 *
 * Dos sitios, a propósito:
 *
 *   · Sin cuenta, en el navegador. Marcar algo tiene que ser un clic,
 *     y exigir una cuenta para guardar un club es perder a la empresa
 *     justo cuando estaba interesada. Lo que se guarda así vive solo en
 *     ese navegador: desde el móvil la lista sale vacía y si borra el
 *     historial se va. Es una cesta, no una cuenta.
 *
 *   · Con cuenta, en `company_favorites` (migración 0046). Ahí sí está
 *     en todos sus dispositivos.
 *
 * Y una pasarela entre los dos: al entrar en su panel, lo que tuviera
 * guardado en el navegador se sube a su cuenta y se vacía la cesta. Así
 * nadie pierde nada por haber empezado sin registrarse.
 */

export type TipoFavorito = "club" | "oportunidad";

export type Favorito = { tipo: TipoFavorito; id: string };

const CLAVE = "apoyaclub.favoritos.v1";

/**
 * El almacenamiento del navegador falla más de lo que parece: en
 * ventana privada, con las cookies bloqueadas o con el disco lleno,
 * leer o escribir lanza una excepción. Nada de esto puede tumbar la
 * página: si no se puede guardar, la web sigue funcionando sin
 * favoritos, que es lo de menos.
 */
function almacen(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function leerFavoritos(): Favorito[] {
  const donde = almacen();
  if (!donde) return [];

  try {
    const bruto = donde.getItem(CLAVE);
    if (!bruto) return [];
    return limpiar(JSON.parse(bruto));
  } catch {
    return [];
  }
}

/** Solo lo que tenga la forma correcta: lo de dentro lo escribió una
 * versión anterior de esto, o cualquiera con la consola abierta. */
export function limpiar(valor: unknown): Favorito[] {
  if (!Array.isArray(valor)) return [];

  const vistos = new Set<string>();
  const favoritos: Favorito[] = [];

  for (const bruto of valor.slice(0, 200)) {
    if (typeof bruto !== "object" || bruto === null) continue;
    const candidato = bruto as Record<string, unknown>;

    const tipo = candidato.tipo;
    const id = candidato.id;
    if (tipo !== "club" && tipo !== "oportunidad") continue;
    if (typeof id !== "string" || !id || id.length > 64) continue;

    const clave = `${tipo}:${id}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    favoritos.push({ tipo, id });
  }

  return favoritos;
}

function guardar(favoritos: Favorito[]): void {
  const donde = almacen();
  if (!donde) return;

  try {
    donde.setItem(CLAVE, JSON.stringify(favoritos));
  } catch {
    // Sin sitio o sin permiso. No hay nada que hacer y no es motivo
    // para romper nada.
  }
}

/**
 * La misma lista, sin construirla de nuevo cada vez.
 *
 * React necesita que, mientras nada cambie, esto devuelva exactamente
 * el mismo array: si cada llamada devolviera uno nuevo, lo tomaría por
 * un cambio y se quedaría repintando sin parar.
 */
let cache: Favorito[] = [];
let cacheAlDia = false;

export function instantanea(): Favorito[] {
  if (!cacheAlDia) {
    cache = leerFavoritos();
    cacheAlDia = true;
  }
  return cache;
}

/** Lo que hay guardado en el servidor, donde no hay navegador: nada, y
 * siempre el mismo array vacío, por el mismo motivo de arriba. */
const VACIO: Favorito[] = [];

export function instantaneaDelServidor(): Favorito[] {
  return VACIO;
}

export function estaGuardado(favoritos: Favorito[], tipo: TipoFavorito, id: string): boolean {
  return favoritos.some((favorito) => favorito.tipo === tipo && favorito.id === id);
}

/** Lo añade si no estaba y lo quita si estaba. Devuelve la lista nueva. */
export function alternarFavorito(tipo: TipoFavorito, id: string): Favorito[] {
  const actuales = leerFavoritos();
  const siguiente = estaGuardado(actuales, tipo, id)
    ? actuales.filter((favorito) => !(favorito.tipo === tipo && favorito.id === id))
    : [...actuales, { tipo, id }];

  guardar(siguiente);
  avisar();
  return siguiente;
}

export function vaciarFavoritos(): void {
  const donde = almacen();
  if (!donde) return;

  try {
    donde.removeItem(CLAVE);
  } catch {
    // Igual que al guardar: no hay nada que hacer.
  }
  avisar();
}

/**
 * Un aviso para que todos los botones de la página se enteren a la vez.
 *
 * Sin esto, marcar un club en una tarjeta dejaba el resto de la página
 * con el corazón antiguo hasta recargar: `localStorage` no avisa de sus
 * propios cambios dentro de la misma pestaña.
 */
const EVENTO = "apoyaclub:favoritos";

function avisar(): void {
  cacheAlDia = false;
  try {
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    // En el servidor no hay ventana a la que avisar.
  }
}

export function suscribirseAFavoritos(alCambiar: () => void): () => void {
  // La copia se marca como vieja ANTES de avisar: si no, React
  // preguntaría y le devolveríamos lo de antes.
  const aviso = () => {
    cacheAlDia = false;
    alCambiar();
  };

  window.addEventListener(EVENTO, aviso);
  // Y en las otras pestañas abiertas, que sí reciben "storage".
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}
