/**
 * Las tareas que el club le debe a cada patrocinador (migración 0030).
 *
 * Aquí solo hay lógica pura: qué estado le toca a una tarea, cómo se
 * agrupan y cómo se ordenan. Las consultas están en `tareas-datos.ts`.
 *
 * Sobre las fechas: `starts_on` y `due_on` son `date` en Postgres, sin
 * hora ni zona horaria, y llegan como "2026-09-04". Se comparan como
 * texto y no como Date a propósito: en cuanto se convierte a Date, una
 * fecha sin hora se interpreta como medianoche UTC y a un club español
 * en verano le aparecen tareas vencidas un día antes de tiempo.
 */

export type EstadoTarea = "pendiente" | "hecho" | "cancelado";

export type TareaPatrocinio = {
  id: string;
  clubId: string;
  empresa: string;
  patrocinadorId: string | null;
  accion: string;
  notas: string | null;
  inicio: string | null;
  fin: string;
  estado: EstadoTarea;
  hechaEn: string | null;
  pruebaUrl: string | null;
  creadaEn: string;
};

export type TareaRow = {
  id: string;
  club_id: string;
  company_name: string;
  sponsor_id: string | null;
  action: string;
  notes: string | null;
  starts_on: string | null;
  due_on: string;
  status: string;
  done_at: string | null;
  proof_url: string | null;
  created_at: string;
};

export function tareaRowToTarea(row: TareaRow): TareaPatrocinio {
  return {
    id: row.id,
    clubId: row.club_id,
    empresa: row.company_name,
    patrocinadorId: row.sponsor_id,
    accion: row.action,
    notas: row.notes,
    inicio: row.starts_on,
    fin: row.due_on,
    estado: (["pendiente", "hecho", "cancelado"] as const).includes(row.status as EstadoTarea)
      ? (row.status as EstadoTarea)
      : "pendiente",
    hechaEn: row.done_at,
    pruebaUrl: row.proof_url,
    creadaEn: row.created_at,
  };
}

/**
 * Lo que el club ve, que no es lo mismo que lo que hay guardado:
 * "caducada" no se guarda en ninguna parte, se deduce de la fecha.
 */
export type EstadoVisible = "hecha" | "cancelada" | "caducada" | "hoy" | "pronto" | "programada";

/** La fecha de hoy del propio navegador/servidor, como "AAAA-MM-DD". */
export function hoyISO(ahora: Date = new Date()): string {
  const dosCifras = (n: number) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${dosCifras(ahora.getMonth() + 1)}-${dosCifras(ahora.getDate())}`;
}

/** La misma fecha, `dias` días más adelante. */
export function sumarDias(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia + dias);
  return hoyISO(fecha);
}

export function estadoVisible(tarea: TareaPatrocinio, hoy: string = hoyISO()): EstadoVisible {
  if (tarea.estado === "hecho") return "hecha";
  if (tarea.estado === "cancelado") return "cancelada";
  if (tarea.fin < hoy) return "caducada";
  if (tarea.fin === hoy) return "hoy";
  // "Pronto" es la semana que viene: es el aviso que da tiempo a
  // reaccionar. Más allá de eso el club no necesita verlo cada día.
  if (tarea.fin <= sumarDias(hoy, 7)) return "pronto";
  return "programada";
}

export const ETIQUETA_ESTADO: Record<EstadoVisible, string> = {
  hecha: "Hecho",
  cancelada: "Cancelada",
  caducada: "Caducado",
  hoy: "Para hoy",
  pronto: "Esta semana",
  programada: "Pendiente",
};

/** Colores del semáforo. Rojo solo para lo que ya se ha pasado. */
export const CLASES_ESTADO: Record<EstadoVisible, string> = {
  hecha: "bg-teal-50 text-teal-700 border-teal-200",
  cancelada: "bg-zinc-100 text-zinc-500 border-zinc-200",
  caducada: "bg-red-50 text-red-700 border-red-200",
  hoy: "bg-amber-50 text-amber-800 border-amber-200",
  pronto: "bg-amber-50 text-amber-700 border-amber-200",
  programada: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

/**
 * Lo que el club tiene que hacer ya: lo vencido primero y luego lo de
 * hoy. Es lo que se enseña arriba del panel, así que si esto está
 * vacío el club puede irse tranquilo.
 */
export function tareasParaHoy(tareas: TareaPatrocinio[], hoy: string = hoyISO()): TareaPatrocinio[] {
  return tareas
    .filter((tarea) => {
      const estado = estadoVisible(tarea, hoy);
      return estado === "caducada" || estado === "hoy";
    })
    .sort((a, b) => a.fin.localeCompare(b.fin));
}

/** Cuántas hay vencidas, para el contador rojo de la navegación. */
export function contarCaducadas(tareas: TareaPatrocinio[], hoy: string = hoyISO()): number {
  return tareas.filter((tarea) => estadoVisible(tarea, hoy) === "caducada").length;
}

export type GrupoDeEmpresa = {
  empresa: string;
  tareas: TareaPatrocinio[];
  pendientes: number;
  caducadas: number;
};

/**
 * Las tareas agrupadas por empresa, que es como el club piensa en
 * esto ("¿qué le debo a la ferretería?"). Delante van las empresas con
 * algo vencido; dentro de cada una, lo más urgente arriba y lo ya hecho
 * al final.
 */
export function agruparPorEmpresa(
  tareas: TareaPatrocinio[],
  hoy: string = hoyISO(),
): GrupoDeEmpresa[] {
  const porEmpresa = new Map<string, TareaPatrocinio[]>();

  for (const tarea of tareas) {
    const clave = tarea.empresa.trim();
    const lista = porEmpresa.get(clave);
    if (lista) lista.push(tarea);
    else porEmpresa.set(clave, [tarea]);
  }

  const grupos = [...porEmpresa.entries()].map(([empresa, suyas]) => ({
    empresa,
    tareas: suyas.slice().sort((a, b) => {
      const aCerrada = a.estado !== "pendiente";
      const bCerrada = b.estado !== "pendiente";
      if (aCerrada !== bCerrada) return aCerrada ? 1 : -1;
      return a.fin.localeCompare(b.fin);
    }),
    pendientes: suyas.filter((tarea) => tarea.estado === "pendiente").length,
    caducadas: contarCaducadas(suyas, hoy),
  }));

  return grupos.sort((a, b) => {
    if (a.caducadas !== b.caducadas) return b.caducadas - a.caducadas;
    if (a.pendientes !== b.pendientes) return b.pendientes - a.pendientes;
    return a.empresa.localeCompare(b.empresa, "es");
  });
}

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

/** "4 sept 2026" a partir de "2026-09-04", sin pasar por UTC. */
export function fechaLegible(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return formatoFecha.format(new Date(anio, mes - 1, dia));
}

/** "vence hoy", "vence en 3 días", "vencía hace 5 días". */
export function cuantoFalta(fechaISO: string, hoy: string = hoyISO()): string {
  const aDias = (iso: string) => {
    const [anio, mes, dia] = iso.split("-").map(Number);
    return Math.round(new Date(anio, mes - 1, dia).getTime() / 86400000);
  };

  const diferencia = aDias(fechaISO) - aDias(hoy);

  if (diferencia === 0) return "vence hoy";
  if (diferencia === 1) return "vence mañana";
  if (diferencia === -1) return "vencía ayer";
  if (diferencia > 0) return `vence en ${diferencia} días`;
  return `vencía hace ${Math.abs(diferencia)} días`;
}

export type LineaNueva = {
  accion: string;
  inicio: string | null;
  fin: string;
  notas: string | null;
};

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida y limpia las líneas del formulario de alta, donde el club
 * apunta de una vez todo lo que le ha prometido a una empresa.
 *
 * El formulario manda un campo por línea con el mismo nombre, así que
 * las cuatro listas llegan en el orden de la página y sus índices se
 * corresponden. Funciona porque cada línea pinta siempre sus cuatro
 * campos, aunque estén vacíos.
 *
 * Las líneas del todo vacías se tiran sin decir nada: son las que el
 * club añadió y luego no llegó a rellenar. Una a medias, en cambio, sí
 * da error: ahí sí quería apuntar algo y hay que decírselo.
 */
export function prepararLineas(campos: {
  acciones: string[];
  inicios: string[];
  fines: string[];
  notas: string[];
}): { lineas: LineaNueva[] } | { error: string } {
  const lineas: LineaNueva[] = [];

  for (let indice = 0; indice < campos.acciones.length; indice += 1) {
    const accion = (campos.acciones[indice] ?? "").trim();
    const inicio = (campos.inicios[indice] ?? "").trim();
    const fin = (campos.fines[indice] ?? "").trim();
    const notas = (campos.notas[indice] ?? "").trim();

    if (!accion && !inicio && !fin && !notas) continue;

    if (!accion) return { error: "Te falta escribir qué hay que hacer en una de las líneas." };
    if (!ES_FECHA.test(fin)) return { error: `Pon la fecha límite de "${accion}".` };
    if (inicio && !ES_FECHA.test(inicio)) return { error: `La fecha de inicio de "${accion}" no vale.` };
    if (inicio && inicio > fin) {
      return { error: `En "${accion}", la fecha de inicio es posterior a la fecha límite.` };
    }

    lineas.push({
      accion: accion.slice(0, 200),
      inicio: inicio || null,
      fin,
      notas: notas ? notas.slice(0, 1000) : null,
    });
  }

  if (lineas.length === 0) return { error: "Escribe al menos una cosa que haya que hacer." };

  return { lineas };
}
