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

/**
 * Las plantillas, en el orden del desplegable. Su nombre y cuándo se
 * usa cada una están en `panel.plantillas.tipos.<id>`: los textos de
 * los correos viven todos en los mensajes, para que el club los saque
 * en el idioma en el que tiene abierto el panel.
 */
export const PLANTILLAS: { id: PlantillaId }[] = [
  { id: "conocida" },
  { id: "fria" },
  { id: "servicio" },
  { id: "insistir" },
  { id: "responder" },
  { id: "renovar" },
  { id: "cierre" },
];

export function esPlantillaValida(valor: string): valor is PlantillaId {
  return PLANTILLAS.some((plantilla) => plantilla.id === valor);
}

/**
 * La función de traducir de `panel.plantillas`, ya hecha. La da
 * `useTranslations("panel.plantillas")` en el panel y, en las pruebas,
 * un traductor armado con los mismos mensajes.
 */
export type Traducir = (clave: string, valores?: Record<string, string | number>) => string;

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

/**
 * Las cifras del club en una frase, con lo que tenga.
 *
 * Devuelve null si no tiene ninguna: entonces la frase entera se cae,
 * en vez de quedarse coja. La "y" del final la pone `Intl.ListFormat`,
 * que sabe que en portugués es "e" y en inglés "and".
 */
export function cifrasEnTexto(club: DatosDelClub, t: Traducir, intlLocale = "es-ES"): string | null {
  const formatoNumero = new Intl.NumberFormat(intlLocale);
  const partes: string[] = [];

  if (club.jugadores) partes.push(t("cifras.jugadores", { n: formatoNumero.format(club.jugadores) }));
  if (club.familias) partes.push(t("cifras.familias", { n: formatoNumero.format(club.familias) }));
  if (club.socios) partes.push(t("cifras.socios", { n: formatoNumero.format(club.socios) }));
  if (club.publicoMedio) {
    partes.push(t("cifras.publico", { n: formatoNumero.format(club.publicoMedio) }));
  }

  if (partes.length === 0) return null;

  return new Intl.ListFormat(intlLocale, { style: "long", type: "conjunction" }).format(partes);
}

/** Qué le falta al club para que estos correos convenzan. */
export function huecosDelClub(club: DatosDelClub, t: Traducir, intlLocale = "es-ES"): Hueco[] {
  const huecos: Hueco[] = [];

  if (!cifrasEnTexto(club, t, intlLocale)) {
    huecos.push({ que: t("huecos.cifras"), donde: "/panel/perfil#audiencia" });
  }

  if (!club.urlDossier) {
    huecos.push({ que: t("huecos.dossier"), donde: "/panel/dossier" });
  }

  if (!club.firmante) {
    huecos.push({ que: t("huecos.firma"), donde: "/panel/perfil#identidad" });
  }

  return huecos;
}

/** Junta los trozos que no están vacíos, separados por una línea. */
function parrafos(...trozos: (string | null)[]): string {
  return trozos.filter((trozo): trozo is string => !!trozo).join("\n\n");
}

export function construirCorreo(
  plantilla: PlantillaId,
  club: DatosDelClub,
  empresa: DatosDeLaEmpresa,
  t: Traducir,
  intlLocale = "es-ES",
): CorreoGenerado {
  const cifras = cifrasEnTexto(club, t, intlLocale);
  const laFraseDeLasCifras = cifras ? t("comun.fraseCifras", { cifras }) : null;
  const detalle = empresa.detalle?.trim() || null;

  // Los datos que puede usar cualquier frase de cualquier plantilla.
  const datos = {
    club: club.nombre,
    empresa: empresa.nombre,
    contacto: empresa.contactoNombre ?? empresa.nombre,
    localidad: club.localidad ?? "",
    deporte: club.deporte ?? "",
    detalle: detalle ?? "",
  };
  const frase = (clave: string) => t(`${plantilla}.${clave}`, datos);

  const saludo = empresa.contactoNombre
    ? t("comun.saludoNombre", { nombre: empresa.contactoNombre })
    : t("comun.saludo");

  // Quién somos, en una línea: con deporte y localidad si los hay.
  const presentacion = t(
    club.deporte && club.localidad
      ? "comun.presentacionCompleta"
      : club.deporte
        ? "comun.presentacionDeporte"
        : club.localidad
          ? "comun.presentacionLocalidad"
          : "comun.presentacionSola",
    datos,
  );

  // El enlace que se le pasa a la empresa: el dossier si lo hay, y si
  // no la ficha pública, que siempre existe.
  const enlace = club.urlDossier
    ? t("comun.enlaceDossier", { url: club.urlDossier })
    : t("comun.enlaceFicha", { url: club.urlFicha });

  const firma = `${club.firmante ?? t("comun.tuNombre")}\n${club.nombre}`;
  const despedida = (clave: string) => `${frase(clave)}\n${firma}`;
  const asuntos = [frase("asunto1"), frase("asunto2"), frase("asunto3")];

  switch (plantilla) {
    case "conocida":
      return {
        asuntos,
        cuerpo: parrafos(
          saludo,
          presentacion,
          detalle,
          laFraseDeLasCifras,
          frase("propuesta"),
          enlace,
          frase("llamada"),
          despedida("despedida"),
        ),
        faltan: huecosDelClub(club, t, intlLocale),
      };

    case "fria":
      return {
        asuntos: [
          frase("asunto1"),
          club.localidad ? frase("asunto2") : frase("asunto2SinLocalidad"),
          frase("asunto3"),
        ],
        cuerpo: parrafos(
          saludo,
          presentacion,
          laFraseDeLasCifras,
          detalle,
          club.localidad ? frase("porQue") : frase("porQueSinLocalidad"),
          enlace,
          frase("respuesta"),
          despedida("despedida"),
        ),
        faltan: huecosDelClub(club, t, intlLocale),
      };

    case "servicio":
      return {
        asuntos,
        cuerpo: parrafos(
          saludo,
          presentacion,
          detalle ? frase("necesidad") : frase("necesidadHueco"),
          laFraseDeLasCifras,
          frase("aCambio"),
          enlace,
          frase("llamada"),
          despedida("despedida"),
        ),
        faltan: huecosDelClub(club, t, intlLocale),
      };

    case "insistir":
      return {
        asuntos,
        cuerpo: parrafos(
          saludo,
          frase("recordatorio"),
          frase("sinLata"),
          frase("siEsQueSi"),
          enlace,
          despedida("despedida"),
        ),
        faltan: [],
      };

    case "responder":
      return {
        asuntos,
        cuerpo: parrafos(
          saludo,
          frase("gracias"),
          laFraseDeLasCifras,
          detalle ? frase("respuesta") : frase("respuestaHueco"),
          enlace,
          frase("llamada"),
          despedida("despedida"),
        ),
        faltan: huecosDelClub(club, t, intlLocale),
      };

    case "renovar":
      return {
        asuntos,
        cuerpo: parrafos(
          saludo,
          frase("gracias"),
          detalle ? frase("hecho") : frase("hechoHueco"),
          laFraseDeLasCifras,
          frase("seguir"),
          frase("hablamos"),
          despedida("despedida"),
        ),
        faltan: huecosDelClub(club, t, intlLocale),
      };

    case "cierre":
      return {
        asuntos,
        cuerpo: parrafos(saludo, frase("gracias"), frase("puerta"), enlace, despedida("despedida")),
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
