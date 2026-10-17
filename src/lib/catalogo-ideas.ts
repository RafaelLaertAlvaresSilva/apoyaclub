import type {
  BudgetPeriod,
  CategoriaNecesidad,
  ClubProfile,
  ClubTeam,
  CollaborationType,
  OpportunityType,
} from "@/lib/types";

/**
 * El catálogo de ideas: qué puede ofrecer un club.
 *
 * Un club de barrio no se queda sin patrocinadores por no tener página.
 * Se queda sin ellos porque cree que lo único vendible es el hueco de la
 * camiseta, y ese ya lo tiene el concesionario del primo del presidente
 * desde hace ocho años. El vestuario, el descanso, el resumen del
 * partido, la visita del equipo a una empresa: todo eso también se
 * vende, y nadie se lo ha contado nunca.
 *
 * Esto no sustituye al formulario de oportunidades: lo rellena. El club
 * elige una idea y se abre el formulario de siempre con el título, la
 * descripción, la duración y la forma de colaboración ya puestas. Lo
 * único que no viene nunca puesto es el precio, y es a propósito: nadie
 * en esta plataforma sabe todavía lo que vale un patrocinio de un club
 * de barrio, y decirle una cifra al club sería inventársela.
 *
 * Las catorce categorías de aquí son para navegar. Por debajo, cada idea
 * se guarda en uno de los seis tipos que ya entiende el buscador: si se
 * tocaran esos tipos habría que rehacer filtros y vistas, y no compensa.
 */

export type CategoriaIdea =
  | "equipos"
  | "cantera"
  | "equipaciones"
  | "jugadores"
  | "eventos"
  | "torneos"
  | "instalaciones"
  | "intervalo"
  | "redes"
  | "familias"
  | "tienda"
  | "visibilidad-local"
  | "contenido"
  | "digital"
  | "retransmisiones"
  | "servicios";

export const CATEGORIAS_IDEA: {
  id: CategoriaIdea;
  etiqueta: string;
  /** Una línea para que el club sepa si esta categoría es para él. */
  pista: string;
}[] = [
  { id: "equipos", etiqueta: "Equipos", pista: "Lo que rodea a un equipo entero durante la temporada." },
  { id: "equipaciones", etiqueta: "Equipaciones", pista: "Cada hueco de la ropa se vende por separado." },
  { id: "instalaciones", etiqueta: "Instalaciones", pista: "Lo que se ve en el pabellón o el campo un día de partido." },
  { id: "intervalo", etiqueta: "Intervalo del partido", pista: "El descanso de un partido en casa: se vende por equipo, masculino y femenino por separado." },
  { id: "redes", etiqueta: "Redes sociales", pista: "Tu audiencia, que es más grande de lo que crees." },
  { id: "cantera", etiqueta: "Cantera", pista: "Los niños, sus familias y todo lo que arrastran." },
  { id: "jugadores", etiqueta: "Jugadores", pista: "Las personas del club, no el escudo." },
  { id: "eventos", etiqueta: "Eventos", pista: "Presentaciones, galas, jornadas, cualquier día señalado." },
  { id: "torneos", etiqueta: "Torneos", pista: "Un torneo es el producto más fácil de vender que tiene un club." },
  { id: "contenido", etiqueta: "Contenido", pista: "Vídeos, fotos, entrevistas: lo que ya haces, con una marca al lado." },
  { id: "digital", etiqueta: "Digital", pista: "Tu web, tu newsletter, tu lista de socios." },
  { id: "retransmisiones", etiqueta: "Retransmisiones", pista: "Si retransmites partidos, aunque sea por YouTube." },
  { id: "familias", etiqueta: "Familias y socios", pista: "Descuentos y ventajas: la empresa gana clientes, no solo un logo." },
  { id: "tienda", etiqueta: "Tienda del club", pista: "Lo que el club vende: ropa de otros años, productos propios y quien venda en tus partidos." },
  { id: "visibilidad-local", etiqueta: "Visibilidad local", pista: "El club saliendo del pabellón y entrando en el barrio." },
  { id: "servicios", etiqueta: "Lo que necesitas", pista: "Al revés: lo que te hace falta y una empresa puede cubrir." },
];

export const ETIQUETA_CATEGORIA_IDEA: Record<CategoriaIdea, string> = CATEGORIAS_IDEA.reduce(
  (acumulado, categoria) => ({ ...acumulado, [categoria.id]: categoria.etiqueta }),
  {} as Record<CategoriaIdea, string>,
);

/**
 * Lo que el club tiene que tener para que la idea no sea una tomadura de
 * pelo. Ofrecerle "patrocinador de la cantera" a un club sin cantera es
 * la forma más rápida de que cierre esta pantalla y no vuelva.
 *
 * Solo hay requisitos de cosas que de verdad se pueden comprobar en su
 * ficha. Lo demás se enseña siempre.
 */
export type RequisitoIdea = "equipos" | "cantera" | "instalaciones" | "redes" | "publico";

export type Idea = {
  /** Estable: se usa como clave y puede acabar en una URL. */
  id: string;
  categoria: CategoriaIdea;
  /** Dónde se guarda, de los seis tipos que entiende el buscador. */
  tipo: OpportunityType;
  /*
   * Los textos de cada idea (título, qué es, qué recibe la empresa y la
   * duración) viven en `messages/<idioma>/ideas.json`, bajo
   * `ideas.<id>`, para que el catálogo salga en el idioma del panel.
   * Ver `textosDeLaIdea`.
   */
  periodo: BudgetPeriod | null;
  colaboracion: CollaborationType;
  requiere?: RequisitoIdea[];
  /** Las de "Lo que necesitas" van al revés: las publica el club pidiendo. */
  esNecesidad?: boolean;
  categoriaNecesidad?: CategoriaNecesidad;
};

export const IDEAS: Idea[] = [
  // -------------------------------------------------------------------
  // Equipos
  // -------------------------------------------------------------------
  {
    id: "equipo-patrocinador-principal",
    categoria: "equipos",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipo-empresa-del-mes",
    categoria: "equipos",
    tipo: "social_content",
    periodo: "month",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "equipo-patrocinador-de-partido",
    categoria: "equipos",
    tipo: "venue_matches",
    periodo: "match",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipo-desplazamientos",
    categoria: "equipos",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipo-material",
    categoria: "equipos",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipo-empresa-oficial",
    categoria: "equipos",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "money",
  },
  {
    id: "equipo-contenido-con-jugadores",
    categoria: "equipos",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipo-entrenamiento-abierto",
    categoria: "equipos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },

  // -------------------------------------------------------------------
  // Equipaciones
  // -------------------------------------------------------------------
  {
    id: "equipacion-pecho",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-espalda",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-manga",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-pantalon",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-entrenamiento",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-chandal",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-mochilas",
    categoria: "equipaciones",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-presentacion",
    categoria: "equipaciones",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },

  // -------------------------------------------------------------------
  // Instalaciones
  // -------------------------------------------------------------------
  {
    id: "instalaciones-lona",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-naming",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-vinilo-pista",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-marcador",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-vestuario",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-entrada",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-stand",
    categoria: "instalaciones",
    tipo: "events_tournaments",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-megafonia",
    categoria: "instalaciones",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },


  // -------------------------------------------------------------------
  // Intervalo del partido
  //
  // El descanso es el único rato de un partido en el que el público
  // está en la grada y no está mirando a la pista. Diez minutos, cada
  // jornada, con la gente sentada y sin nada que hacer: es el hueco
  // más desaprovechado que tiene un club, y no cuesta nada montarlo.
  //
  // Se vende por equipo, no por club. El descanso de los partidos en
  // casa del primer equipo masculino y el del primer equipo femenino
  // son dos huecos distintos, cada uno con su propio público, y el
  // club puede venderlos a dos empresas que no compitan entre sí.
  // -------------------------------------------------------------------
  {
    id: "intervalo-patrocinador-del-descanso",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-sorteo",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "match",
    colaboracion: "product",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-reto-de-tiro",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-minipartido-cantera",
    categoria: "intervalo",
    tipo: "youth",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["instalaciones", "cantera"],
  },
  {
    id: "intervalo-degustacion",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "match",
    colaboracion: "product",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-entrega-mvp",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-photocall",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-anuncio-en-pista",
    categoria: "intervalo",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },

  // -------------------------------------------------------------------
  // Redes sociales
  // -------------------------------------------------------------------
  {
    id: "redes-publicaciones-semanales",
    categoria: "redes",
    tipo: "social_content",
    periodo: "month",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "redes-stories-partido",
    categoria: "redes",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "redes-reel-patrocinado",
    categoria: "redes",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "redes-sorteo",
    categoria: "redes",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "product",
    requiere: ["redes"],
  },
  {
    id: "redes-codigo-descuento",
    categoria: "redes",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "service",
    requiere: ["redes"],
  },
  {
    id: "redes-empresa-de-la-semana",
    categoria: "redes",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "redes-entrevista",
    categoria: "redes",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "redes-encuesta",
    categoria: "redes",
    tipo: "social_content",
    periodo: "month",
    colaboracion: "mixed",
    requiere: ["redes"],
  },

  // -------------------------------------------------------------------
  // Cantera
  // -------------------------------------------------------------------
  {
    id: "cantera-patrocinador",
    categoria: "cantera",
    tipo: "youth",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera"],
  },
  {
    id: "cantera-una-categoria",
    categoria: "cantera",
    tipo: "youth",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera"],
  },
  {
    id: "cantera-empresa-amiga",
    categoria: "cantera",
    tipo: "youth",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera"],
  },
  {
    id: "cantera-material",
    categoria: "cantera",
    tipo: "youth",
    periodo: "season",
    colaboracion: "product",
    requiere: ["cantera"],
  },
  {
    id: "cantera-jugador-del-mes",
    categoria: "cantera",
    tipo: "youth",
    periodo: "month",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },
  {
    id: "cantera-jornada-especial",
    categoria: "cantera",
    tipo: "youth",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },
  {
    id: "cantera-charla-familias",
    categoria: "cantera",
    tipo: "youth",
    periodo: "event",
    colaboracion: "service",
    requiere: ["cantera"],
  },
  {
    id: "cantera-escuela",
    categoria: "cantera",
    tipo: "youth",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },

  // -------------------------------------------------------------------
  // Jugadores
  // -------------------------------------------------------------------
  {
    id: "jugadores-del-mes",
    categoria: "jugadores",
    tipo: "social_content",
    periodo: "month",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-patrocinado",
    categoria: "jugadores",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-visita-a-empresa",
    categoria: "jugadores",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-visita-al-club",
    categoria: "jugadores",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-prueba-de-producto",
    categoria: "jugadores",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "product",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-clinic",
    categoria: "jugadores",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-embajador",
    categoria: "jugadores",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-meet-and-greet",
    categoria: "jugadores",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },

  // -------------------------------------------------------------------
  // Eventos
  // -------------------------------------------------------------------
  {
    id: "eventos-patrocinador",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "eventos-naming",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "eventos-photocall",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "eventos-catering",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "service",
  },
  {
    id: "eventos-sorteo",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "eventos-muestras",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "eventos-dia-del-club",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "eventos-transporte",
    categoria: "eventos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "service",
  },

  // -------------------------------------------------------------------
  // Torneos
  // -------------------------------------------------------------------
  {
    id: "torneos-patrocinador",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "torneos-trofeos",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-mvp",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-camisetas",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-avituallamiento",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "torneos-jornada",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "torneos-zona-empresa",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-final",
    categoria: "torneos",
    tipo: "events_tournaments",
    periodo: "match",
    colaboracion: "money",
  },

  // -------------------------------------------------------------------
  // Contenido
  // -------------------------------------------------------------------
  {
    id: "contenido-resumen-partido",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "contenido-fotografia",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "contenido-entrevistas",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "contenido-podcast",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "contenido-reportaje",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "contenido-detras-de-camaras",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos", "redes"],
  },
  {
    id: "contenido-cantera",
    categoria: "contenido",
    tipo: "youth",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera", "redes"],
  },
  {
    id: "contenido-educativo",
    categoria: "contenido",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "service",
    requiere: ["redes"],
  },

  // -------------------------------------------------------------------
  // Digital
  // -------------------------------------------------------------------
  {
    id: "digital-banner-web",
    categoria: "digital",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
  },
  {
    id: "digital-empresa-recomendada",
    categoria: "digital",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "digital-newsletter",
    categoria: "digital",
    tipo: "social_content",
    periodo: "month",
    colaboracion: "money",
  },
  {
    id: "digital-qr",
    categoria: "digital",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "digital-pagina-patrocinada",
    categoria: "digital",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
  },
  {
    id: "digital-cartel-fichajes",
    categoria: "digital",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },

  // -------------------------------------------------------------------
  // Retransmisiones
  // -------------------------------------------------------------------
  {
    id: "retransmision-patrocinador",
    categoria: "retransmisiones",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "retransmision-logo",
    categoria: "retransmisiones",
    tipo: "social_content",
    periodo: "match",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "retransmision-descanso",
    categoria: "retransmisiones",
    tipo: "social_content",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "retransmision-mvp",
    categoria: "retransmisiones",
    tipo: "social_content",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "retransmision-entrevista",
    categoria: "retransmisiones",
    tipo: "social_content",
    periodo: "match",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "retransmision-clips",
    categoria: "retransmisiones",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },

  // -------------------------------------------------------------------
  // Familias y socios
  // -------------------------------------------------------------------
  {
    id: "familias-descuento",
    categoria: "familias",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "service",
  },
  {
    id: "familias-carnet",
    categoria: "familias",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "service",
  },
  {
    id: "familias-actividad",
    categoria: "familias",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "familias-regalo-navidad",
    categoria: "familias",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "familias-sorteo-socios",
    categoria: "familias",
    tipo: "social_content",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "familias-campana-comercios",
    categoria: "familias",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "money",
  },


  // -------------------------------------------------------------------
  // Tienda del club
  //
  // Un club de barrio tiene dos armarios llenos: el de las equipaciones
  // de hace tres años que ya no le valen a nadie, y el de las ideas de
  // merchandising que nunca hace porque no puede adelantar el dinero de
  // una tirada de doscientos llaveros.
  //
  // Por eso todas las ideas de aquí llevan una empresa al otro lado. El
  // club no pone dinero: pone el escudo, la gente y el sitio donde se
  // vende. La empresa pone la produccion, el genero o la logistica, y a
  // cambio va su marca en lo que se venda. Es la unica forma en la que
  // un club sin caja monta una tienda.
  // -------------------------------------------------------------------
  {
    id: "tienda-patrocinador-de-la-tienda",
    categoria: "tienda",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "tienda-personalizado-con-dorsal",
    categoria: "tienda",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "tienda-mercadillo-de-equipaciones",
    categoria: "tienda",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "tienda-venta-a-comision",
    categoria: "tienda",
    tipo: "venue_matches",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "tienda-prenda-oficial",
    categoria: "tienda",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "tienda-ropa-de-paseo",
    categoria: "tienda",
    tipo: "equipment",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "tienda-lote-de-bienvenida",
    categoria: "tienda",
    tipo: "youth",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },
  {
    id: "tienda-producto-con-el-escudo",
    categoria: "tienda",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "mixed",
  },

  // -------------------------------------------------------------------
  // Visibilidad local
  // -------------------------------------------------------------------
  {
    id: "local-evento-conjunto",
    categoria: "visibilidad-local",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "local-presentacion-producto",
    categoria: "visibilidad-local",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "local-escaparate",
    categoria: "visibilidad-local",
    tipo: "social_content",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "local-cupones",
    categoria: "visibilidad-local",
    tipo: "social_content",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["publico"],
  },
  {
    id: "local-accion-solidaria",
    categoria: "visibilidad-local",
    tipo: "events_tournaments",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "local-colegios",
    categoria: "visibilidad-local",
    tipo: "youth",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },

  // -------------------------------------------------------------------
  // Lo que necesitas (van al revés: las publica el club pidiendo)
  // -------------------------------------------------------------------
  {
    id: "necesita-fisioterapia",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "fisioterapia",
  },
  {
    id: "necesita-medico",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "medico",
  },
  {
    id: "necesita-fotografo",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "fotografia",
  },
  {
    id: "necesita-video",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "video",
  },
  {
    id: "necesita-marketing",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "marketing",
  },
  {
    id: "necesita-imprenta",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "imprenta",
  },
  {
    id: "necesita-transporte",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "transporte",
  },
  {
    id: "necesita-material",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "material",
  },
  {
    id: "necesita-equipacion",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "equipacion",
  },
  {
    id: "necesita-restauracion",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "restauracion",
  },
  {
    id: "necesita-alojamiento",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "alojamiento",
  },
  {
    id: "necesita-gimnasio",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "gimnasio",
  },
  {
    id: "necesita-nutricion",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "nutricion",
  },
  {
    id: "necesita-asesoria",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "asesoria",
  },
  {
    id: "necesita-informatica",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "informatica",
  },
  {
    id: "necesita-limpieza",
    categoria: "servicios",
    tipo: "in_kind",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "limpieza",
  },
];

// ---------------------------------------------------------------------
// Consultas sobre el catálogo
// ---------------------------------------------------------------------

export function buscarIdea(id: string): Idea | null {
  return IDEAS.find((idea) => idea.id === id) ?? null;
}

export function ideasDeCategoria(categoria: CategoriaIdea): Idea[] {
  return IDEAS.filter((idea) => idea.categoria === categoria);
}

/**
 * Lo que este club puede cumplir, mirando su ficha.
 *
 * Se tira por lo bajo a propósito: un club al que le falta rellenar la
 * ficha verá menos ideas, y eso es preferible a proponerle cosas que no
 * puede dar. Además le empuja a completar su ficha, que es exactamente
 * lo que necesita para que una empresa lo encuentre.
 */
export function requisitosDelClub(
  perfil: Pick<
    ClubProfile,
    | "facilities"
    | "facilitiesAddress"
    | "socialLinks"
    | "youthTeamsCount"
    | "youthPlayersCount"
    | "averageAttendance"
  > | null,
  equipos: Pick<ClubTeam, "teamLevel">[] = [],
): Set<RequisitoIdea> {
  const tiene = new Set<RequisitoIdea>();
  if (equipos.length > 0) tiene.add("equipos");

  const hayCantera =
    equipos.some((equipo) => equipo.teamLevel === "cantera") ||
    (perfil?.youthTeamsCount ?? 0) > 0 ||
    (perfil?.youthPlayersCount ?? 0) > 0;
  if (hayCantera) tiene.add("cantera");

  if (perfil?.facilities?.trim() || perfil?.facilitiesAddress?.trim()) tiene.add("instalaciones");

  const redes = perfil?.socialLinks ?? {};
  if (Object.values(redes).some((enlace) => typeof enlace === "string" && enlace.trim() !== "")) {
    tiene.add("redes");
  }

  if ((perfil?.averageAttendance ?? 0) > 0) tiene.add("publico");

  return tiene;
}

export type IdeaParaElClub = Idea & {
  /** false si al club le falta algo de su ficha para poder ofrecerla. */
  disponible: boolean;
  /** Lo que le falta, para poder decírselo en vez de esconderla sin más. */
  leFalta: RequisitoIdea[];
};

/**
 * La función de traducir del espacio `ideas` (la de
 * `useTranslations("ideas")`, o la de las pruebas).
 */
export type TraducirIdeas = (clave: string) => string;

export type TextosDeLaIdea = { titulo: string; queEs: string; queRecibe: string; duracion: string };

/** Los textos de una idea en el idioma de quien la mira. */
export function textosDeLaIdea(idea: Pick<Idea, "id">, t: TraducirIdeas): TextosDeLaIdea {
  return {
    titulo: t(`ideas.${idea.id}.titulo`),
    queEs: t(`ideas.${idea.id}.queEs`),
    queRecibe: t(`ideas.${idea.id}.queRecibe`),
    duracion: t(`ideas.${idea.id}.duracion`),
  };
}

/**
 * "cuenta dónde jugáis y añade tus redes sociales". La "y" la pone
 * `Intl.ListFormat`, que la cambia por "e" o "and" según el idioma.
 */
export function textoDeLoQueFalta(
  requisitos: RequisitoIdea[],
  t: TraducirIdeas,
  intlLocale = "es-ES",
): string {
  return new Intl.ListFormat(intlLocale, { style: "long", type: "conjunction" }).format(
    requisitos.map((requisito) => t(`falta.${requisito}`)),
  );
}

/**
 * Las ideas de una categoría, marcando cuáles puede ofrecer ya este club
 * y cuáles le piden rellenar antes algo de su ficha.
 *
 * No se esconden las que no puede: se enseñan detrás, apagadas y con el
 * motivo. Esconderlas sería quitarle justo la información que le hace
 * falta —"esto también se vende, pero antes cuenta dónde juegas"—, que
 * es para lo que sirve todo este catálogo.
 */
export function ideasParaElClub(
  categoria: CategoriaIdea,
  tiene: Set<RequisitoIdea>,
): IdeaParaElClub[] {
  return ideasDeCategoria(categoria)
    .map((idea) => {
      const leFalta = (idea.requiere ?? []).filter((requisito) => !tiene.has(requisito));
      return { ...idea, disponible: leFalta.length === 0, leFalta };
    })
    .sort((a, b) => Number(b.disponible) - Number(a.disponible));
}

/**
 * La descripción con la que se rellena el formulario.
 *
 * Deliberadamente NO incluye ningún hueco tipo "[escribe aquí]": un
 * hueco así acaba publicado tal cual más veces de las que se cree. Lo
 * que el club tiene que añadir de su propia cosecha se le pide en la
 * pantalla, donde lo lee antes de guardar.
 */
export function descripcionDeLaIdea(idea: Pick<Idea, "id">, t: TraducirIdeas): string {
  const textos = textosDeLaIdea(idea, t);
  return `${textos.queEs}\n\n${t("queRecibeEtiqueta")} ${textos.queRecibe}`;
}

/** Cuántas ideas tiene el catálogo, para poder decirlo sin mentir. */
export const TOTAL_DE_IDEAS = IDEAS.length;
