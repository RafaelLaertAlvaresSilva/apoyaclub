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
  { id: "retransmisiones", etiqueta: "Retransmisiones", pista: "Si retransmites partidos, aunque sea por Instagram." },
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
  titulo: string;
  /** Qué es, en una frase, contado al club. */
  queEs: string;
  /** Qué se lleva la empresa a cambio. */
  queRecibeLaEmpresa: string;
  /** Texto para el campo "duración" del formulario. */
  duracion: string;
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
    titulo: "Patrocinador principal de un equipo",
    queEs: "Una empresa se asocia a un equipo concreto durante toda la temporada y aparece en todo lo que ese equipo hace.",
    queRecibeLaEmpresa: "Su marca en la camiseta de juego, mención en cada convocatoria y alineación, y presencia en las fotos de equipo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipo-empresa-del-mes",
    categoria: "equipos",
    tipo: "social_content",
    titulo: "Empresa del mes",
    queEs: "Cada mes una empresa distinta es la protagonista del club: se presenta, se cuenta a qué se dedica y por qué apoya al equipo.",
    queRecibeLaEmpresa: "Un mes completo de presencia: publicación de presentación, menciones en los partidos de ese mes y su logo en el resumen mensual.",
    duracion: "Un mes",
    periodo: "month",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "equipo-patrocinador-de-partido",
    categoria: "equipos",
    tipo: "venue_matches",
    titulo: "Patrocinador de un partido",
    queEs: "Un partido concreto lleva el nombre de una empresa. Sirve para el derbi, para el día del club o para cualquier jornada señalada.",
    queRecibeLaEmpresa: "Su marca en el cartel del partido, megafonía durante el encuentro y en la publicación del resultado.",
    duracion: "Un partido",
    periodo: "match",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipo-desplazamientos",
    categoria: "equipos",
    tipo: "venue_matches",
    titulo: "Patrocinador de los desplazamientos",
    queEs: "Una empresa cubre los viajes del equipo a los partidos de fuera, en dinero o poniendo el transporte.",
    queRecibeLaEmpresa: "Su marca asociada a cada desplazamiento, con publicación de salida y llegada, y en el autobús si lo pone ella.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipo-material",
    categoria: "equipos",
    tipo: "equipment",
    titulo: "Patrocinador del material del equipo",
    queEs: "Balones, conos, petos, botiquín: el material de trabajo de un equipo durante una temporada.",
    queRecibeLaEmpresa: "Su marca en el material y en las publicaciones de entrenamiento, que son las más frecuentes del club.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipo-empresa-oficial",
    categoria: "equipos",
    tipo: "equipment",
    titulo: "Empresa oficial del club en su sector",
    queEs: "Una empresa es la única de su sector asociada al club: la asesoría oficial, la clínica oficial, la panadería oficial.",
    queRecibeLaEmpresa: "Exclusividad en su sector durante la temporada y el derecho a llamarse empresa oficial del club en su propia publicidad.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
  },
  {
    id: "equipo-contenido-con-jugadores",
    categoria: "equipos",
    tipo: "social_content",
    titulo: "Contenido con jugadores del equipo",
    queEs: "Los jugadores aparecen en una pieza de contenido con el producto o el servicio de la empresa.",
    queRecibeLaEmpresa: "Una pieza grabada en el club, con gente del club, que la empresa también puede usar en sus propias redes.",
    duracion: "Una pieza",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipo-entrenamiento-abierto",
    categoria: "equipos",
    tipo: "events_tournaments",
    titulo: "Entrenamiento abierto patrocinado",
    queEs: "Un entrenamiento abierto al público, con la empresa como anfitriona: se invita a familias, socios y a los clientes de la empresa.",
    queRecibeLaEmpresa: "Una tarde con su marca delante de las familias del club, con la posibilidad de llevar muestras o montar un punto propio.",
    duracion: "Una jornada",
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
    titulo: "Pecho de la camiseta de juego",
    queEs: "El hueco más visible de todos, el que sale en cada foto y en cada retransmisión.",
    queRecibeLaEmpresa: "Su logo en el frontal de la camiseta de juego durante toda la temporada.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-espalda",
    categoria: "equipaciones",
    tipo: "equipment",
    titulo: "Espalda de la camiseta",
    queEs: "El segundo hueco más caro, y el que mejor se lee desde la grada.",
    queRecibeLaEmpresa: "Su logo en la espalda de la camiseta de juego durante toda la temporada.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-manga",
    categoria: "equipaciones",
    tipo: "equipment",
    titulo: "Manga de la camiseta",
    queEs: "Un hueco pequeño y más asequible, perfecto para un comercio del barrio que no puede ir al pecho.",
    queRecibeLaEmpresa: "Su logo en la manga de la camiseta de juego durante toda la temporada.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-pantalon",
    categoria: "equipaciones",
    tipo: "equipment",
    titulo: "Pantalón de juego",
    queEs: "Otro hueco que casi ningún club vende, normalmente porque no se le ocurre que se pueda vender.",
    queRecibeLaEmpresa: "Su logo en el pantalón de juego durante toda la temporada.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-entrenamiento",
    categoria: "equipaciones",
    tipo: "equipment",
    titulo: "Camiseta de entrenamiento",
    queEs: "Se ve menos en los partidos, pero se usa cuatro días por semana en vez de uno.",
    queRecibeLaEmpresa: "Su logo en la ropa de entrenamiento, la que más sale en las publicaciones del día a día.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-chandal",
    categoria: "equipaciones",
    tipo: "equipment",
    titulo: "Chándal de paseo",
    queEs: "La ropa con la que los jugadores llegan al pabellón, viajan y se pasean por el pueblo.",
    queRecibeLaEmpresa: "Su logo en la ropa que sale del recinto deportivo y se ve por la calle.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-mochilas",
    categoria: "equipaciones",
    tipo: "equipment",
    titulo: "Mochilas y bolsas del club",
    queEs: "Cada jugador lleva la suya al colegio, al instituto y al trabajo durante años.",
    queRecibeLaEmpresa: "Su marca en un objeto que se usa a diario y fuera del contexto deportivo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "equipacion-presentacion",
    categoria: "equipaciones",
    tipo: "events_tournaments",
    titulo: "Presentación de la equipación",
    queEs: "El día que se enseña la camiseta nueva es el contenido con más alcance de toda la temporada. Se puede vender entero.",
    queRecibeLaEmpresa: "Ser la marca que presenta la equipación: sesión de fotos, vídeo y publicación de estreno.",
    duracion: "Una jornada",
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
    titulo: "Lona o valla publicitaria",
    queEs: "Publicidad fija en la pista, el campo o el pabellón, visible en todos los partidos de casa.",
    queRecibeLaEmpresa: "Su marca delante de todo el que pase por el recinto durante la temporada, también en entrenamientos.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-naming",
    categoria: "instalaciones",
    tipo: "venue_matches",
    titulo: "Nombre del pabellón o del campo",
    queEs: "El recinto pasa a llamarse con el nombre de la empresa en todo lo que publica el club.",
    queRecibeLaEmpresa: "Su nombre en cada convocatoria, cada crónica y cada indicación de dónde se juega.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-vinilo-pista",
    categoria: "instalaciones",
    tipo: "venue_matches",
    titulo: "Vinilo en la pista o el terreno de juego",
    queEs: "Un adhesivo en el propio suelo de juego, que sale en todas las fotos de la acción.",
    queRecibeLaEmpresa: "Presencia dentro del campo, que es donde apuntan las cámaras y los móviles.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-marcador",
    categoria: "instalaciones",
    tipo: "venue_matches",
    titulo: "Marcador o pantalla",
    queEs: "La empresa aparece en el marcador: el sitio al que todo el mundo mira varias veces por partido.",
    queRecibeLaEmpresa: "Su marca en el elemento más mirado del recinto, en cada partido de casa.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-vestuario",
    categoria: "instalaciones",
    tipo: "venue_matches",
    titulo: "Patrocinador del vestuario",
    queEs: "El vestuario se rotula con la marca. Un espacio que nadie vende y que los jugadores ven cada día.",
    queRecibeLaEmpresa: "Presencia en el sitio donde el equipo pasa más tiempo, y en las fotos de antes y después del partido.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-entrada",
    categoria: "instalaciones",
    tipo: "venue_matches",
    titulo: "Entrada y recepción del recinto",
    queEs: "La primera cosa que ve quien entra a ver un partido.",
    queRecibeLaEmpresa: "Su marca en el acceso, por delante de todos los asistentes, propios y visitantes.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-stand",
    categoria: "instalaciones",
    tipo: "events_tournaments",
    titulo: "Puesto de la empresa un día de partido",
    queEs: "La empresa monta una mesa o un pequeño puesto en un partido de casa.",
    queRecibeLaEmpresa: "Hablar en persona con las familias del club, repartir muestras o captar clientes ahí mismo.",
    duracion: "Un partido",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "instalaciones-megafonia",
    categoria: "instalaciones",
    tipo: "venue_matches",
    titulo: "Menciones por megafonía",
    queEs: "El speaker nombra a la empresa en momentos concretos del partido: alineaciones, descanso, final.",
    queRecibeLaEmpresa: "Varias menciones habladas por partido, delante de todo el público presente.",
    duracion: "Toda la temporada",
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
    titulo: "Patrocinador del descanso",
    queEs: "El descanso entero lleva el nombre de una empresa durante toda la temporada, en los partidos en casa de un equipo. El club elige cuál: el primer equipo masculino y el femenino se venden por separado, a dos empresas distintas si quiere.",
    queRecibeLaEmpresa: "Que el speaker abra y cierre cada descanso con su nombre, su marca en lo que se monte durante esos minutos y la mención en la publicación del partido.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-sorteo",
    categoria: "intervalo",
    tipo: "venue_matches",
    titulo: "Sorteo en el descanso",
    queEs: "En el descanso se sortea algo entre el público presente. El premio lo pone la empresa: un vale, una cena, un producto suyo.",
    queRecibeLaEmpresa: "Su producto en manos de un vecino delante de toda la grada, y el nombre repetido por megafonía antes, durante y después del sorteo.",
    duracion: "Un partido",
    periodo: "match",
    colaboracion: "product",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-reto-de-tiro",
    categoria: "intervalo",
    tipo: "venue_matches",
    titulo: "El reto del descanso",
    queEs: "Un espectador sale a la pista en el descanso e intenta un tiro. Si lo mete, la empresa le da el premio; si no, se lleva un detalle igual.",
    queRecibeLaEmpresa: "El momento más comentado del partido con su nombre puesto, y un vídeo corto que la empresa puede publicar en sus propias redes.",
    duracion: "Un partido",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-minipartido-cantera",
    categoria: "intervalo",
    tipo: "youth",
    titulo: "Minipartido de la cantera en el descanso",
    queEs: "Los equipos pequeños del club juegan unos minutos en la pista grande durante el descanso, con sus familias en la grada.",
    queRecibeLaEmpresa: "Su marca en el minipartido y las fotos de los niños jugando en la pista del primer equipo, que son las que más se comparten de todo el club.",
    duracion: "Un partido",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["instalaciones", "cantera"],
  },
  {
    id: "intervalo-degustacion",
    categoria: "intervalo",
    tipo: "venue_matches",
    titulo: "Degustación en el descanso",
    queEs: "Una panadería, una heladería, un bar o cualquier empresa de comida reparte muestras entre el público durante el descanso.",
    queRecibeLaEmpresa: "Que el barrio entero pruebe su producto el mismo día, sin montar una feria ni alquilar un puesto.",
    duracion: "Un partido",
    periodo: "match",
    colaboracion: "product",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-entrega-mvp",
    categoria: "intervalo",
    tipo: "venue_matches",
    titulo: "Entrega del premio al jugador del partido",
    queEs: "Alguien de la empresa baja a la pista y entrega el premio al mejor jugador o jugadora del partido delante del público.",
    queRecibeLaEmpresa: "Salir en persona en la foto del premio, que es la que publica el club, el jugador y muchas veces el periódico local.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-photocall",
    categoria: "intervalo",
    tipo: "venue_matches",
    titulo: "Photocall en el descanso",
    queEs: "Un panel con el escudo del club y la marca de la empresa, montado a pie de pista para que la gente se haga fotos en el descanso.",
    queRecibeLaEmpresa: "Su logo en todas las fotos que el público sube esa tarde, publicadas por ellos mismos y no por el club.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "intervalo-anuncio-en-pista",
    categoria: "intervalo",
    tipo: "venue_matches",
    titulo: "Anuncio en la pista durante el descanso",
    queEs: "Durante los minutos del descanso suena el anuncio de la empresa por megafonía, o se proyecta su vídeo si el pabellón tiene pantalla.",
    queRecibeLaEmpresa: "Un anuncio completo, no una mención suelta, con la grada llena y sin partido que mirar.",
    duracion: "Toda la temporada",
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
    titulo: "Publicaciones semanales con tu marca",
    queEs: "Un número fijo de publicaciones al mes en las que aparece la empresa.",
    queRecibeLaEmpresa: "Presencia repetida ante la comunidad del club, que es gente del barrio y no seguidores comprados.",
    duracion: "Un mes, renovable",
    periodo: "month",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "redes-stories-partido",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Stories durante los partidos",
    queEs: "La empresa acompaña el directo de los partidos: previa, descanso, resultado.",
    queRecibeLaEmpresa: "Aparecer en el momento de más atención de la semana, cuando la gente está pendiente del resultado.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "redes-reel-patrocinado",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Reel patrocinado",
    queEs: "Un vídeo corto hecho por el club en el que la empresa es protagonista.",
    queRecibeLaEmpresa: "Una pieza pensada para su marca, con la gente del club, que también puede publicar ella.",
    duracion: "Una pieza",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "redes-sorteo",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Sorteo conjunto",
    queEs: "El club sortea un producto o servicio de la empresa entre sus seguidores.",
    queRecibeLaEmpresa: "Seguidores nuevos y gente que conoce su negocio, a cambio de un producto en vez de dinero.",
    duracion: "Una semana",
    periodo: "event",
    colaboracion: "product",
    requiere: ["redes"],
  },
  {
    id: "redes-codigo-descuento",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Código de descuento para la comunidad del club",
    queEs: "La empresa da un descuento a socios, familias y seguidores, y el club lo difunde.",
    queRecibeLaEmpresa: "Clientes nuevos que llegan identificados, y una forma de medir si el patrocinio funciona.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    requiere: ["redes"],
  },
  {
    id: "redes-empresa-de-la-semana",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Empresa de la semana",
    queEs: "Cada semana se presenta a un negocio del barrio que apoya al club.",
    queRecibeLaEmpresa: "Una publicación dedicada, contando quién es y a qué se dedica, no solo un logo suelto.",
    duracion: "Una semana",
    periodo: "event",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "redes-entrevista",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Entrevista al dueño o a la plantilla de la empresa",
    queEs: "El club entrevista a quien está detrás del negocio y lo publica como una pieza más.",
    queRecibeLaEmpresa: "Contar su historia ante una comunidad local, que es lo que de verdad hace que la gente entre por la puerta.",
    duracion: "Una pieza",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "redes-encuesta",
    categoria: "redes",
    tipo: "social_content",
    titulo: "Encuesta o juego patrocinado",
    queEs: "Predicciones del resultado, mejor jugador del partido, preguntas a la afición: con una marca detrás.",
    queRecibeLaEmpresa: "Aparecer en el contenido que más participación tiene, que es el que pide opinión.",
    duracion: "Un mes",
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
    titulo: "Patrocinador de la cantera",
    queEs: "Una empresa apoya a toda la base del club: todos los equipos de formación a la vez.",
    queRecibeLaEmpresa: "Su marca en las equipaciones de cantera y en todo lo que se publica de los equipos de formación, que es mucho.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera"],
  },
  {
    id: "cantera-una-categoria",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Patrocinador de una categoría concreta",
    queEs: "Alevín, infantil, cadete: una empresa se queda con un equipo de formación.",
    queRecibeLaEmpresa: "Una opción asequible para un comercio pequeño, con las familias de ese equipo como público directo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera"],
  },
  {
    id: "cantera-empresa-amiga",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Empresa amiga de la cantera",
    queEs: "Una figura pensada para negocios que no pueden poner mucho dinero pero quieren aparecer: varias empresas, aportación pequeña cada una.",
    queRecibeLaEmpresa: "Estar en el cartel de empresas amigas, en la web y en el pabellón, junto a otros negocios del barrio.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera"],
  },
  {
    id: "cantera-material",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Material deportivo para la base",
    queEs: "Balones, petos y conos para los equipos de formación, que es donde más se gasta y menos presupuesto hay.",
    queRecibeLaEmpresa: "Su marca en el material con el que entrenan los niños cada semana.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "product",
    requiere: ["cantera"],
  },
  {
    id: "cantera-jugador-del-mes",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Jugador o jugadora del mes de la cantera",
    queEs: "Un reconocimiento mensual a un chaval de la base, entregado por la empresa.",
    queRecibeLaEmpresa: "Aparecer en el contenido que más comparten las familias, que es el que sale su hijo.",
    duracion: "Un mes, renovable",
    periodo: "month",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },
  {
    id: "cantera-jornada-especial",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Jornada especial de la cantera",
    queEs: "Un día en el que juegan todos los equipos de base, con actividades alrededor.",
    queRecibeLaEmpresa: "Un día entero con todas las familias del club en el mismo sitio y su marca como anfitriona.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },
  {
    id: "cantera-charla-familias",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Charla para familias",
    queEs: "Un profesional da una charla útil a los padres: alimentación, lesiones, descanso, uso del móvil.",
    queRecibeLaEmpresa: "Presentarse como quien sabe de lo suyo delante de las familias, que es mejor que cualquier anuncio.",
    duracion: "Una sesión",
    periodo: "event",
    colaboracion: "service",
    requiere: ["cantera"],
  },
  {
    id: "cantera-escuela",
    categoria: "cantera",
    tipo: "youth",
    titulo: "Patrocinador de la escuela o campus",
    queEs: "La escuela de verano, el campus de Navidad o las actividades de captación en colegios.",
    queRecibeLaEmpresa: "Su marca en una actividad que llega a niños que todavía no son del club, y a sus familias.",
    duracion: "La duración del campus",
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
    titulo: "Jugador o jugadora del mes",
    queEs: "Cada mes se elige al mejor del equipo y el premio lo pone y lo entrega una empresa.",
    queRecibeLaEmpresa: "Su marca asociada al reconocimiento, con foto de entrega y publicación dedicada cada mes.",
    duracion: "Un mes, renovable",
    periodo: "month",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-patrocinado",
    categoria: "jugadores",
    tipo: "social_content",
    titulo: "Jugador patrocinado",
    queEs: "Una empresa apadrina a un jugador o jugadora concretos durante la temporada.",
    queRecibeLaEmpresa: "Aparecer en todo lo que se publique de esa persona, que en un club de barrio es alguien conocido en el pueblo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-visita-a-empresa",
    categoria: "jugadores",
    tipo: "events_tournaments",
    titulo: "Visita del equipo a la empresa",
    queEs: "Los jugadores van a las instalaciones de la empresa: fotos con la plantilla, saludo a los trabajadores, contenido.",
    queRecibeLaEmpresa: "Una mañana distinta para su gente y material propio para sus redes, con el equipo de verdad.",
    duracion: "Una visita",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-visita-al-club",
    categoria: "jugadores",
    tipo: "events_tournaments",
    titulo: "La empresa visita el club",
    queEs: "Los trabajadores de la empresa vienen a un partido o a un entrenamiento, como invitados del club.",
    queRecibeLaEmpresa: "Una actividad para su plantilla que no le cuesta organizar, con acceso a vestuario y foto con el equipo.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-prueba-de-producto",
    categoria: "jugadores",
    tipo: "social_content",
    titulo: "Prueba de producto con el equipo",
    queEs: "El equipo prueba algo de la empresa y cuenta qué tal: bebida, calzado, recuperación, alimentación.",
    queRecibeLaEmpresa: "Opiniones reales de deportistas, grabadas en el club, para usarlas en su publicidad.",
    duracion: "Una acción",
    periodo: "event",
    colaboracion: "product",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-clinic",
    categoria: "jugadores",
    tipo: "events_tournaments",
    titulo: "Clinic o tecnificación patrocinada",
    queEs: "Una sesión técnica abierta, dada por jugadores o entrenadores del club, con una empresa detrás.",
    queRecibeLaEmpresa: "Su marca en una actividad que atrae a chavales de otros clubes de la zona.",
    duracion: "Una sesión",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-embajador",
    categoria: "jugadores",
    tipo: "social_content",
    titulo: "Embajador o embajadora de la marca",
    queEs: "Un jugador del club representa a la empresa durante la temporada, más allá de una acción suelta.",
    queRecibeLaEmpresa: "Una cara conocida del deporte local asociada a su negocio todo el año.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "jugadores-meet-and-greet",
    categoria: "jugadores",
    tipo: "events_tournaments",
    titulo: "Encuentro con la afición en el local de la empresa",
    queEs: "Firma de camisetas, fotos y rato con los aficionados, pero en el bar, la tienda o el local del patrocinador.",
    queRecibeLaEmpresa: "Llevar gente a su propio local, que es lo que de verdad quiere un negocio de barrio.",
    duracion: "Una tarde",
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
    titulo: "Patrocinador del evento",
    queEs: "Presentación de equipos, gala de fin de temporada, cena del club: cualquier acto lleva patrocinador.",
    queRecibeLaEmpresa: "Su marca en el cartel, en el acto y en todo lo que se publique de ese día.",
    duracion: "Un evento",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "eventos-naming",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "El evento lleva el nombre de la empresa",
    queEs: "El acto se llama con el nombre del patrocinador en todas partes.",
    queRecibeLaEmpresa: "Que su nombre se diga cada vez que alguien nombra el evento, antes, durante y después.",
    duracion: "Un evento",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "eventos-photocall",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "Photocall del evento",
    queEs: "El fondo donde todo el mundo se hace la foto, con los logos de quien lo paga.",
    queRecibeLaEmpresa: "Salir en todas las fotos que la gente sube por su cuenta, que son muchas más que las del club.",
    duracion: "Un evento",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "eventos-catering",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "Comida y bebida del evento",
    queEs: "Un bar, un restaurante o un catering pone la comida a cambio de visibilidad.",
    queRecibeLaEmpresa: "Que todos los asistentes prueben lo que hace, que es la mejor publicidad de un negocio de hostelería.",
    duracion: "Un evento",
    periodo: "event",
    colaboracion: "service",
  },
  {
    id: "eventos-sorteo",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "Sorteo o rifa del evento",
    queEs: "La empresa pone el premio del sorteo que se hace durante el acto.",
    queRecibeLaEmpresa: "Su producto en manos de alguien de la comunidad y su nombre repetido en el escenario.",
    duracion: "Un evento",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "eventos-muestras",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "Reparto de muestras",
    queEs: "La empresa reparte producto a los asistentes: bebida, comida, material, vales.",
    queRecibeLaEmpresa: "Que su producto llegue a cientos de personas de su propio barrio en una tarde.",
    duracion: "Un evento",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "eventos-dia-del-club",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "Día del club",
    queEs: "La jornada en la que juegan todos los equipos y viene todo el mundo. El acto más grande del año.",
    queRecibeLaEmpresa: "El día con más gente de toda la temporada, con su marca como anfitriona.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "eventos-transporte",
    categoria: "eventos",
    tipo: "events_tournaments",
    titulo: "Transporte del evento",
    queEs: "Una empresa de transporte pone el autobús para llevar al equipo o a la afición.",
    queRecibeLaEmpresa: "Su marca en el desplazamiento, con el autobús lleno de gente del club y fotos garantizadas.",
    duracion: "Un evento",
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
    titulo: "Patrocinador principal del torneo",
    queEs: "Un torneo propio es lo más fácil de vender que tiene un club: fecha concreta, gente concreta, resultado visible.",
    queRecibeLaEmpresa: "Su nombre en el torneo entero, del cartel al trofeo, y ante clubes y familias de toda la comarca.",
    duracion: "El torneo",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "torneos-trofeos",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Trofeos y medallas",
    queEs: "Una empresa costea los trofeos y aparece en ellos.",
    queRecibeLaEmpresa: "Su marca en un objeto que se queda en la estantería de una casa durante años.",
    duracion: "El torneo",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-mvp",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Premio al mejor jugador del torneo",
    queEs: "El MVP lo entrega la empresa, con su nombre en el premio.",
    queRecibeLaEmpresa: "El momento más fotografiado del torneo, con su representante en la foto.",
    duracion: "El torneo",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-camisetas",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Camisetas del torneo",
    queEs: "Todos los participantes se llevan una camiseta con la marca del patrocinador.",
    queRecibeLaEmpresa: "Cientos de camisetas con su logo repartidas por la comarca, que se siguen usando meses después.",
    duracion: "El torneo",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-avituallamiento",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Agua y avituallamiento",
    queEs: "Bebida y fruta para los participantes durante la jornada.",
    queRecibeLaEmpresa: "Una forma barata de estar presente todo el día y en las manos de todo el mundo.",
    duracion: "El torneo",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "torneos-jornada",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Patrocinador de una jornada o categoría",
    queEs: "No hace falta vender el torneo entero: se puede vender una categoría o un día suelto.",
    queRecibeLaEmpresa: "Entrar en un torneo grande con una aportación pequeña.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "money",
  },
  {
    id: "torneos-zona-empresa",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Zona de empresas en el torneo",
    queEs: "Un espacio con puestos de varios negocios locales durante el torneo.",
    queRecibeLaEmpresa: "Vender o darse a conocer durante todo el día, con público cautivo entre partido y partido.",
    duracion: "El torneo",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "torneos-final",
    categoria: "torneos",
    tipo: "events_tournaments",
    titulo: "Patrocinador de la final",
    queEs: "El partido con más gente y más atención de todo el torneo, vendido aparte.",
    queRecibeLaEmpresa: "El momento cumbre, con la entrega de premios incluida.",
    duracion: "Un partido",
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
    titulo: "Resumen del partido patrocinado",
    queEs: "El vídeo o el texto con lo que pasó en el partido, que el club ya hace cada semana, con una marca detrás.",
    queRecibeLaEmpresa: "Estar en el contenido que más se busca cada fin de semana, sin esfuerzo extra para nadie.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "contenido-fotografia",
    categoria: "contenido",
    tipo: "social_content",
    titulo: "Fotografías de los partidos",
    queEs: "Las fotos de cada jornada llevan una marca de agua o un pie con el patrocinador.",
    queRecibeLaEmpresa: "Aparecer en las fotos que las familias descargan, imprimen y comparten.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "contenido-entrevistas",
    categoria: "contenido",
    tipo: "social_content",
    titulo: "Sección de entrevistas",
    queEs: "Una serie de entrevistas a jugadores, entrenadores o gente del club, con patrocinador fijo.",
    queRecibeLaEmpresa: "Una sección reconocible que lleva su nombre durante toda la temporada.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "contenido-podcast",
    categoria: "contenido",
    tipo: "social_content",
    titulo: "Podcast o programa del club",
    queEs: "Un programa de audio o vídeo sobre el club y su competición.",
    queRecibeLaEmpresa: "Menciones habladas, que duran más y se recuerdan mejor que un logo.",
    duracion: "Por temporada o por programa",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "contenido-reportaje",
    categoria: "contenido",
    tipo: "social_content",
    titulo: "Reportaje sobre la empresa",
    queEs: "Una pieza larga contando quién está detrás del negocio y por qué apoya al club.",
    queRecibeLaEmpresa: "Una historia contada de verdad, que es lo que hace que un vecino elija su tienda y no otra.",
    duracion: "Una pieza",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "contenido-detras-de-camaras",
    categoria: "contenido",
    tipo: "social_content",
    titulo: "Detrás de las cámaras",
    queEs: "Vestuario, viaje, calentamiento: lo que no se ve, que suele ser lo que más engancha.",
    queRecibeLaEmpresa: "Estar en el contenido más cercano del club, el que la gente ve entero.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["equipos", "redes"],
  },
  {
    id: "contenido-cantera",
    categoria: "contenido",
    tipo: "youth",
    titulo: "Contenido de la cantera",
    queEs: "Una sección dedicada a los equipos de formación, que es lo que más comparten las familias.",
    queRecibeLaEmpresa: "El contenido con más difusión real, porque cada padre lo reenvía a su familia entera.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["cantera", "redes"],
  },
  {
    id: "contenido-educativo",
    categoria: "contenido",
    tipo: "social_content",
    titulo: "Contenido educativo con la empresa",
    queEs: "La empresa aporta lo que sabe —un fisio explica un estiramiento, un nutricionista un desayuno— y el club lo publica.",
    queRecibeLaEmpresa: "Demostrar que sabe de lo suyo, que vende mucho más que repetir un logo.",
    duracion: "Por pieza o por temporada",
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
    titulo: "Publicidad en la web del club",
    queEs: "Un espacio fijo en la página del club, visible para quien entra a consultar resultados o horarios.",
    queRecibeLaEmpresa: "Presencia permanente y un enlace directo a su propia web.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
  },
  {
    id: "digital-empresa-recomendada",
    categoria: "digital",
    tipo: "social_content",
    titulo: "Empresa recomendada por el club",
    queEs: "El club recomienda públicamente a la empresa a sus socios y familias.",
    queRecibeLaEmpresa: "Una recomendación con nombre y apellidos, que es lo más valioso que puede dar un club de barrio.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "digital-newsletter",
    categoria: "digital",
    tipo: "social_content",
    titulo: "Patrocinador del boletín del club",
    queEs: "El correo que el club manda a socios y familias lleva un patrocinador fijo.",
    queRecibeLaEmpresa: "Entrar en el buzón de gente que abre ese correo porque le importa, no en una lista comprada.",
    duracion: "Por envío o por temporada",
    periodo: "month",
    colaboracion: "money",
  },
  {
    id: "digital-qr",
    categoria: "digital",
    tipo: "venue_matches",
    titulo: "Código QR con promoción",
    queEs: "Un cartel en el pabellón con un QR que lleva a una oferta de la empresa para la gente del club.",
    queRecibeLaEmpresa: "Poder medir exactamente cuánta gente del club llega hasta su negocio.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "digital-pagina-patrocinada",
    categoria: "digital",
    tipo: "social_content",
    titulo: "Sección de la web patrocinada",
    queEs: "Una parte concreta de la web —resultados, cantera, calendario— lleva el nombre de una empresa.",
    queRecibeLaEmpresa: "Asociarse a lo que la gente consulta de verdad, que suele ser el calendario y los resultados.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "money",
  },
  {
    id: "digital-cartel-fichajes",
    categoria: "digital",
    tipo: "social_content",
    titulo: "Anuncios de fichajes y renovaciones",
    queEs: "Las publicaciones de altas, bajas y renovaciones llevan el logo del patrocinador.",
    queRecibeLaEmpresa: "Aparecer en las publicaciones que más se comparten fuera del club, sobre todo en verano.",
    duracion: "Toda la temporada",
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
    titulo: "Patrocinador del directo",
    queEs: "Si el club retransmite partidos, aunque sea por Instagram o YouTube, eso se vende.",
    queRecibeLaEmpresa: "Su marca durante todo el directo, delante de quien no puede ir al pabellón pero sigue el partido.",
    duracion: "Por partido o por temporada",
    periodo: "season",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "retransmision-logo",
    categoria: "retransmisiones",
    tipo: "social_content",
    titulo: "Logo fijo durante la retransmisión",
    queEs: "Una esquina de la imagen con la marca, presente durante todo el partido.",
    queRecibeLaEmpresa: "Una hora larga de presencia continuada, no un destello de tres segundos.",
    duracion: "Por partido o por temporada",
    periodo: "match",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "retransmision-descanso",
    categoria: "retransmisiones",
    tipo: "social_content",
    titulo: "Publicidad en el descanso",
    queEs: "El hueco del descanso se llena con un anuncio de la empresa.",
    queRecibeLaEmpresa: "Varios minutos para ella sola, con la audiencia ya enganchada esperando la segunda parte.",
    duracion: "Por partido",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "retransmision-mvp",
    categoria: "retransmisiones",
    tipo: "social_content",
    titulo: "Mejor jugador del partido patrocinado",
    queEs: "Al acabar el directo se elige al mejor, con el nombre de la empresa en el premio.",
    queRecibeLaEmpresa: "Un cierre con su marca y una publicación más al día siguiente.",
    duracion: "Por partido o por temporada",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["redes"],
  },
  {
    id: "retransmision-entrevista",
    categoria: "retransmisiones",
    tipo: "social_content",
    titulo: "Entrevista postpartido patrocinada",
    queEs: "La entrevista de después del partido lleva patrocinador, como en la televisión.",
    queRecibeLaEmpresa: "Aparecer en el momento en que la gente se queda a escuchar qué ha pasado.",
    duracion: "Por partido o por temporada",
    periodo: "match",
    colaboracion: "money",
    requiere: ["redes"],
  },
  {
    id: "retransmision-clips",
    categoria: "retransmisiones",
    tipo: "social_content",
    titulo: "Clips y mejores jugadas",
    queEs: "Los recortes del partido que se publican después, con la marca del patrocinador.",
    queRecibeLaEmpresa: "Estar en el contenido que más se reenvía, porque dura veinte segundos y se comparte por WhatsApp.",
    duracion: "Toda la temporada",
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
    titulo: "Descuento para socios y familias",
    queEs: "La empresa hace un precio especial a la gente del club, y el club lo comunica.",
    queRecibeLaEmpresa: "Clientes nuevos de su propio barrio, sin poner dinero: pone margen.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
  },
  {
    id: "familias-carnet",
    categoria: "familias",
    tipo: "social_content",
    titulo: "Ventajas del carnet de socio",
    queEs: "Un grupo de comercios da ventajas a quien enseñe el carnet del club.",
    queRecibeLaEmpresa: "Entrar en un circuito de comercios del barrio con el club como aval.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
  },
  {
    id: "familias-actividad",
    categoria: "familias",
    tipo: "events_tournaments",
    titulo: "Actividad para las familias",
    queEs: "Un taller, una merienda, un día de puertas abiertas para padres, madres y hermanos.",
    queRecibeLaEmpresa: "Un rato largo con las familias, sin prisa y sin competir con un partido.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "familias-regalo-navidad",
    categoria: "familias",
    tipo: "events_tournaments",
    titulo: "Detalle de Navidad o fin de temporada",
    queEs: "Un regalo pequeño para todos los chavales del club, puesto por una empresa.",
    queRecibeLaEmpresa: "Su marca en un detalle que se recuerda, entregado en el momento más emotivo del año.",
    duracion: "Una entrega",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "familias-sorteo-socios",
    categoria: "familias",
    tipo: "social_content",
    titulo: "Sorteo solo para socios",
    queEs: "Un sorteo cerrado a la gente del club, que es también una razón para hacerse socio.",
    queRecibeLaEmpresa: "Aparecer como quien da algo, y ayudar al club a captar socios de paso.",
    duracion: "Una acción",
    periodo: "event",
    colaboracion: "product",
  },
  {
    id: "familias-campana-comercios",
    categoria: "familias",
    tipo: "social_content",
    titulo: "Campaña con los comercios del barrio",
    queEs: "Varios negocios pequeños entran juntos con una aportación asequible cada uno.",
    queRecibeLaEmpresa: "Estar en el cartel de comercios amigos del club, al alcance de un negocio que no puede patrocinar solo.",
    duracion: "Toda la temporada",
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
    titulo: "Patrocinador de la tienda del club",
    queEs: "Una empresa paga la primera tirada de productos del club —gorras, sudaderas, llaveros— y el club los vende y se queda el dinero.",
    queRecibeLaEmpresa: "Su marca junto al escudo en todo lo que el club venda esa temporada, y en el puesto donde se vende los días de partido.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "tienda-personalizado-con-dorsal",
    categoria: "tienda",
    tipo: "equipment",
    titulo: "Productos personalizados con el nombre y el dorsal",
    queEs: "Llaveros, imanes, tazas o abrebotellas con el escudo del club y, detrás, el nombre y el número de camiseta de cada jugador o jugadora.",
    queRecibeLaEmpresa: "Una imprenta o un taller de rotulación local se lleva el encargo, pone su marca en cada pieza y entra en la casa de todas las familias del club.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "tienda-mercadillo-de-equipaciones",
    categoria: "tienda",
    tipo: "events_tournaments",
    titulo: "Mercadillo de equipaciones de otros años",
    queEs: "El club saca a la venta las equipaciones, chándales y mochilas de temporadas anteriores que están haciendo bulto en el almacén, a precio de segunda mano.",
    queRecibeLaEmpresa: "Dar nombre a la jornada del mercadillo, con su marca en el cartel y en el puesto, delante de todas las familias que pasan a probar tallas.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "tienda-venta-a-comision",
    categoria: "tienda",
    tipo: "venue_matches",
    titulo: "Una empresa vende en tus partidos a cambio de comisión",
    queEs: "Una tienda monta su puesto en los partidos de casa y vende sus productos ahí. El club se lleva un porcentaje de lo que venda.",
    queRecibeLaEmpresa: "Un punto de venta con público garantizado cada jornada, sin alquiler y sin abrir un local nuevo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["instalaciones"],
  },
  {
    id: "tienda-prenda-oficial",
    categoria: "tienda",
    tipo: "equipment",
    titulo: "La prenda oficial de la temporada",
    queEs: "Una gorra, una bufanda o una camiseta de aficionado que el club saca cada temporada para que la lleve la gente de la grada, no los jugadores.",
    queRecibeLaEmpresa: "Su logo junto al escudo en una prenda que la gente se pone por gusto y lleva puesta por el barrio todo el año.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "tienda-ropa-de-paseo",
    categoria: "tienda",
    tipo: "equipment",
    titulo: "Ropa de paseo del club",
    queEs: "Chándal, sudadera y mochila con el escudo, para que las familias los compren y los niños los lleven al colegio, no solo a entrenar.",
    queRecibeLaEmpresa: "Su marca en ropa que se lleva a diario fuera del pabellón, que es donde más se ve y donde ningún patrocinio llega.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["equipos"],
  },
  {
    id: "tienda-lote-de-bienvenida",
    categoria: "tienda",
    tipo: "youth",
    titulo: "Lote de bienvenida para los que llegan nuevos",
    queEs: "Cada niño o niña que se apunta al club recibe un lote el primer día: mochila, botella, llavero y el escudo. Lo paga una empresa.",
    queRecibeLaEmpresa: "Ser lo primero que una familia nueva se lleva a casa del club, con su marca en el lote y en la foto del primer día.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
    requiere: ["cantera"],
  },
  {
    id: "tienda-producto-con-el-escudo",
    categoria: "tienda",
    tipo: "in_kind",
    titulo: "Un producto de la empresa con el escudo del club",
    queEs: "La panadería saca el bollo del club, la bodega una etiqueta con el escudo, la heladería un sabor con el nombre del equipo. De cada unidad vendida, una parte va al club.",
    queRecibeLaEmpresa: "Un producto que se vende solo en su barrio porque lleva el escudo de su equipo, y una razón para que el club lo cuente en todas sus redes.",
    duracion: "Una temporada o una campaña",
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
    titulo: "Evento conjunto en el barrio",
    queEs: "Club y empresa organizan algo juntos fuera del pabellón: una calle, una plaza, un centro comercial.",
    queRecibeLaEmpresa: "Salir de su local y que la gente lo asocie al club delante de todo el pueblo.",
    duracion: "Una jornada",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "local-presentacion-producto",
    categoria: "visibilidad-local",
    tipo: "events_tournaments",
    titulo: "Presentación de un producto con el club",
    queEs: "La empresa estrena algo y lo hace con el equipo delante.",
    queRecibeLaEmpresa: "Un acto con caras conocidas del deporte local y cobertura del club.",
    duracion: "Un acto",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "local-escaparate",
    categoria: "visibilidad-local",
    tipo: "social_content",
    titulo: "El club en el escaparate de la empresa",
    queEs: "Camiseta firmada, trofeos, cartel del próximo partido: el club decora el local del patrocinador.",
    queRecibeLaEmpresa: "Un escaparate del que la gente del barrio habla, y una razón para entrar a preguntar.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "mixed",
  },
  {
    id: "local-cupones",
    categoria: "visibilidad-local",
    tipo: "social_content",
    titulo: "Cupones repartidos en los partidos",
    queEs: "Vales de la empresa que se entregan a los asistentes a un partido.",
    queRecibeLaEmpresa: "Gente entrando por su puerta con el vale en la mano, y una cuenta exacta de cuántos.",
    duracion: "Por partido o por temporada",
    periodo: "match",
    colaboracion: "mixed",
    requiere: ["publico"],
  },
  {
    id: "local-accion-solidaria",
    categoria: "visibilidad-local",
    tipo: "events_tournaments",
    titulo: "Acción solidaria conjunta",
    queEs: "Recogida de alimentos, de juguetes o de material, organizada entre el club y la empresa.",
    queRecibeLaEmpresa: "Aparecer haciendo algo que importa, que es de lo poco que un vecino de verdad recuerda.",
    duracion: "Una campaña",
    periodo: "event",
    colaboracion: "mixed",
  },
  {
    id: "local-colegios",
    categoria: "visibilidad-local",
    tipo: "youth",
    titulo: "Actividad en los colegios de la zona",
    queEs: "El club va a los colegios a dar una sesión, con una empresa detrás.",
    queRecibeLaEmpresa: "Llegar a las familias del colegio entero, no solo a las del club.",
    duracion: "Una campaña",
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
    titulo: "Fisioterapeuta para el equipo",
    queEs: "Alguien que atienda las lesiones de la plantilla durante la temporada.",
    queRecibeLaEmpresa: "Visibilidad continua ante deportistas y familias, que es justo su público, y pacientes que llegan solos.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "fisioterapia",
  },
  {
    id: "necesita-medico",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Servicio médico o reconocimientos",
    queEs: "Reconocimientos médicos de temporada o asistencia en los partidos de casa.",
    queRecibeLaEmpresa: "Su marca como servicio médico oficial del club y acceso directo a todas las familias.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "medico",
  },
  {
    id: "necesita-fotografo",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Fotógrafo para los partidos",
    queEs: "Alguien que cubra los partidos de casa y deje al club fotos decentes cada semana.",
    queRecibeLaEmpresa: "Su firma en cada foto que publica el club, que es la publicidad más constante que existe.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "fotografia",
  },
  {
    id: "necesita-video",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Vídeo y edición",
    queEs: "Resúmenes de los partidos, presentación de la temporada, piezas para redes.",
    queRecibeLaEmpresa: "Su marca en todo lo que se mueve del club, y un escaparate de su trabajo en el pueblo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "video",
  },
  {
    id: "necesita-marketing",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Ayuda con las redes del club",
    queEs: "Alguien que eche una mano con las publicaciones y la comunicación.",
    queRecibeLaEmpresa: "Un caso real que enseñar a otros clientes, con resultados medibles.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "marketing",
  },
  {
    id: "necesita-imprenta",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Imprenta y rotulación",
    queEs: "Carteles, lonas, vinilos, dorsales: lo que hace falta imprimir a lo largo del año.",
    queRecibeLaEmpresa: "Su marca en todo lo impreso del club, visto por todo el que pasa por el pabellón.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "imprenta",
  },
  {
    id: "necesita-transporte",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Autobús para los desplazamientos",
    queEs: "Llevar al equipo a los partidos de fuera.",
    queRecibeLaEmpresa: "Su marca en cada viaje, con publicación de salida y llegada en cada desplazamiento.",
    duracion: "Por viaje o por temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "transporte",
  },
  {
    id: "necesita-material",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Material deportivo",
    queEs: "Balones, conos, petos, redes: lo que se gasta cada temporada.",
    queRecibeLaEmpresa: "Su marca en el material con el que se entrena a diario.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "material",
  },
  {
    id: "necesita-equipacion",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Equipaciones",
    queEs: "Camisetas, pantalones y ropa de entrenamiento para uno o varios equipos.",
    queRecibeLaEmpresa: "Ser la marca deportiva del club, con su logo en toda la ropa durante la temporada.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "equipacion",
  },
  {
    id: "necesita-restauracion",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Comida para eventos y desplazamientos",
    queEs: "Bocadillos, catering de la gala, comida del torneo.",
    queRecibeLaEmpresa: "Que cientos de personas prueben lo que hace, que es como se llena un local.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "restauracion",
  },
  {
    id: "necesita-alojamiento",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Alojamiento para torneos y viajes",
    queEs: "Dormir fuera cuando hay torneo o desplazamiento largo.",
    queRecibeLaEmpresa: "Su marca asociada a los viajes del club y ocupación en fechas flojas.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "alojamiento",
  },
  {
    id: "necesita-gimnasio",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Gimnasio o preparación física",
    queEs: "Un sitio donde la plantilla pueda trabajar la fuerza, o alguien que lo dirija.",
    queRecibeLaEmpresa: "Deportistas dentro de sus instalaciones cada semana y sus familias detrás.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "gimnasio",
  },
  {
    id: "necesita-nutricion",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Nutrición",
    queEs: "Orientación de alimentación para la plantilla o charlas para las familias.",
    queRecibeLaEmpresa: "Presentarse como quien sabe, delante de un público que ya le interesa.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "nutricion",
  },
  {
    id: "necesita-asesoria",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Asesoría o gestoría",
    queEs: "Llevar las cuentas, las nóminas o el papeleo del club.",
    queRecibeLaEmpresa: "Ser la gestoría oficial del club, con la recomendación pública que eso lleva.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "asesoria",
  },
  {
    id: "necesita-informatica",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Web e informática",
    queEs: "Mantener la web del club, el correo o los equipos de la oficina.",
    queRecibeLaEmpresa: "Su marca en el pie de la web y un cliente visible en el pueblo.",
    duracion: "Toda la temporada",
    periodo: "season",
    colaboracion: "service",
    esNecesidad: true,
    categoriaNecesidad: "informatica",
  },
  {
    id: "necesita-limpieza",
    categoria: "servicios",
    tipo: "in_kind",
    titulo: "Limpieza de las instalaciones",
    queEs: "Mantener limpios vestuarios y zonas comunes.",
    queRecibeLaEmpresa: "Un contrato visible en la comunidad y su marca en las instalaciones.",
    duracion: "Toda la temporada",
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

const QUE_FALTA: Record<RequisitoIdea, string> = {
  equipos: "añade tus equipos a la ficha",
  cantera: "añade los datos de tu cantera",
  instalaciones: "cuenta dónde jugáis",
  redes: "añade tus redes sociales",
  publico: "apunta el público de algún partido",
};

export function textoDeLoQueFalta(requisitos: RequisitoIdea[]): string {
  return requisitos.map((requisito) => QUE_FALTA[requisito]).join(" y ");
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
export function descripcionDeLaIdea(idea: Idea): string {
  return `${idea.queEs}\n\nQué recibe la empresa: ${idea.queRecibeLaEmpresa}`;
}

/** Cuántas ideas tiene el catálogo, para poder decirlo sin mentir. */
export const TOTAL_DE_IDEAS = IDEAS.length;
