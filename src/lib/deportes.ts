/**
 * La lista de deportes.
 *
 * Hasta ahora el deporte de cada equipo se escribía a mano, y con un
 * solo deporte no pasaba nada. Con clubes de varios, "Voleibol", "Vóley"
 * y "voley" salían en el buscador como tres deportes distintos, y una
 * empresa que filtraba por uno no veía a los otros dos.
 *
 * Ahora el club elige de esta lista (o "Otro" y lo escribe). En la base
 * de datos se guarda el `nombre` en español, igual que el sexo del
 * equipo, y en pantalla se traduce con `common.etiquetas.deporte.<clave>`.
 * Lo que ya estaba escrito a mano se reconoce por sus sinónimos, así que
 * no hace falta tocar los equipos que ya existen.
 */
export type Deporte = { clave: string; nombre: string; sinonimos: string[] };

export const DEPORTES: Deporte[] = [
  { clave: "balonmano", nombre: "Balonmano", sinonimos: ["handball", "hand ball"] },
  { clave: "futbol", nombre: "Fútbol", sinonimos: ["futbol 11", "football", "soccer"] },
  { clave: "futbolSala", nombre: "Fútbol sala", sinonimos: ["futsal", "futbol-sala", "fútbol-sala"] },
  { clave: "baloncesto", nombre: "Baloncesto", sinonimos: ["basket", "basquet", "básquet", "basketball"] },
  { clave: "voleibol", nombre: "Voleibol", sinonimos: ["voley", "vóley", "volei", "vólei", "volleyball", "volley", "balonvolea"] },
  { clave: "voleyPlaya", nombre: "Vóley playa", sinonimos: ["voley playa", "beach volley", "voleibol playa"] },
  { clave: "rugby", nombre: "Rugby", sinonimos: ["rugbi"] },
  { clave: "hockeyHierba", nombre: "Hockey hierba", sinonimos: ["hockey sobre hierba"] },
  { clave: "hockeyPatines", nombre: "Hockey patines", sinonimos: ["hockey sobre patines", "hockey patín"] },
  { clave: "waterpolo", nombre: "Waterpolo", sinonimos: ["water polo"] },
  { clave: "padel", nombre: "Pádel", sinonimos: ["padel", "paddle"] },
  { clave: "tenis", nombre: "Tenis", sinonimos: ["tennis"] },
  { clave: "tenisMesa", nombre: "Tenis de mesa", sinonimos: ["ping pong", "pingpong"] },
  { clave: "atletismo", nombre: "Atletismo", sinonimos: ["athletics"] },
  { clave: "natacion", nombre: "Natación", sinonimos: ["swimming"] },
  { clave: "ciclismo", nombre: "Ciclismo", sinonimos: ["cycling"] },
  { clave: "triatlon", nombre: "Triatlón", sinonimos: ["triathlon"] },
  { clave: "gimnasia", nombre: "Gimnasia", sinonimos: ["gimnasia ritmica", "gimnasia rítmica"] },
  { clave: "patinaje", nombre: "Patinaje", sinonimos: ["patinaje artistico", "patinaje artístico"] },
  { clave: "artesMarciales", nombre: "Artes marciales", sinonimos: ["karate", "judo", "taekwondo"] },
];

/** "Vóley-Playa " → "voleyplaya": sin acentos, sin mayúsculas, sin espacios ni guiones. */
function llave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const POR_LLAVE = new Map<string, Deporte>();
for (const deporte of DEPORTES) {
  for (const texto of [deporte.nombre, deporte.clave, ...deporte.sinonimos]) {
    POR_LLAVE.set(llave(texto), deporte);
  }
}

/** El deporte de la lista que corresponde a un texto, o `null` si no es ninguno. */
export function deporteDeLaLista(texto: string | null | undefined): Deporte | null {
  if (!texto) return null;
  return POR_LLAVE.get(llave(texto)) ?? null;
}

/**
 * Cómo se guarda: el nombre de la lista si lo reconoce ("voley" →
 * "Voleibol"); si no, lo escrito, sin espacios de sobra y con la primera
 * en mayúscula, para que "petanca" y "Petanca" no salgan dos veces.
 */
export function normalizarDeporte(texto: string): string {
  const deLaLista = deporteDeLaLista(texto);
  if (deLaLista) return deLaLista.nombre;
  const limpio = texto.trim().replace(/\s+/g, " ");
  return limpio.charAt(0).toLocaleUpperCase("es") + limpio.slice(1);
}

/**
 * Todas las formas en que puede estar escrito ya en la base de datos,
 * para que el filtro del buscador encuentre también los equipos dados de
 * alta antes de que existiera la lista. La comparación en la base de
 * datos distingue mayúsculas, así que van las tres formas habituales.
 */
export function variantesDelDeporte(nombre: string): string[] {
  const deporte = deporteDeLaLista(nombre);
  const textos = deporte ? [deporte.nombre, ...deporte.sinonimos] : [nombre];
  const variantes = new Set<string>();
  for (const texto of textos) {
    const minusculas = texto.toLocaleLowerCase("es");
    variantes.add(texto);
    variantes.add(minusculas);
    variantes.add(minusculas.charAt(0).toLocaleUpperCase("es") + minusculas.slice(1));
    variantes.add(texto.toLocaleUpperCase("es"));
  }
  return [...variantes];
}

/** El nombre en el idioma de la pantalla; lo escrito a mano, tal cual. */
export function nombreDelDeporte(texto: string, t: (clave: string) => string): string {
  const deporte = deporteDeLaLista(texto);
  return deporte ? t(`deporte.${deporte.clave}`) : texto;
}
