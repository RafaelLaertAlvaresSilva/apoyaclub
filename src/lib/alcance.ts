import {
  agruparPorTemporada,
  fechaLarga,
  type Partido,
} from "@/lib/publico-partidos";
import type { ClubProfile, ClubTeam, SocialLinks } from "@/lib/types";

/**
 * El alcance del club: a cuánta gente llega, dicho de forma que
 * aguante una pregunta.
 *
 * Este fichero existe por un motivo concreto. Un club tiene 120
 * jugadores, 150 familias, 800 seguidores en Instagram y 240 personas
 * en cada partido, y la tentación —la de cualquiera— es sumarlo y
 * escribir "llegamos a 1.310 personas". No es verdad, y además es
 * fácil de desmontar: el padre que está en el partido es una de esas
 * 150 familias y además sigue al club en Instagram. Se le ha contado
 * tres veces. La primera empresa que lo note deja de creerse también
 * lo que sí era cierto.
 *
 * Así que aquí no se suma nunca entre bloques, y cada cifra sale
 * marcada con de dónde viene:
 *
 *   - contado:   lo ha apuntado el club partido a partido.
 *   - declarado: lo ha escrito el club en su ficha.
 *   - deducido:  sale de una cuenta que se enseña entera.
 *
 * Y se distingue siempre entre personas y asistencias: 240 personas en
 * 18 partidos son 4.320 asistencias, no 4.320 personas.
 *
 * Lo consumen dos sitios —la página "Alcance" del panel y la sección
 * de audiencia del dossier— a propósito: si un día cambia la forma de
 * contar, cambia en los dos a la vez. Dos documentos del mismo club
 * que dicen cifras distintas hacen más daño que no tener ninguna.
 */

export const AVISO_DE_ORIGEN =
  "Cifras facilitadas por el club. ApoyaClub no las verifica.";

export type OrigenDeCifra = "contado" | "declarado" | "deducido";

/** Lo que se cuenta. Nunca se mezclan unidades distintas en una suma. */
export type UnidadDeCifra = "personas" | "asistencias" | "partidos" | "equipos";

export type CifraDeAlcance = {
  id: string;
  etiqueta: string;
  valor: number;
  unidad: UnidadDeCifra;
  origen: OrigenDeCifra;
  /** De dónde sale esta cifra, en una frase que se enseña debajo. */
  procedencia: string;
  /** La cuenta escrita, solo en las deducidas. */
  cuenta: string | null;
};

export type BloqueDeAlcance = {
  id: OrigenDeCifra;
  titulo: string;
  explicacion: string;
  cifras: CifraDeAlcance[];
};

/** Algo que el club no ha rellenado, y qué ganaría si lo rellenase. */
export type FaltaDeAlcance = {
  id: string;
  que: string;
  porQue: string;
  ruta: string;
  rutaEtiqueta: string;
};

export type ComparacionDeTemporadas = {
  temporadaActual: string;
  mediaActual: number;
  temporadaAnterior: string;
  mediaAnterior: number;
  /** Positiva si ha subido. */
  diferencia: number;
  /** Redondeado al entero. Positivo si ha subido. */
  porcentaje: number;
};

export type InformeDeAlcance = {
  /** La temporada de la que salen las cifras contadas. */
  temporada: string | null;
  bloques: BloqueDeAlcance[];
  faltan: FaltaDeAlcance[];
  /** La cifra que mejor resume al club, para titular. */
  titular: CifraDeAlcance | null;
  comparacion: ComparacionDeTemporadas | null;
  hayCifras: boolean;
};

export type DatosDeAlcance = {
  perfil: ClubProfile | null;
  equipos: ClubTeam[];
  partidos: Partido[];
};

export const ETIQUETA_RED_SOCIAL: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/** Hacen falta unos cuantos partidos antes de hablar de tendencia: con
 * dos, un derbi lluvioso ya parece una caída del 40 %. */
export const PARTIDOS_PARA_COMPARAR = 3;

function cifra(
  id: string,
  etiqueta: string,
  valor: number,
  unidad: UnidadDeCifra,
  origen: OrigenDeCifra,
  procedencia: string,
  cuenta: string | null = null,
): CifraDeAlcance {
  return { id, etiqueta, valor, unidad, origen, procedencia, cuenta };
}

/** Los jugadores del club: sumando los equipos de la ficha si los hay,
 * y si no, el número que el club escribió en la cantera. */
function jugadoresDelClub(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
): { valor: number; procedencia: string } | null {
  const conRecuento = equipos.filter((equipo) => (equipo.playerCount ?? 0) > 0);
  const sumados = conRecuento.reduce((suma, equipo) => suma + (equipo.playerCount ?? 0), 0);

  if (sumados > 0) {
    return {
      valor: sumados,
      procedencia:
        conRecuento.length === 1
          ? "jugadores del único equipo con recuento en la ficha"
          : `sumando los jugadores de ${conRecuento.length} equipos de la ficha`,
    };
  }

  if (perfil?.youthPlayersCount != null && perfil.youthPlayersCount > 0) {
    return { valor: perfil.youthPlayersCount, procedencia: "declarado por el club" };
  }

  return null;
}

function bloqueContado(partidos: Partido[]): {
  bloque: BloqueDeAlcance;
  temporada: string | null;
  mediaEnCasa: number | null;
  partidosEnCasa: number;
} {
  const temporadas = agruparPorTemporada(partidos);
  const ultima = temporadas[0];

  const bloque: BloqueDeAlcance = {
    id: "contado",
    titulo: "Lo que se ha contado",
    explicacion:
      "Público apuntado partido a partido. Es la única parte que no depende de que nadie se fíe de una cifra escrita a mano.",
    cifras: [],
  };

  if (!ultima) {
    return { bloque, temporada: null, mediaEnCasa: null, partidosEnCasa: 0 };
  }

  const enCasa = ultima.resumenEnCasa;
  const todos = ultima.resumen;
  const usaCasa = enCasa.partidos > 0;
  const media = usaCasa ? enCasa.media : todos.media;
  const cuantos = usaCasa ? enCasa.partidos : todos.partidos;

  if (media != null) {
    bloque.cifras.push(
      cifra(
        "publicoMedio",
        usaCasa ? "Público de media en casa" : "Público de media por partido",
        media,
        "personas",
        "contado",
        `media de ${cuantos} ${cuantos === 1 ? "partido apuntado" : "partidos apuntados"} de la temporada ${ultima.temporada}`,
      ),
    );
  }

  const mejor = (usaCasa ? enCasa.mejor : todos.mejor) ?? null;
  if (mejor) {
    bloque.cifras.push(
      cifra(
        "mejorPartido",
        "Su mejor partido",
        mejor.publico,
        "personas",
        "contado",
        `contra ${mejor.rival}, el ${fechaLarga(mejor.fecha)}`,
      ),
    );
  }

  if (todos.partidos > 0) {
    bloque.cifras.push(
      cifra(
        "partidosApuntados",
        "Partidos apuntados",
        todos.partidos,
        "partidos",
        "contado",
        `temporada ${ultima.temporada}${usaCasa ? `, ${enCasa.partidos} de ellos en casa` : ""}`,
      ),
    );
  }

  return {
    bloque,
    temporada: ultima.temporada,
    mediaEnCasa: usaCasa ? enCasa.media : null,
    partidosEnCasa: enCasa.partidos,
  };
}

function bloqueDeclarado(perfil: ClubProfile | null, equipos: ClubTeam[]): BloqueDeAlcance {
  const cifras: CifraDeAlcance[] = [];

  const jugadores = jugadoresDelClub(perfil, equipos);
  if (jugadores) {
    cifras.push(
      cifra("jugadores", "Jugadores", jugadores.valor, "personas", "declarado", jugadores.procedencia),
    );
  }

  if (perfil?.membersCount != null && perfil.membersCount > 0) {
    cifras.push(
      cifra("socios", "Socios", perfil.membersCount, "personas", "declarado", "declarado por el club"),
    );
  }

  if (perfil?.youthFamiliesCount != null && perfil.youthFamiliesCount > 0) {
    cifras.push(
      cifra(
        "familias",
        "Familias vinculadas",
        perfil.youthFamiliesCount,
        "personas",
        "declarado",
        "declarado por el club",
      ),
    );
  }

  if (equipos.length > 0) {
    cifras.push(
      cifra("equipos", "Equipos", equipos.length, "equipos", "declarado", "equipos dados de alta en la ficha"),
    );
  }

  // Una cifra por red, nunca la suma: quien sigue al club en Instagram
  // y en Facebook es la misma persona dos veces.
  for (const [red, seguidores] of Object.entries(perfil?.followersByNetwork ?? {}) as [
    keyof SocialLinks,
    number | undefined,
  ][]) {
    if (seguidores == null || seguidores <= 0) continue;
    cifras.push(
      cifra(
        `seguidores-${red}`,
        `Seguidores en ${ETIQUETA_RED_SOCIAL[red] ?? red}`,
        seguidores,
        "personas",
        "declarado",
        "declarado por el club",
      ),
    );
  }

  if (perfil?.estimatedReach != null && perfil.estimatedReach > 0) {
    cifras.push(
      cifra(
        "alcanceEscrito",
        "Alcance estimado",
        perfil.estimatedReach,
        "personas",
        "declarado",
        "estimación escrita por el club en su ficha",
      ),
    );
  }

  return {
    id: "declarado",
    titulo: "Lo que el club declara",
    explicacion:
      "Cifras de la ficha del club. Van una a una y sin sumar: la misma persona puede ser socio, padre de un jugador y seguidor en redes.",
    cifras,
  };
}

/**
 * La cifra que más se parece a un "alcance" sin mentir: cuánta gente
 * distinta hay como mínimo alrededor del club.
 *
 * Es el mayor de los grupos, no su suma. Si el club tiene 320 socios y
 * 150 familias, hay al menos 320 personas distintas —quizá más, porque
 * habrá familias que no sean socias— pero desde luego no 470.
 */
function personasDistintas(declarado: BloqueDeAlcance, mediaEnCasa: number | null): CifraDeAlcance | null {
  const candidatas = declarado.cifras.filter(
    (c) => c.unidad === "personas" && c.id !== "alcanceEscrito",
  );
  const conPublico = mediaEnCasa != null
    ? [...candidatas, cifra("publico", "público de un partido", mediaEnCasa, "personas", "contado", "")]
    : candidatas;

  if (conPublico.length === 0) return null;

  const mayor = conPublico.reduce((a, b) => (b.valor > a.valor ? b : a));

  return cifra(
    "personasDistintas",
    "Personas distintas, como mínimo",
    mayor.valor,
    "personas",
    "deducido",
    "el mayor de los grupos del club, no su suma",
    `la cifra más alta que tiene el club (${mayor.etiqueta.toLowerCase()}: ${mayor.valor}). No se suman los grupos porque la misma persona puede estar en varios.`,
  );
}

function bloqueDeducido(
  declarado: BloqueDeAlcance,
  mediaEnCasa: number | null,
  partidosEnCasa: number,
  temporada: string | null,
): BloqueDeAlcance {
  const cifras: CifraDeAlcance[] = [];

  const minimo = personasDistintas(declarado, mediaEnCasa);
  if (minimo) cifras.push(minimo);

  if (mediaEnCasa != null && partidosEnCasa > 0) {
    cifras.push(
      cifra(
        "asistencias",
        "Asistencias al campo en la temporada",
        mediaEnCasa * partidosEnCasa,
        "asistencias",
        "deducido",
        `temporada ${temporada ?? ""}`.trim(),
        `${mediaEnCasa} personas × ${partidosEnCasa} ${partidosEnCasa === 1 ? "partido" : "partidos"} en casa. Son veces que alguien fue al campo, no personas distintas: quien no falta a ninguno cuenta ${partidosEnCasa} ${partidosEnCasa === 1 ? "vez" : "veces"}.`,
      ),
    );
  }

  return {
    id: "deducido",
    titulo: "Lo que se deduce",
    explicacion:
      "Cuentas hechas con las cifras de arriba. La cuenta va escrita entera para que cualquiera pueda comprobarla.",
    cifras,
  };
}

function faltasDelClub(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  partidos: Partido[],
): FaltaDeAlcance[] {
  const faltan: FaltaDeAlcance[] = [];

  if (partidos.length === 0) {
    faltan.push({
      id: "publico",
      que: "El público de tus partidos",
      porQue:
        "Es la única cifra que no depende de que te crean: la apuntas partido a partido y se enseña con el recuento detrás. Es la que más peso tiene delante de una empresa.",
      ruta: "/panel/publico",
      rutaEtiqueta: "Apuntar un partido",
    });
  } else if (partidos.length < PARTIDOS_PARA_COMPARAR) {
    faltan.push({
      id: "masPartidos",
      que: "Más partidos apuntados",
      porQue: `Con ${partidos.length} ${partidos.length === 1 ? "partido" : "partidos"} la media aún se mueve mucho. A partir de ${PARTIDOS_PARA_COMPARAR} la cifra ya se sostiene, y con una temporada entera se puede comparar con la siguiente.`,
      ruta: "/panel/publico",
      rutaEtiqueta: "Apuntar un partido",
    });
  }

  if (jugadoresDelClub(perfil, equipos) == null) {
    faltan.push({
      id: "jugadores",
      que: "Cuántos jugadores tiene cada equipo",
      porQue:
        "Es lo primero que pregunta una empresa que se plantea poner su nombre en una camiseta: cuánta gente la va a llevar puesta.",
      ruta: "/panel",
      rutaEtiqueta: "Ir a los equipos",
    });
  }

  if (perfil?.membersCount == null) {
    faltan.push({
      id: "socios",
      que: "Cuántos socios tiene el club",
      porQue:
        "Es la cifra que mejor dice a cuánta gente del pueblo llega el club, porque incluye al vecino que paga su cuota sin tener a nadie jugando.",
      ruta: "/panel",
      rutaEtiqueta: "Ir a la ficha",
    });
  }

  if (perfil?.youthFamiliesCount == null) {
    faltan.push({
      id: "familias",
      que: "Cuántas familias hay detrás de la cantera",
      porQue:
        "Detrás de cada niño hay padres, abuelos y hermanos que van al campo y compran en el barrio. Para un comercio local es la cifra que decide.",
      ruta: "/panel",
      rutaEtiqueta: "Ir a la cantera",
    });
  }

  const seguidores = Object.values(perfil?.followersByNetwork ?? {}).filter(
    (valor) => valor != null && valor > 0,
  );
  if (seguidores.length === 0) {
    faltan.push({
      id: "redes",
      que: "Los seguidores de tus redes",
      porQue:
        "Una publicación agradeciendo al patrocinador es lo más barato que puede dar un club, y sin esta cifra no se puede poner precio a nada.",
      ruta: "/panel",
      rutaEtiqueta: "Ir a audiencia",
    });
  }

  return faltan;
}

function compararTemporadas(partidos: Partido[]): ComparacionDeTemporadas | null {
  const temporadas = agruparPorTemporada(partidos);
  if (temporadas.length < 2) return null;

  const [actual, anterior] = temporadas;

  const mediaDe = (t: (typeof temporadas)[number]) =>
    t.resumenEnCasa.partidos >= PARTIDOS_PARA_COMPARAR
      ? t.resumenEnCasa.media
      : t.resumen.partidos >= PARTIDOS_PARA_COMPARAR
        ? t.resumen.media
        : null;

  const mediaActual = mediaDe(actual);
  const mediaAnterior = mediaDe(anterior);
  if (mediaActual == null || mediaAnterior == null || mediaAnterior === 0) return null;

  return {
    temporadaActual: actual.temporada,
    mediaActual,
    temporadaAnterior: anterior.temporada,
    mediaAnterior,
    diferencia: mediaActual - mediaAnterior,
    porcentaje: Math.round(((mediaActual - mediaAnterior) / mediaAnterior) * 100),
  };
}

export function calcularAlcance({ perfil, equipos, partidos }: DatosDeAlcance): InformeDeAlcance {
  const contado = bloqueContado(partidos);
  const declarado = bloqueDeclarado(perfil, equipos);
  const deducido = bloqueDeducido(
    declarado,
    contado.mediaEnCasa,
    contado.partidosEnCasa,
    contado.temporada,
  );

  const bloques = [contado.bloque, declarado, deducido].filter((bloque) => bloque.cifras.length > 0);

  // Para titular se prefiere siempre lo contado: una media que sale de
  // un recuento convence más que cualquier cifra declarada, aunque sea
  // más pequeña.
  const titular =
    contado.bloque.cifras.find((c) => c.id === "publicoMedio") ??
    deducido.cifras.find((c) => c.id === "personasDistintas") ??
    declarado.cifras[0] ??
    null;

  return {
    temporada: contado.temporada,
    bloques,
    faltan: faltasDelClub(perfil, equipos, partidos),
    titular,
    comparacion: compararTemporadas(partidos),
    hayCifras: bloques.length > 0,
  };
}

/** Las cifras del informe en una lista plana, para las maquetas que no
 * separan por bloques (la portada del dossier). */
export function cifrasDelInforme(informe: InformeDeAlcance): CifraDeAlcance[] {
  return informe.bloques.flatMap((bloque) => bloque.cifras);
}

/**
 * Las cuatro cifras de la portada del dossier: lo que una empresa
 * necesita para decidir en medio minuto si esto le interesa.
 *
 * El orden lo manda lo que convence, no lo que hay: primero el público
 * contado, luego la gente del club, y las redes al final —y solo la red
 * mayor, nunca la suma de todas.
 */
export function cifrasDePortada(informe: InformeDeAlcance, cuantas = 4): CifraDeAlcance[] {
  const todas = cifrasDelInforme(informe);
  const porId = (id: string) => todas.find((c) => c.id === id) ?? null;

  const mayorRed = todas
    .filter((c) => c.id.startsWith("seguidores-"))
    .reduce<CifraDeAlcance | null>((mayor, c) => (mayor == null || c.valor > mayor.valor ? c : mayor), null);

  return [
    porId("publicoMedio"),
    porId("jugadores"),
    porId("familias"),
    porId("socios"),
    mayorRed,
    porId("equipos"),
  ]
    .filter((c): c is CifraDeAlcance => c !== null)
    .slice(0, cuantas);
}

/** "personas" / "asistencias" / "partidos" / "equipos", en singular
 * cuando toca. Se enseña pegado a la cifra para que nadie confunda
 * personas con veces. */
export function unidadEnTexto(unidad: UnidadDeCifra, valor: number): string {
  const singular = Math.abs(valor) === 1;
  switch (unidad) {
    case "personas":
      return singular ? "persona" : "personas";
    case "asistencias":
      return singular ? "asistencia" : "asistencias";
    case "partidos":
      return singular ? "partido" : "partidos";
    case "equipos":
      return singular ? "equipo" : "equipos";
  }
}
