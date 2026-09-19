/**
 * Los correos que el club le escribe a una empresa.
 *
 * La plataforma los ESCRIBE, no los envía. El club copia el texto o lo
 * abre en su propio correo y le da a enviar desde su dirección. Tres
 * motivos, y los tres pesan:
 *
 *   · Si ApoyaClub mandara correos en frío por treinta clubes, las
 *     quejas de spam caerían sobre su dominio, y lo primero que deja de
 *     llegar cuando eso pasa son los correos que no pueden fallar:
 *     confirmar el registro, recuperar la contraseña, avisar de una
 *     solicitud. Un club que no puede entrar en su cuenta es una baja.
 *
 *   · La respuesta tiene que caer en la bandeja del club, que es donde
 *     mira. Si manda la plataforma, la conversación empieza en el sitio
 *     equivocado.
 *
 *   · El club es quien vende. La plataforma pone las herramientas.
 *
 * Y una regla que manda sobre todas las demás: aquí no se inventa un
 * dato ni se deja un hueco. Si el club no ha apuntado cuánta gente va a
 * sus partidos, la frase entera desaparece y se le dice dónde
 * rellenarlo. "Contamos con jugadores" es peor que no mandar nada.
 */

export type PlantillaId =
  | "conocida"
  | "fria"
  | "servicio"
  | "insistir"
  | "responder"
  | "renovar"
  | "cierre";

export const PLANTILLAS: {
  id: PlantillaId;
  etiqueta: string;
  cuando: string;
}[] = [
  {
    id: "conocida",
    etiqueta: "Una empresa que ya os conoce",
    cuando: "El padre de un jugador, el bar de enfrente, un antiguo socio.",
  },
  {
    id: "fria",
    etiqueta: "Una empresa que no os conoce",
    cuando: "Un comercio del barrio con el que no tenéis trato todavía.",
  },
  {
    id: "servicio",
    etiqueta: "Pedir un servicio, no dinero",
    cuando: "El fisio, la furgoneta, la imprenta, las comidas.",
  },
  {
    id: "insistir",
    etiqueta: "Volver a intentarlo",
    cuando: "Escribisteis y no han contestado. A los siete o diez días.",
  },
  {
    id: "responder",
    etiqueta: "Contestar a quien ha preguntado",
    cuando: "Os han escrito. Es el correo que más se juega y el que peor sale.",
  },
  {
    id: "renovar",
    etiqueta: "Renovar con quien ya os apoya",
    cuando: "Antes de que acabe la temporada, no después.",
  },
  {
    id: "cierre",
    etiqueta: "Cuando os dicen que no",
    cuando: "Dejar la puerta abierta para el año que viene.",
  },
];

export const ETIQUETA_PLANTILLA: Record<PlantillaId, string> = PLANTILLAS.reduce(
  (acumulado, plantilla) => ({ ...acumulado, [plantilla.id]: plantilla.etiqueta }),
  {} as Record<PlantillaId, string>,
);

export function esPlantillaValida(valor: string): valor is PlantillaId {
  return PLANTILLAS.some((plantilla) => plantilla.id === valor);
}

export type DatosDelClub = {
  nombre: string;
  localidad: string | null;
  /** "balonmano", "fútbol sala"… Sale de sus equipos. */
  deporte: string | null;
  jugadores: number | null;
  familias: number | null;
  socios: number | null;
  /** Media de público en los partidos en casa. */
  publicoMedio: number | null;
  urlFicha: string;
  /** El dossier compartible, si lo tiene encendido. */
  urlDossier: string | null;
  /** Quién firma. Si no hay, se deja el hueco a la vista para que lo ponga. */
  firmante: string | null;
};

export type DatosDeLaEmpresa = {
  nombre: string;
  contactoNombre: string | null;
  /** Lo que el club apuntó sobre qué necesita o qué le ofrecería. */
  detalle: string | null;
};

/** Algo que habría mejorado el correo y que al club le falta por rellenar. */
export type Hueco = { que: string; donde: string };

export type CorreoGenerado = {
  /** Varios, porque el asunto decide si se abre. */
  asuntos: string[];
  cuerpo: string;
  faltan: Hueco[];
};

const formatoNumero = new Intl.NumberFormat("es-ES");

/**
 * Las cifras del club en una frase, con lo que tenga.
 *
 * Devuelve null si no tiene ninguna: entonces la frase entera se cae,
 * en vez de quedarse coja.
 */
export function cifrasEnTexto(club: DatosDelClub): string | null {
  const partes: string[] = [];

  if (club.jugadores) partes.push(`${formatoNumero.format(club.jugadores)} jugadores`);
  if (club.familias) partes.push(`${formatoNumero.format(club.familias)} familias`);
  if (club.socios) partes.push(`${formatoNumero.format(club.socios)} socios`);
  if (club.publicoMedio) {
    partes.push(`una media de ${formatoNumero.format(club.publicoMedio)} personas en cada partido en casa`);
  }

  if (partes.length === 0) return null;
  if (partes.length === 1) return partes[0];

  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/** Qué le falta al club para que estos correos convenzan. */
export function huecosDelClub(club: DatosDelClub): Hueco[] {
  const huecos: Hueco[] = [];

  if (!cifrasEnTexto(club)) {
    huecos.push({
      que: "Cuánta gente sois: jugadores, familias, socios o público en los partidos",
      donde: "/panel#audiencia",
    });
  }

  if (!club.urlDossier) {
    huecos.push({
      que: "El enlace a tu dossier, para que la empresa vea de un vistazo qué ofreces",
      donde: "/panel/dossier",
    });
  }

  if (!club.firmante) {
    huecos.push({ que: "Quién firma el correo", donde: "/panel#identidad" });
  }

  return huecos;
}

/** El saludo, con el nombre de la persona si se sabe. */
function saludo(empresa: DatosDeLaEmpresa): string {
  return empresa.contactoNombre ? `Hola ${empresa.contactoNombre},` : "Hola,";
}

/** Quién somos, en una línea. */
function presentacion(club: DatosDelClub): string {
  const deporte = club.deporte ? `club de ${club.deporte}` : "club";
  const donde = club.localidad ? ` de ${club.localidad}` : "";
  return `Te escribo del ${club.nombre}, ${deporte}${donde}.`;
}

/** El enlace que se le pasa a la empresa: el dossier si lo hay, y si no
 * la ficha pública, que siempre existe. */
function enlace(club: DatosDelClub): string {
  return club.urlDossier
    ? `Aquí tienes quiénes somos y qué ofrecemos, en dos minutos: ${club.urlDossier}`
    : `Aquí tienes nuestra página, por si quieres echarle un ojo: ${club.urlFicha}`;
}

function firma(club: DatosDelClub): string {
  return `${club.firmante ?? "[tu nombre]"}\n${club.nombre}`;
}

/** Junta los trozos que no están vacíos, separados por una línea. */
function parrafos(...trozos: (string | null)[]): string {
  return trozos.filter((trozo): trozo is string => !!trozo).join("\n\n");
}

export function construirCorreo(
  plantilla: PlantillaId,
  club: DatosDelClub,
  empresa: DatosDeLaEmpresa,
): CorreoGenerado {
  const cifras = cifrasEnTexto(club);
  const laFraseDeLasCifras = cifras
    ? `Este año somos ${cifras}. Todo eso es gente de aquí que ve nuestras camisetas y nuestras redes cada fin de semana.`
    : null;

  const detalle = empresa.detalle?.trim() || null;

  switch (plantilla) {
    case "conocida":
      return {
        asuntos: [
          `Una idea para ${empresa.nombre} y el ${club.nombre}`,
          `¿Te cuento algo del ${club.nombre}?`,
          `${club.nombre}: te queríamos proponer una cosa`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          presentacion(club),
          detalle ? `${detalle}` : null,
          laFraseDeLasCifras,
          "Estamos buscando empresas de aquí que quieran salir con nosotros esta temporada. No tiene que ser mucho: hay desde cosas pequeñas hasta el patrocinio principal, y también nos sirve en especie.",
          enlace(club),
          "¿Te va bien que te llame esta semana y lo vemos en cinco minutos?",
          `Un saludo,\n${firma(club)}`,
        ),
        faltan: huecosDelClub(club),
      };

    case "fria":
      return {
        asuntos: [
          `${club.nombre}: ¿os interesa salir en nuestras camisetas?`,
          `Un club de ${club.localidad ?? "aquí"} quiere trabajar con vosotros`,
          `Patrocinio local, sin compromiso`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          presentacion(club),
          laFraseDeLasCifras,
          detalle,
          `Os escribo porque sois de ${club.localidad ?? "la zona"} y creemos que os puede encajar. La publicidad en un club de barrio no es como la de internet: la ve la gente que luego entra por vuestra puerta, y os asocia a algo que quieren.`,
          enlace(club),
          "Si os interesa, contestadme a este correo y os cuento las opciones. Y si no es el momento, decídmelo también y no os molesto más.",
          `Gracias,\n${firma(club)}`,
        ),
        faltan: huecosDelClub(club),
      };

    case "servicio":
      return {
        asuntos: [
          `¿Nos podríais echar una mano en el ${club.nombre}?`,
          `Una colaboración sin dinero de por medio`,
          `${club.nombre}: os proponemos un intercambio`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          presentacion(club),
          detalle
            ? `Lo que necesitamos es esto: ${detalle}`
            : "Lo que necesitamos no es dinero, es [di aquí exactamente qué: fisioterapia para los partidos de casa, una furgoneta para los desplazamientos, las lonas del pabellón…].",
          laFraseDeLasCifras,
          "A cambio os damos la misma visibilidad que a cualquier patrocinador: vuestro logo, vuestro nombre en nuestras redes y en el pabellón, y a nuestra gente contándolo.",
          enlace(club),
          "¿Lo hablamos? Con una llamada corta nos aclaramos.",
          `Un saludo,\n${firma(club)}`,
        ),
        faltan: huecosDelClub(club),
      };

    case "insistir":
      return {
        asuntos: [
          `Te escribí hace unos días — ${club.nombre}`,
          `¿Le has podido echar un ojo?`,
          `Vuelvo a la carga (y no insisto más)`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          `Te escribí hace unos días desde el ${club.nombre} y no sé si te habrá llegado, que los correos se pierden.`,
          "No te quiero dar la lata: con que me digas que no es el momento, me vale y no vuelvo a escribirte.",
          "Y si es que sí, dime cuándo te viene bien que te llame y lo vemos en cinco minutos.",
          enlace(club),
          `Gracias de todas formas,\n${firma(club)}`,
        ),
        faltan: [],
      };

    case "responder":
      return {
        asuntos: [
          `Re: tu mensaje — ${club.nombre}`,
          `Gracias por escribirnos`,
          `Te cuento, ${empresa.contactoNombre ?? empresa.nombre}`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          `Muchas gracias por escribirnos. Te cuento lo que podemos hacer.`,
          laFraseDeLasCifras,
          detalle
            ? `Sobre lo que preguntabas: ${detalle}`
            : "[Responde aquí a lo que te haya preguntado, con nombres y números concretos. Es la parte que más se juega.]",
          enlace(club),
          "Si te encaja, dime un día y una hora y te llamo. Y si prefieres verlo en persona, nos pasamos por ahí sin problema.",
          `Un saludo,\n${firma(club)}`,
        ),
        faltan: huecosDelClub(club),
      };

    case "renovar":
      return {
        asuntos: [
          `¿Seguimos juntos la temporada que viene?`,
          `${club.nombre}: gracias por este año`,
          `Renovación ${club.nombre} — ${empresa.nombre}`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          `Se nos acaba la temporada y quería escribirte antes de que se me pasara: gracias por haber estado con el ${club.nombre} este año.`,
          detalle ? `Esto es lo que hemos hecho con vosotros: ${detalle}` : "[Cuéntale aquí qué recibió: las publicaciones, la lona, las menciones. Si lo tienes apuntado en Tareas, sácalo de ahí.]",
          laFraseDeLasCifras,
          "Para el año que viene nos gustaría seguir, y si quieres podemos darle una vuelta a lo que hacemos para que os luzca más.",
          "¿Lo hablamos un día de estos?",
          `Un abrazo,\n${firma(club)}`,
        ),
        faltan: huecosDelClub(club),
      };

    case "cierre":
      return {
        asuntos: [
          `Sin problema — ${club.nombre}`,
          `Gracias de todas formas`,
          `Nos vemos el año que viene`,
        ],
        cuerpo: parrafos(
          saludo(empresa),
          "Gracias por contestar, de verdad. Un no a tiempo vale mucho más que un silencio.",
          "Si en algún momento cambian las cosas, aquí estamos. Y si conoces a alguien a quien le pueda encajar, te agradecería que le pasaras nuestra página.",
          enlace(club),
          `Mucha suerte con todo,\n${firma(club)}`,
        ),
        faltan: [],
      };
  }
}

/** El enlace `mailto:` que abre el correo del club con todo puesto. */
export function enlaceDeCorreo({
  para,
  asunto,
  cuerpo,
}: {
  para: string | null;
  asunto: string;
  cuerpo: string;
}): string {
  const destinatario = para ? encodeURIComponent(para) : "";
  return `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/**
 * Saca una dirección de correo de lo que el club apuntó a mano.
 *
 * El campo de contacto es texto libre —ahí hay teléfonos, nombres y
 * "el de la ferretería"—, así que hay que pescarla. Si no hay ninguna,
 * el correo se abre sin destinatario, que sigue siendo útil.
 */
export function correoDe(texto: string | null): string | null {
  if (!texto) return null;
  const encontrado = texto.match(/[^\s<>()[\],;:]+@[^\s<>()[\],;:]+\.[a-zA-Z]{2,}/);
  return encontrado ? encontrado[0] : null;
}
