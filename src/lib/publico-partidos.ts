/**
 * El registro de público en los partidos (migración 0037).
 *
 * Aquí solo hay cálculo puro: a qué temporada pertenece un partido y
 * qué sale de un montón de ellos. Las consultas están en
 * `partidos-datos.ts`.
 *
 * Sobre las fechas: `played_on` es `date` en Postgres, sin hora ni zona
 * horaria, y llega como "2026-09-04". Se compara y se trocea como
 * texto, nunca convirtiéndola a `Date`: una fecha sin hora se
 * interpreta como medianoche UTC y a un club español en verano le
 * cambiaría el día — y con él, la temporada de los partidos de junio.
 */

export type Partido = {
  id: string;
  clubId: string;
  fecha: string;
  rival: string;
  competicion: string | null;
  equipo: string | null;
  enCasa: boolean;
  publico: number;
  notas: string | null;
};

export type PartidoRow = {
  id: string;
  club_id: string;
  played_on: string;
  opponent: string;
  competition: string | null;
  team: string | null;
  home: boolean;
  attendance: number;
  notes: string | null;
};

export function partidoRowToPartido(row: PartidoRow): Partido {
  return {
    id: row.id,
    clubId: row.club_id,
    fecha: row.played_on,
    rival: row.opponent,
    competicion: row.competition,
    equipo: row.team,
    enCasa: row.home,
    publico: row.attendance,
    notas: row.notes,
  };
}

/**
 * La temporada a la que pertenece una fecha, como "2025/26".
 *
 * En España la temporada va de verano a verano, no de enero a
 * diciembre: un partido del 15 de mayo de 2026 es de la 2025/26, no de
 * la 2026/27. El corte se pone el 1 de julio, que es cuando ya han
 * terminado hasta los play-offs.
 */
export const MES_DE_CORTE = 7;

export function temporadaDe(fechaISO: string): string {
  const [anio, mes] = fechaISO.split("-").map(Number);
  const inicio = mes >= MES_DE_CORTE ? anio : anio - 1;
  return `${inicio}/${String((inicio + 1) % 100).padStart(2, "0")}`;
}

/** Números de un conjunto de partidos. Todo se calcula, nada se guarda. */
export type ResumenDePublico = {
  partidos: number;
  total: number;
  media: number | null;
  mejor: Partido | null;
};

export function resumirPublico(partidos: Partido[]): ResumenDePublico {
  if (partidos.length === 0) return { partidos: 0, total: 0, media: null, mejor: null };

  const total = partidos.reduce((suma, partido) => suma + partido.publico, 0);

  // Se redondea al entero: "media de 243,5 personas" no significa nada
  // para nadie y en un dossier queda a medio hacer.
  const media = Math.round(total / partidos.length);

  const mejor = partidos.reduce((mayor, partido) =>
    partido.publico > mayor.publico ? partido : mayor,
  );

  return { partidos: partidos.length, total, media, mejor };
}

/** Solo los de casa: es la media que le importa a quien pone una valla. */
export function soloEnCasa(partidos: Partido[]): Partido[] {
  return partidos.filter((partido) => partido.enCasa);
}

export type TemporadaDePartidos = {
  temporada: string;
  partidos: Partido[];
  resumen: ResumenDePublico;
  resumenEnCasa: ResumenDePublico;
};

/**
 * Los partidos agrupados por temporada, de la más reciente a la más
 * antigua, y dentro de cada una del partido más reciente al más viejo.
 */
export function agruparPorTemporada(partidos: Partido[]): TemporadaDePartidos[] {
  const porTemporada = new Map<string, Partido[]>();

  for (const partido of partidos) {
    const temporada = temporadaDe(partido.fecha);
    const lista = porTemporada.get(temporada);
    if (lista) lista.push(partido);
    else porTemporada.set(temporada, [partido]);
  }

  return [...porTemporada.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([temporada, deLaTemporada]) => {
      const ordenados = [...deLaTemporada].sort((a, b) => b.fecha.localeCompare(a.fecha));
      return {
        temporada,
        partidos: ordenados,
        resumen: resumirPublico(ordenados),
        resumenEnCasa: resumirPublico(soloEnCasa(ordenados)),
      };
    });
}

/**
 * La media que se le propone al club llevarse a su ficha.
 *
 * Es la de los partidos en casa de la temporada más reciente que tenga
 * registrada, y si en esa temporada no jugó ninguno en casa, la de
 * todos sus partidos. Se prefiere lo reciente a lo abundante: un club
 * que ha subido de categoría no quiere enseñar la media de hace tres
 * años porque haya más partidos apuntados.
 */
export function mediaParaLaFicha(partidos: Partido[]): number | null {
  const temporadas = agruparPorTemporada(partidos);
  if (temporadas.length === 0) return null;

  const ultima = temporadas[0];
  return ultima.resumenEnCasa.media ?? ultima.resumen.media;
}

/** "12 de mayo de 2026" a partir de "2026-05-12", sin pasar por Date. */
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

export function fechaLarga(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const nombre = MESES[mes - 1];
  if (!nombre) return fechaISO;
  return `${dia} de ${nombre} de ${anio}`;
}

/** "12/05/2026", para las tablas donde no cabe la fecha larga. */
export function fechaCorta(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  if (!anio || !mes || !dia) return fechaISO;
  return `${dia}/${mes}/${anio}`;
}

/**
 * La fecha de hoy como "AAAA-MM-DD", para dejar el formulario ya
 * relleno. Se arma con la fecha local del navegador y no con
 * `toISOString()`, que devuelve la de UTC: un club español apuntando un
 * partido a las once de la noche vería la fecha de mañana.
 */
export function hoyParaElFormulario(ahora: Date = new Date()): string {
  const dosCifras = (n: number) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${dosCifras(ahora.getMonth() + 1)}-${dosCifras(ahora.getDate())}`;
}
