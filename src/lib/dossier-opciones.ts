/**
 * Las opciones del dossier que no son apartados: si salen las fotos y
 * cómo salen los patrocinadores (pedido por Rafael el 5-11-2026).
 *
 *   - Fotos de las oportunidades: la primera foto de cada una, junto a
 *     su texto. Es lo que más vende y antes salía solo el texto.
 *   - Foto del primer equipo masculino y del femenino, con su pie, en
 *     el apartado "Equipos".
 *   - Patrocinadores con logo o solo con el nombre. Por defecto, solo el
 *     nombre: con logo, un club con muchos ocupa páginas.
 *   - Patrocinadores separados por categoría (principal, oficial,
 *     colaborador…) o todos en una sola lista.
 *   - El código QR del contacto final: qué abre al escanearlo (la ficha
 *     del club, su vídeo, un enlace que pega el club) o ninguno.
 *
 * Se guardan en la misma columna `sections` de `club_dossiers`, como
 * "opcion:clave=1" o "opcion:clave=0", igual que "oportunidades" se
 * guarda ahí para el orden. Así no hace falta migración: lo que lee las
 * secciones (`seccionesValidas`, `ordenDelDossier`) ya ignora lo que no
 * conoce.
 */
export type OpcionesSiNo = {
  fotosOportunidades: boolean;
  fotoEquipoMasculino: boolean;
  fotoEquipoFemenino: boolean;
  logosPatrocinadores: boolean;
  separarPatrocinadores: boolean;
};

export type ClaveOpcion = keyof OpcionesSiNo;

export const TIPOS_QR = ["ficha", "video", "enlace", "ninguno"] as const;
export type TipoQr = (typeof TIPOS_QR)[number];

export type OpcionesDossier = OpcionesSiNo & {
  qr: TipoQr;
  /** Solo con `qr: "enlace"`: la dirección que ha pegado el club. */
  qrEnlace: string | null;
};

/** Lo que sale si el club no ha tocado nada. */
export const OPCIONES_POR_DEFECTO: OpcionesDossier = {
  fotosOportunidades: true,
  fotoEquipoMasculino: true,
  fotoEquipoFemenino: true,
  logosPatrocinadores: false,
  separarPatrocinadores: true,
  qr: "ficha",
  qrEnlace: null,
};

const CLAVES: ClaveOpcion[] = [
  "fotosOportunidades",
  "fotoEquipoMasculino",
  "fotoEquipoFemenino",
  "logosPatrocinadores",
  "separarPatrocinadores",
];
const PREFIJO = "opcion:";
const PREFIJO_QR = "qr:";
const PREFIJO_QR_ENLACE = "qrEnlace:";

/**
 * Un enlace que vale para el QR: una dirección web completa y no muy
 * larga (un QR con mucho texto sale tan denso que el móvil no lo lee).
 * Sin "https://", se le pone. Si no vale, null.
 */
export function enlaceValidoParaQr(texto: unknown): string | null {
  let limpio = String(texto ?? "").trim();
  if (!limpio || limpio.length > 300) return null;
  if (!/^https?:\/\//i.test(limpio)) limpio = `https://${limpio}`;
  try {
    const url = new URL(limpio);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Las opciones guardadas en `sections`; las que no estén, por defecto. */
export function opcionesGuardadas(valores: readonly unknown[]): OpcionesDossier {
  const opciones = { ...OPCIONES_POR_DEFECTO };
  for (const valor of valores) {
    const texto = String(valor);
    if (texto.startsWith(PREFIJO_QR_ENLACE)) {
      opciones.qrEnlace = enlaceValidoParaQr(texto.slice(PREFIJO_QR_ENLACE.length));
      continue;
    }
    if (texto.startsWith(PREFIJO_QR)) {
      const tipo = texto.slice(PREFIJO_QR.length);
      if ((TIPOS_QR as readonly string[]).includes(tipo)) opciones.qr = tipo as TipoQr;
      continue;
    }
    if (!texto.startsWith(PREFIJO)) continue;
    const [clave, estado] = texto.slice(PREFIJO.length).split("=");
    if ((CLAVES as string[]).includes(clave) && (estado === "1" || estado === "0")) {
      opciones[clave as ClaveOpcion] = estado === "1";
    }
  }
  return opciones;
}

/** Cómo se guardan en `sections`: todas, para que se vea qué eligió. */
export function opcionesParaGuardar(opciones: OpcionesDossier): string[] {
  return [
    ...CLAVES.map((clave) => `${PREFIJO}${clave}=${opciones[clave] ? "1" : "0"}`),
    `${PREFIJO_QR}${opciones.qr}`,
    ...(opciones.qrEnlace ? [`${PREFIJO_QR_ENLACE}${opciones.qrEnlace}`] : []),
  ];
}

/**
 * Las opciones que trae el formulario: cada casilla marcada llega como
 * `opcion=<clave>`. La marca `opcionesEnviadas` dice que el formulario
 * las trae; sin ella (un formulario de antes, o el enlace público), las
 * de por defecto.
 */
export function opcionesDelFormulario(formData: FormData): OpcionesDossier {
  if (!formData.has("opcionesEnviadas")) return { ...OPCIONES_POR_DEFECTO };
  const marcadas = new Set(formData.getAll("opcion").map(String));
  const siNo = Object.fromEntries(CLAVES.map((clave) => [clave, marcadas.has(clave)])) as OpcionesSiNo;

  const pedido = String(formData.get("qr") ?? "");
  const qr = (TIPOS_QR as readonly string[]).includes(pedido) ? (pedido as TipoQr) : OPCIONES_POR_DEFECTO.qr;
  // El enlace se guarda aunque ahora se haya elegido otra cosa, para no
  // tener que volver a pegarlo si se cambia de idea.
  return { ...siNo, qr, qrEnlace: enlaceValidoParaQr(formData.get("qrEnlace")) };
}

/**
 * La dirección que abre el QR, o null si no lleva. Si lo elegido no se
 * puede (sin vídeo, o sin un enlace válido), la ficha del club: un QR
 * que no lleva a ninguna parte es peor que ninguno.
 */
export function direccionDelQr(
  opciones: Pick<OpcionesDossier, "qr" | "qrEnlace">,
  { ficha, video }: { ficha: string; video: string | null },
): { url: string; tipo: Exclude<TipoQr, "ninguno"> } | null {
  if (opciones.qr === "ninguno") return null;
  if (opciones.qr === "video" && video) return { url: video, tipo: "video" };
  if (opciones.qr === "enlace" && opciones.qrEnlace) return { url: opciones.qrEnlace, tipo: "enlace" };
  return { url: ficha, tipo: "ficha" };
}
