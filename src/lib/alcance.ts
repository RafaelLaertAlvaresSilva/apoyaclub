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

/**
 * Los textos del informe (títulos, procedencias, cuentas) salen de
 * `panel.alcance.informe` en el idioma de quien lo mira. Esta es la
 * función de traducir ya hecha: la de `getTranslations` en el panel, o
 * `createTranslator` donde no hay petición (el dossier).
 *
 * El aviso de origen ("Cifras facilitadas por el club…") es
 * `t("avisoDeOrigen")`.
 */
export type TraducirAlcance = (clave: string, valores?: Record<string, string | number>) => string;

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
  t: TraducirAlcance,
): { valor: number; procedencia: string } | null {
  const conRecuento = equipos.filter((equipo) => (equipo.playerCount ?? 0) > 0);
  const sumados = conRecuento.reduce((suma, equipo) => suma + (equipo.playerCount ?? 0), 0);

  if (sumados > 0) {
    return {
      valor: sumados,
      procedencia:
        conRecuento.length === 1
          ? t("procedencia.unEquipo")
          : t("procedencia.variosEquipos", { n: conRecuento.length }),
    };
  }

  if (perfil?.youthPlayersCount != null && perfil.youthPlayersCount > 0) {
    return { valor: perfil.youthPlayersCount, procedencia: t("procedencia.declarado") };
  }

  return null;
}

function bloqueContado(
  partidos: Partido[],
  t: TraducirAlcance,
  intlLocale: string,
): {
  bloque: BloqueDeAlcance;
  temporada: string | null;
  mediaEnCasa: number | null;
  partidosEnCasa: number;
} {
  const temporadas = agruparPorTemporada(partidos);
  const ultima = temporadas[0];

  const bloque: BloqueDeAlcance = {
    id: "contado",
    titulo: t("bloques.contado.titulo"),
    explicacion: t("bloques.contado.explicacion"),
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
        usaCasa ? t("cifras.publicoMedioEnCasa") : t("cifras.publicoMedio"),
        media,
        "personas",
        "contado",
        t("procedencia.mediaDe", { n: cuantos, temporada: ultima.temporada }),
      ),
    );
  }

  const mejor = (usaCasa ? enCasa.mejor : todos.mejor) ?? null;
  if (mejor) {
    bloque.cifras.push(
      cifra(
        "mejorPartido",
        t("cifras.mejorPartido"),
        mejor.publico,
        "personas",
        "contado",
        t("procedencia.contra", { rival: mejor.rival, fecha: fechaLarga(mejor.fecha, intlLocale) }),
      ),
    );
  }

  if (todos.partidos > 0) {
    bloque.cifras.push(
      cifra(
        "partidosApuntados",
        t("cifras.partidosApuntados"),
        todos.partidos,
        "partidos",
        "contado",
        usaCasa
          ? t("procedencia.temporadaEnCasa", { temporada: ultima.temporada, n: enCasa.partidos })
          : t("procedencia.temporada", { temporada: ultima.temporada }),
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

function bloqueDeclarado(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  t: TraducirAlcance,
): BloqueDeAlcance {
  const cifras: CifraDeAlcance[] = [];
  const declaradoPorElClub = t("procedencia.declarado");

  const jugadores = jugadoresDelClub(perfil, equipos, t);
  if (jugadores) {
    cifras.push(
      cifra("jugadores", t("cifras.jugadores"), jugadores.valor, "personas", "declarado", jugadores.procedencia),
    );
  }

  if (perfil?.membersCount != null && perfil.membersCount > 0) {
    cifras.push(
      cifra("socios", t("cifras.socios"), perfil.membersCount, "personas", "declarado", declaradoPorElClub),
    );
  }

  if (perfil?.youthFamiliesCount != null && perfil.youthFamiliesCount > 0) {
    cifras.push(
      cifra(
        "familias",
        t("cifras.familias"),
        perfil.youthFamiliesCount,
        "personas",
        "declarado",
        declaradoPorElClub,
      ),
    );
  }

  if (equipos.length > 0) {
    cifras.push(
      cifra("equipos", t("cifras.equipos"), equipos.length, "equipos", "declarado", t("procedencia.equipos")),
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
        t("cifras.seguidores", { red: ETIQUETA_RED_SOCIAL[red] ?? red }),
        seguidores,
        "personas",
        "declarado",
        declaradoPorElClub,
      ),
    );
  }

  if (perfil?.estimatedReach != null && perfil.estimatedReach > 0) {
    cifras.push(
      cifra(
        "alcanceEscrito",
        t("cifras.alcanceEscrito"),
        perfil.estimatedReach,
        "personas",
        "declarado",
        t("procedencia.estimacion"),
      ),
    );
  }

  return {
    id: "declarado",
    titulo: t("bloques.declarado.titulo"),
    explicacion: t("bloques.declarado.explicacion"),
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
 *
 * Y los seguidores de redes se quedan fuera, aunque sean el grupo más
 * grande. Un club de barrio con 12.000 seguidores en Instagram no tiene
 * 12.000 personas alrededor: tiene cuentas, muchas de fuera del pueblo,
 * algunas que ni existen. Ponerlas aquí convertía esta cifra —la única
 * que se presenta como "gente de verdad del club"— en la más inflada de
 * todo el dossier, y es justo la que una empresa va a mirar con lupa.
 * Los seguidores siguen en su tarjeta, con su nombre y sin disfraz.
 */
function personasDistintas(
  declarado: BloqueDeAlcance,
  mediaEnCasa: number | null,
  t: TraducirAlcance,
): CifraDeAlcance | null {
  const candidatas = declarado.cifras.filter(
    (c) => c.unidad === "personas" && c.id !== "alcanceEscrito" && !c.id.startsWith("seguidores-"),
  );
  const conPublico = mediaEnCasa != null
    ? [...candidatas, cifra("publico", t("cifras.publicoDeUnPartido"), mediaEnCasa, "personas", "contado", "")]
    : candidatas;

  if (conPublico.length === 0) return null;

  const mayor = conPublico.reduce((a, b) => (b.valor > a.valor ? b : a));

  return cifra(
    "personasDistintas",
    t("cifras.personasDistintas"),
    mayor.valor,
    "personas",
    "deducido",
    t("procedencia.mayorGrupo"),
    t("cuentas.personasDistintas", { grupo: mayor.etiqueta.toLocaleLowerCase(), valor: mayor.valor }),
  );
}

function bloqueDeducido(
  declarado: BloqueDeAlcance,
  mediaEnCasa: number | null,
  partidosEnCasa: number,
  temporada: string | null,
  t: TraducirAlcance,
): BloqueDeAlcance {
  const cifras: CifraDeAlcance[] = [];

  const minimo = personasDistintas(declarado, mediaEnCasa, t);
  if (minimo) cifras.push(minimo);

  if (mediaEnCasa != null && partidosEnCasa > 0) {
    cifras.push(
      cifra(
        "asistencias",
        t("cifras.asistencias"),
        mediaEnCasa * partidosEnCasa,
        "asistencias",
        "deducido",
        temporada ? t("procedencia.temporada", { temporada }) : "",
        t("cuentas.asistencias", { media: mediaEnCasa, n: partidosEnCasa }),
      ),
    );
  }

  return {
    id: "deducido",
    titulo: t("bloques.deducido.titulo"),
    explicacion: t("bloques.deducido.explicacion"),
    cifras,
  };
}

function faltasDelClub(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  partidos: Partido[],
  t: TraducirAlcance,
): FaltaDeAlcance[] {
  const faltan: FaltaDeAlcance[] = [];
  // Lo que se le dice al club en cada caso, con el texto del enlace.
  const falta = (id: string, ruta: string, valores?: Record<string, string | number>): FaltaDeAlcance => ({
    id,
    que: t(`faltan.${id}.que`, valores),
    porQue: t(`faltan.${id}.porQue`, valores),
    ruta,
    rutaEtiqueta: t(`faltan.${id}.enlace`, valores),
  });

  if (partidos.length === 0) {
    faltan.push(falta("publico", "/panel/publico"));
  } else if (partidos.length < PARTIDOS_PARA_COMPARAR) {
    faltan.push(falta("masPartidos", "/panel/publico", { n: partidos.length, minimo: PARTIDOS_PARA_COMPARAR }));
  }

  if (jugadoresDelClub(perfil, equipos, t) == null) {
    faltan.push(falta("jugadores", "/panel"));
  }

  if (perfil?.membersCount == null) {
    faltan.push(falta("socios", "/panel"));
  }

  if (perfil?.youthFamiliesCount == null) {
    faltan.push(falta("familias", "/panel"));
  }

  const seguidores = Object.values(perfil?.followersByNetwork ?? {}).filter(
    (valor) => valor != null && valor > 0,
  );
  if (seguidores.length === 0) {
    faltan.push(falta("redes", "/panel"));
  }

  return faltan;
}

function compararTemporadas(partidos: Partido[]): ComparacionDeTemporadas | null {
  const temporadas = agruparPorTemporada(partidos);
  if (temporadas.length < 2) return null;

  const [actual, anterior] = temporadas;

  // El mismo criterio en las dos temporadas, o no se comparan.
  //
  // Antes cada una elegía por su cuenta entre "solo en casa" y "todos
  // los partidos" según cuántos tuviera apuntados, así que podía salir
  // la media en casa de este año contra la de casa y fuera del pasado.
  // Eso no es una comparación: es un porcentaje inventado, y encima con
  // pinta de dato.
  const enCasa = (t: (typeof temporadas)[number]) =>
    t.resumenEnCasa.partidos >= PARTIDOS_PARA_COMPARAR ? t.resumenEnCasa.media : null;
  const todos = (t: (typeof temporadas)[number]) =>
    t.resumen.partidos >= PARTIDOS_PARA_COMPARAR ? t.resumen.media : null;

  const soloEnCasa = enCasa(actual) != null && enCasa(anterior) != null;
  const mediaDe = soloEnCasa ? enCasa : todos;

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

export function calcularAlcance(
  { perfil, equipos, partidos }: DatosDeAlcance,
  t: TraducirAlcance,
  intlLocale = "es-ES",
): InformeDeAlcance {
  const contado = bloqueContado(partidos, t, intlLocale);
  const declarado = bloqueDeclarado(perfil, equipos, t);
  const deducido = bloqueDeducido(
    declarado,
    contado.mediaEnCasa,
    contado.partidosEnCasa,
    contado.temporada,
    t,
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
    faltan: faltasDelClub(perfil, equipos, partidos, t),
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

/**
 * Una cifra escrita para que se lea de un vistazo.
 *
 * Hasta diez mil se dice entera: 240 es 240, y redondear una media
 * contada partido a partido a "unas 200" tira a la basura justo lo que
 * la hace creíble. A partir de ahí el dígito exacto no lo retiene
 * nadie —12.437 se lee como "doce mil y pico"— así que se redondea al
 * millar y se dice así.
 */
export function cifraLlana(valor: number, intlLocale = "es-ES"): string {
  if (valor < 10000) return valor.toLocaleString(intlLocale);

  // Se redondea el número y se formatea después, en vez de pegarle
  // ".000" al millar: con "48" pegar el sufijo daba "48.000", que está
  // bien, pero con "1234" daba "1234.000" en vez de "1.234.000".
  return (Math.round(valor / 1000) * 1000).toLocaleString(intlLocale);
}

/**
 * La audiencia del club en dos o tres frases que entiende cualquiera.
 *
 * El informe de arriba está bien hecho y por eso es difícil: separa lo
 * contado de lo declarado y de lo deducido, no suma grupos que se
 * solapan y enseña cada cuenta entera. Todo eso es lo que hace que una
 * empresa se lo crea... si se lo lee.
 *
 * Y quien abre el dossier no suele ser un director de marketing: es el
 * dueño de la ferretería de la esquina, que mira una página y decide.
 * Ocho tarjetas con su procedencia debajo no se leen, se hojean.
 *
 * Así que esto va delante y dice lo mismo en cristiano. No sustituye a
 * las cifras: las resume. Quien quiera comprobarlas las tiene justo
 * debajo, con el recuento detrás de cada una.
 *
 * Las frases hablan de lo que la empresa gana, no de lo que el club
 * tiene: "cada partido en casa lo ven 240 personas" dice más que
 * "público medio: 240".
 */
export function resumenLlano(
  informe: InformeDeAlcance,
  t: TraducirAlcance,
  intlLocale = "es-ES",
): string[] {
  const todas = cifrasDelInforme(informe);
  const porId = (id: string) => todas.find((c) => c.id === id) ?? null;
  const llana = (valor: number) => cifraLlana(valor, intlLocale);
  const frases: string[] = [];

  const publico = porId("publicoMedio");
  if (publico) {
    // "unas" y no la cifra a secas: es una media, y decirla como si
    // fuera un recuento exacto de este domingo sería pasarse.
    const enCasa = publico.etiqueta === t("cifras.publicoMedioEnCasa");
    frases.push(t(enCasa ? "llano.publicoEnCasa" : "llano.publico", { cifra: llana(publico.valor) }));
  }

  const jugadores = porId("jugadores");
  if (jugadores) {
    frases.push(t("llano.jugadores", { cifra: llana(jugadores.valor) }));
  }

  const familias = porId("familias");
  if (familias) {
    frases.push(t("llano.familias", { cifra: llana(familias.valor) }));
  } else {
    const socios = porId("socios");
    if (socios) {
      frases.push(t("llano.socios", { cifra: llana(socios.valor) }));
    }
  }

  // Solo la red mayor. Sumar Instagram y Facebook sería contar dos
  // veces a la misma persona, que es lo que este fichero entero evita.
  const mayorRed = todas
    .filter((c) => c.id.startsWith("seguidores-"))
    .reduce<CifraDeAlcance | null>(
      (mayor, c) => (mayor == null || c.valor > mayor.valor ? c : mayor),
      null,
    );
  if (mayorRed) {
    const id = mayorRed.id.replace("seguidores-", "") as keyof SocialLinks;
    frases.push(
      t("llano.redes", { red: ETIQUETA_RED_SOCIAL[id] ?? id, cifra: llana(mayorRed.valor) }),
    );
  }

  // Cuatro como mucho. La quinta frase ya no se lee, y este bloque
  // existe justo para lo contrario.
  return frases.slice(0, 4);
}

/** "personas" / "asistencias" / "partidos" / "equipos", en singular
 * cuando toca. Se enseña pegado a la cifra para que nadie confunda
 * personas con veces. */
export function unidadEnTexto(unidad: UnidadDeCifra, valor: number, t: TraducirAlcance): string {
  return t(`unidades.${unidad}`, { n: Math.abs(valor) });
}
