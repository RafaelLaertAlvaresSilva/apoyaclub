/**
 * Los deportes que tienen página de club de ejemplo (todos los de la lista) (`/ejemplo/<clave>`).
 * Las claves son las de `lib/deportes.ts`. Lo usan la propia página y el
 * formulario de equipos del panel, que enseña el enlace al elegir uno.
 */
export const DEPORTES_CON_EJEMPLO = [
  "tenis",
  "padel",
  "badminton",
  "baloncesto",
  "balonmano",
  "voleibol",
  "futbol",
  "futbolSala",
  "airsoft",
  "paintball",
  "voleyPlaya",
  "rugby",
  "hockeyHierba",
  "hockeyPatines",
  "waterpolo",
  "tenisMesa",
  "atletismo",
  "running",
  "natacion",
  "ciclismo",
  "triatlon",
  "gimnasia",
  "patinaje",
  "artesMarciales",
] as const;

export function tieneEjemplo(clave: string | null | undefined): boolean {
  return !!clave && (DEPORTES_CON_EJEMPLO as readonly string[]).includes(clave);
}
