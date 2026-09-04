import { hoyISO, type TareaPatrocinio } from "@/lib/tareas-patrocinio";

/**
 * Cuándo conviene que el club le mande el informe de progreso a un
 * patrocinador, y a cuáles les falta.
 *
 * Hay dos motivos distintos para avisar, y hacen falta los dos:
 *
 *  1. LA COLABORACIÓN HA TERMINADO. No todo patrocinio dura una
 *     temporada: hay quien colabora en un torneo de un fin de semana o
 *     en una campaña de un mes. A esa empresa hay que mandarle el
 *     informe cuando se acaba lo suyo, no en diciembre porque toque.
 *     Y cuanto antes: recién terminado el torneo el empresario todavía
 *     lo tiene fresco, y ese es el momento de enseñarle lo que salió.
 *
 *  2. LA TEMPORADA VA POR LA MITAD, O SE ACABA. Para el patrocinio
 *     largo, el que dura de septiembre a junio. A mitad todavía da
 *     tiempo a corregir lo que falte —si en enero ves dos cosas en rojo
 *     te quedan cinco meses, en junio te queda una excusa— y al final es
 *     cuando la empresa decide si renueva, y conviene que lo decida
 *     mirando lo que recibió y no lo que recuerda.
 *
 * El primero manda sobre el segundo: una empresa con la colaboración
 * cerrada no vuelve a salir en el aviso de temporada.
 */

export type Ventana = {
  tipo: "mitad" | "final";
  /** Desde cuándo cuenta esta ventana, en ISO. Un informe descargado
   *  antes de esta fecha es de la vuelta anterior y no vale. */
  desde: string;
  titulo: string;
  porQue: string;
};

/**
 * La temporada española de deporte base va de septiembre a junio, así
 * que la ventana de media temporada se cruza de año: diciembre y enero
 * son la misma mitad de la misma temporada.
 */
export function ventanaDeInforme(hoy: string = hoyISO()): Ventana | null {
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));

  if (mes === 12 || mes === 1) {
    return {
      desde: `${mes === 1 ? anio - 1 : anio}-12-01`,
      tipo: "mitad",
      titulo: "Estás a mitad de temporada: buen momento para mandar el informe de progreso",
      porQue:
        "Ahora todavía da tiempo a corregir lo que falte. Si esperas a junio, lo que no esté hecho ya no se arregla — solo se cuenta.",
    };
  }

  if (mes === 5 || mes === 6) {
    return {
      desde: `${anio}-05-01`,
      tipo: "final",
      titulo: "Se acaba la temporada: manda el informe antes de hablar de renovar",
      porQue:
        "Es cuando la empresa decide si sigue. Conviene que lo decida mirando lo que recibió, no lo que recuerda.",
    };
  }

  return null;
}

export type EmpresaParaInformar = {
  empresa: string;
  /** Cuándo se descargó su informe por última vez. Null si nunca. */
  ultimoInforme: string | null;
  /** Solo en las terminadas: el día en que se cerró lo último. */
  terminadaEl?: string;
};

/** El nombre de la empresa como clave: es texto libre y llega como sea. */
function clave(empresa: string): string {
  return empresa.trim().toLowerCase();
}

function tareasPorEmpresa(tareas: TareaPatrocinio[]): Map<string, TareaPatrocinio[]> {
  const porEmpresa = new Map<string, TareaPatrocinio[]>();

  for (const tarea of tareas) {
    const nombre = tarea.empresa.trim();
    if (!nombre) continue;
    const lista = porEmpresa.get(nombre);
    if (lista) lista.push(tarea);
    else porEmpresa.set(nombre, [tarea]);
  }

  return porEmpresa;
}

/**
 * Empresas cuya colaboración está cerrada y todavía no tienen informe
 * de después de cerrarla.
 *
 * "Cerrada" quiere decir que no le queda ninguna tarea pendiente. Si
 * queda alguna —aunque se le haya pasado la fecha— no se avisa: ahí lo
 * que toca es hacerla o cancelarla, y eso ya sale en rojo en su sitio.
 * Empujar a mandar un informe con deberes a medias sería empujar al
 * club a quedar mal.
 *
 * Y hace falta al menos una cumplida: si todo se canceló no hay nada
 * que contarle a nadie.
 */
export function colaboracionesTerminadas(
  tareas: TareaPatrocinio[],
  ultimoInformePorEmpresa: Map<string, string>,
): EmpresaParaInformar[] {
  const terminadas: EmpresaParaInformar[] = [];

  for (const [empresa, suyas] of tareasPorEmpresa(tareas)) {
    if (suyas.some((tarea) => tarea.estado === "pendiente")) continue;

    const cumplidas = suyas.filter((tarea) => tarea.estado === "hecho" && tarea.hechaEn);
    if (cumplidas.length === 0) continue;

    // El día en que se marcó lo último. Se usa la fecha de cuando se
    // hizo y no la fecha límite: una valla contratada hasta junio que
    // ya está puesta y marcada se terminó el día que se marcó.
    const terminadaEl = cumplidas
      .map((tarea) => (tarea.hechaEn ?? "").slice(0, 10))
      .sort()
      .at(-1) as string;

    const ultimoInforme = ultimoInformePorEmpresa.get(clave(empresa)) ?? null;
    if (ultimoInforme && ultimoInforme.slice(0, 10) >= terminadaEl) continue;

    terminadas.push({ empresa, ultimoInforme, terminadaEl });
  }

  return terminadas.sort((a, b) => (b.terminadaEl ?? "").localeCompare(a.terminadaEl ?? ""));
}

/**
 * Empresas a las que les falta el informe de la ventana de temporada.
 *
 * Las que ya lo tienen desaparecen de la lista: un aviso que sigue ahí
 * después de hacerle caso enseña a ignorarlo. Y las que salen ya en
 * "colaboración terminada" tampoco, para no pedir dos veces lo mismo.
 */
export function empresasPendientesDeInforme(
  tareas: TareaPatrocinio[],
  ultimoInformePorEmpresa: Map<string, string>,
  ventana: Ventana,
  yaAvisadas: EmpresaParaInformar[] = [],
): EmpresaParaInformar[] {
  const excluidas = new Set(yaAvisadas.map((empresa) => clave(empresa.empresa)));

  return [...tareasPorEmpresa(tareas).keys()]
    .filter((empresa) => !excluidas.has(clave(empresa)))
    .map((empresa) => ({
      empresa,
      ultimoInforme: ultimoInformePorEmpresa.get(clave(empresa)) ?? null,
    }))
    .filter(({ ultimoInforme }) => !ultimoInforme || ultimoInforme.slice(0, 10) < ventana.desde)
    .sort((a, b) => a.empresa.localeCompare(b.empresa, "es"));
}

const formatoMes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const formatoDia = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" });

function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

/** "todavía no le has descargado ninguno" o "el último fue en octubre de 2026". */
export function cuandoFueElUltimo(ultimoInforme: string | null): string {
  if (!ultimoInforme) return "todavía no le has descargado ninguno";
  return `el último fue en ${formatoMes.format(aFecha(ultimoInforme))}`;
}

/** "terminado el 14 de octubre". */
export function cuandoTermino(terminadaEl: string): string {
  return `terminado el ${formatoDia.format(aFecha(terminadaEl))}`;
}
