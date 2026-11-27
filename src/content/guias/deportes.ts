import type { Bloque, Guia } from "@/lib/guias/tipos";

/**
 * Guías de patrocinio por deporte (pedido por Rafael el 28/11/2026).
 *
 * Son para los CLUBES que buscan en Google «patrocinio para un club de
 * rugby» y parecidos. Las páginas de /patrocinar son para las empresas y
 * solo existen donde hay clubes; estas existen siempre.
 *
 * La estructura es común, pero el texto de cada deporte es suyo: las
 * ideas, las empresas, el calendario y las preguntas cambian de verdad de
 * un deporte a otro. Si se copiara el mismo texto cambiando el nombre del
 * deporte, Google las trataría como duplicadas y no serviría de nada.
 *
 * Nada de cifras inventadas ni de precios: cada club decide los suyos.
 */

type DatosDeporte = {
  clave: string;
  slug: string;
  nombre: string; // "fútbol"
  deUnClub: string; // "un club de fútbol"
  titulo: string;
  tituloSeo: string;
  descripcion: string;
  entradilla: string;
  portadaAlt: string;
  resumen: string[];
  valor: string;
  valorTarjetas: { icono: string; titulo: string; texto: string }[];
  ideas: { icono: string; titulo: string; texto: string }[];
  empresas: string[][];
  calendario: string;
  consejoCalendario: { titulo: string; texto: string };
  errorTipico: { titulo: string; texto: string };
  preguntas: { pregunta: string; respuesta: string }[];
};

const GUIA_GENERAL = "/guias/como-conseguir-patrocinadores-para-un-club-deportivo";

function guiaDeDeporte(d: DatosDeporte): Guia {
  const cuerpo: Bloque[] = [
    { tipo: "apartado", id: "por-que", antetitulo: "Lo que ya tenéis", titulo: `Por qué ${d.deUnClub} interesa a una empresa` },
    { tipo: "parrafo", texto: d.valor },
    { tipo: "tarjetas", elementos: d.valorTarjetas },
    { tipo: "apartado", id: "ideas", antetitulo: "Qué ofrecer", titulo: `Ideas de patrocinio para ${d.deUnClub}` },
    {
      tipo: "parrafo",
      texto:
        "Una empresa no dice que sí a «colaborar con el club»: dice que sí a algo concreto que se puede imaginar. Estas son algunas propuestas que encajan especialmente con vuestro deporte. Elige las que tengan sentido para tu club y ponles tú las condiciones.",
    },
    { tipo: "tarjetas", elementos: d.ideas },
    {
      tipo: "parrafo",
      texto: `En [ApoyaClub](/para-clubes) tienes más de 100 ideas de patrocinio, y las de ${d.nombre} te salen primero. Pulsas un botón, revisas las que te proponemos con los datos de tu club y las publicas en tu página.`,
    },
    { tipo: "apartado", id: "empresas", antetitulo: "A quién pedir", titulo: "A qué empresas pedírselo" },
    {
      tipo: "parrafo",
      texto:
        "Los primeros «sí» casi nunca llegan de las grandes marcas. Llegan de las familias del club y de los negocios que ya ven pasar a vuestra gente cada semana. Empieza por ahí y ve ampliando:",
    },
    { tipo: "tabla", filas: d.empresas, nota: "Cada empresa elige la propuesta que le encaja: una pequeña para empezar o el patrocinio principal. Cuantas más opciones de distinto tamaño tengas, más fácil." },
    { tipo: "apartado", id: "cuando", antetitulo: "Calendario", titulo: "Cuándo pedirlo" },
    { tipo: "parrafo", texto: d.calendario },
    { tipo: "consejo", titulo: d.consejoCalendario.titulo, texto: d.consejoCalendario.texto },
    { tipo: "apartado", id: "como-pedirlo", antetitulo: "Paso a paso", titulo: "Cómo pedirlo para que te digan que sí" },
    {
      tipo: "lista",
      numerada: true,
      elementos: [
        "**Apunta tus datos reales:** equipos, jugadores, familias, partidos en casa y seguidores en redes. Sin redondear hacia arriba.",
        "**Prepara un dossier distinto para cada empresa,** con las propuestas que le encajan a ella y fotos de verdad del club.",
        "**Pide en persona o por teléfono,** y deja la propuesta por escrito para que la lea con calma quien decide.",
        "**Cumple lo prometido y enséñaselo:** guarda fotos y enlaces de cada cosa y mándale un resumen al final de la temporada. Es lo que hace que repita.",
      ],
    },
    { tipo: "error", titulo: d.errorTipico.titulo, texto: d.errorTipico.texto },
    {
      tipo: "parrafo",
      texto: `Si quieres el proceso completo, con modelos de correo y el dossier explicado paso a paso, lo tienes en la [guía para conseguir patrocinadores](${GUIA_GENERAL}).`,
    },
    {
      tipo: "llamada",
      titulo: `Prepara los patrocinios de tu club de ${d.nombre} con ApoyaClub`,
      texto:
        "Tu página de club, las ideas de patrocinio, un dossier para cada empresa y el seguimiento de lo que prometes, en un solo sitio. Los primeros clubes tienen 6 meses gratis.",
    },
    { tipo: "apartado", id: "ejemplo", antetitulo: "Antes de empezar", titulo: "Así se vería la página de tu club" },
    {
      tipo: "parrafo",
      texto: `Hemos preparado una [página de ejemplo de ${d.deUnClub}](/ejemplo/${d.clave}) con datos inventados, para que veas lo que vería una empresa: equipos, cantera, instalaciones, oportunidades de patrocinio y el botón para escribiros. La de tu club tendría vuestro escudo, vuestras fotos y vuestros datos.`,
    },
  ];

  return {
    slug: d.slug,
    categoria: "clubes",
    titulo: d.titulo,
    tituloSeo: d.tituloSeo,
    descripcion: d.descripcion,
    entradilla: d.entradilla,
    portada: `/guias/patrocinio-${d.clave}.webp`,
    portadaAlt: d.portadaAlt,
    publicada: "2026-11-28",
    actualizada: "2026-11-28",
    resumen: d.resumen,
    cuerpo,
    preguntas: [
      ...d.preguntas,
      {
        pregunta: "¿Hace falta ser un club grande para tener patrocinadores?",
        respuesta:
          "No. Para un negocio de barrio, un club pequeño es valioso porque reúne cada semana a las familias de su zona. Lo importante es empezar por las empresas cercanas y ofrecer cosas concretas, no el tamaño del club.",
      },
    ],
    relacionadas: [
      "como-conseguir-patrocinadores-para-un-club-deportivo",
      "ideas-de-patrocinio-para-clubes-deportivos",
      "como-hacer-un-dossier-de-patrocinio-deportivo",
    ],
  };
}

export const patrocinioFutbol = guiaDeDeporte({
  clave: "futbol",
  slug: "patrocinio-para-clubes-de-futbol",
  nombre: "fútbol",
  deUnClub: "un club de fútbol",
  titulo: "Patrocinio para clubes de fútbol: ideas y cómo conseguirlo",
  tituloSeo: "Patrocinio para clubes de fútbol: ideas y cómo conseguirlo",
  descripcion:
    "Qué puede ofrecer un club de fútbol a una empresa, a qué negocios pedir patrocinio, cuándo hacerlo y cómo conseguir que el patrocinador repita.",
  entradilla:
    "El fútbol es el deporte con más clubes y más familias detrás, y también el que más compite por los mismos patrocinadores. La diferencia la marca el club que ofrece algo concreto y lo cumple.",
  portadaAlt: "Jugadores juveniles de fútbol disputando el balón en un campo de tierra",
  resumen: [
    "Un club de fútbol reúne cada fin de semana a muchas familias de su zona: eso es lo que busca un negocio local.",
    "Además de la camiseta, hay mucho más que ofrecer: el banquillo, las vallas del campo, el torneo de verano, el campus o las redes del club.",
    "Empieza por las familias del club y los negocios del barrio, y prepara una propuesta distinta para cada empresa.",
    "Como hay muchos clubes pidiendo, lo que te diferencia es cumplir lo prometido y enseñárselo al patrocinador al acabar la temporada.",
  ],
  valor:
    "En pocos deportes se mueve tanta gente cada fin de semana como en el fútbol base: varios equipos por club, partidos en casa casi cada sábado y familias que pasan horas en la grada. Para un negocio de la zona, eso es **visibilidad repetida ante las mismas personas** durante toda la temporada. Y como casi todo el mundo sigue el fútbol, cualquier empresa entiende enseguida lo que significa poner su nombre en el club.",
  valorTarjetas: [
    { icono: "⚽", titulo: "Muchos equipos", texto: "De prebenjamín a aficionado: cada equipo es una oportunidad distinta para una empresa." },
    { icono: "👨‍👩‍👧", titulo: "Grada fija", texto: "Las mismas familias, semana tras semana, en el campo del barrio." },
    { icono: "📱", titulo: "Redes muy activas", texto: "Resultados, goles y fotos que las familias comparten cada domingo." },
  ],
  ideas: [
    { icono: "👕", titulo: "La equipación de un equipo", texto: "No solo la del primer equipo: cada categoría puede tener su patrocinador." },
    { icono: "🧱", titulo: "Las vallas del campo", texto: "Una lona fija que ve todo el que entra al campo durante la temporada." },
    { icono: "🪑", titulo: "Los banquillos", texto: "El banquillo con el nombre de la empresa sale en casi todas las fotos." },
    { icono: "🏆", titulo: "El torneo de verano o de Navidad", texto: "Un evento con nombre propio y muchas familias de fuera del club." },
    { icono: "⛺", titulo: "El campus", texto: "Una semana de verano con camisetas, fotos y padres que lo recuerdan todo el año." },
    { icono: "🎥", titulo: "El gol de la jornada", texto: "Una publicación semanal en redes, de la mano de un negocio." },
  ],
  empresas: [
    ["Tipo de empresa", "Qué le puede interesar", "Por qué encaja"],
    ["Bares y restaurantes cerca del campo", "Vallas, redes, el tercer tiempo de las familias", "Las familias ya van antes o después del partido"],
    ["Tiendas de deporte", "Equipación, campus", "Su cliente está en vuestra grada"],
    ["Fisioterapia y clínicas", "Cantera, patrocinio en especie", "Lesiones y prevención: tema de todas las familias"],
    ["Talleres y concesionarios", "Vallas, banquillos", "Visibilidad local toda la temporada"],
    ["Academias y autoescuelas", "Equipos juveniles", "Llegan a los jóvenes y a sus padres"],
  ],
  calendario:
    "La temporada de fútbol base va de septiembre a junio. El mejor momento para cerrar la equipación y las vallas es **antes del verano o en pretemporada**, cuando las empresas deciden dónde invierten y el club encarga las camisetas. A mitad de temporada funcionan mejor las propuestas con fecha: el torneo de Navidad, el de Semana Santa o el campus.",
  consejoCalendario: {
    titulo: "Pide la equipación antes de encargarla",
    texto:
      "Si la empresa dice que sí cuando las camisetas ya están hechas, tendrá que esperar a la temporada siguiente. Ten las propuestas listas en mayo o junio.",
  },
  errorTipico: {
    titulo: "El error típico: ofrecer solo la camiseta del primer equipo",
    texto:
      "Es lo más caro y lo que más empresas rechazan. Ofrece también cosas pequeñas y de cantera: muchos negocios prefieren empezar con algo modesto y subir al año siguiente.",
  },
  preguntas: [
    {
      pregunta: "¿Qué puede ofrecer un club de fútbol base a un patrocinador?",
      respuesta:
        "La equipación de cada equipo, vallas o lonas en el campo, los banquillos, torneos y campus, publicaciones en redes y presencia en la fiesta de fin de temporada. Cada cosa puede ser una propuesta distinta para una empresa distinta.",
    },
    {
      pregunta: "¿Cada equipo del club puede tener su propio patrocinador?",
      respuesta:
        "Sí, y suele funcionar muy bien: el negocio de la madre de un jugador del alevín patrocina al alevín. Así el club suma varios patrocinadores pequeños en lugar de depender de uno solo.",
    },
    {
      pregunta: "¿Cómo destaco si hay muchos clubes de fútbol pidiendo en mi zona?",
      respuesta:
        "Con propuestas concretas, datos reales y cumpliendo lo prometido. Un dossier a medida para cada empresa y un informe al final de la temporada te diferencian de los clubes que solo mandan un correo pidiendo ayuda.",
    },
  ],
});

export const patrocinioBaloncesto = guiaDeDeporte({
  clave: "baloncesto",
  slug: "patrocinio-para-clubes-de-baloncesto",
  nombre: "baloncesto",
  deUnClub: "un club de baloncesto",
  titulo: "Patrocinio para clubes de baloncesto: ideas y cómo conseguirlo",
  tituloSeo: "Patrocinio para clubes de baloncesto: ideas y cómo conseguirlo",
  descripcion:
    "Ideas de patrocinio para un club de baloncesto: pista, equipaciones, tiempos muertos y campus. A qué empresas pedírselo, cuándo y cómo hacerlo bien.",
  entradilla:
    "Un pabellón de baloncesto es un escaparate cerrado y cercano: el público está a pocos metros de la pista y lo ve todo. Eso, bien contado, es justo lo que busca un negocio de tu ciudad.",
  portadaAlt: "Un jugador de baloncesto lanzando a canasta en un pabellón, junto a una canasta vista desde abajo",
  resumen: [
    "En baloncesto el público está muy cerca de la pista: cada lona, cada camiseta y cada mención por megafonía se ve.",
    "Además de la equipación, puedes ofrecer los tiempos muertos, el marcador, el concurso de triples del descanso o el campus de verano.",
    "Empieza por las familias del club y los negocios cercanos al pabellón, con una propuesta distinta para cada uno.",
    "Lo que hace que el patrocinador repita es ver lo que ha recibido: guarda las pruebas y mándale un resumen al final.",
  ],
  valor:
    "El baloncesto se juega en pabellón, con el público a pocos metros y partidos en casa durante toda la temporada. Todo lo que hay en la pista **se ve de cerca** y sale en las fotos y vídeos que comparten las familias. Además, muchos clubes tienen equipos femeninos y masculinos en casi todas las categorías: es un mensaje de deporte y de igualdad que a muchas empresas les gusta firmar.",
  valorTarjetas: [
    { icono: "🏀", titulo: "Pista cercana", texto: "El público ve cada detalle: lonas, banquillo, camisetas y marcador." },
    { icono: "⚖️", titulo: "Chicos y chicas", texto: "Equipos femeninos y masculinos: un mensaje que muchas marcas quieren apoyar." },
    { icono: "🎥", titulo: "Jugadas que se comparten", texto: "Un triple o un mate en vídeo corre por los grupos de WhatsApp en minutos." },
  ],
  ideas: [
    { icono: "👕", titulo: "La equipación de un equipo", texto: "Camiseta, pantalón o sudadera de calentamiento, por categorías." },
    { icono: "⏱️", titulo: "Los tiempos muertos", texto: "Cada tiempo muerto, una mención por megafonía de la empresa." },
    { icono: "🎯", titulo: "El concurso de triples", texto: "En el descanso, con premio del negocio que lo patrocina." },
    { icono: "🧱", titulo: "Lonas en el pabellón", texto: "Detrás de las canastas o en la grada: se ven en todas las fotos." },
    { icono: "⛺", titulo: "El campus de verano", texto: "Una semana con niños y niñas de toda la ciudad." },
    { icono: "⭐", titulo: "La jugadora o el jugador del mes", texto: "Una publicación mensual en redes, con el logo de la empresa." },
  ],
  empresas: [
    ["Tipo de empresa", "Qué le puede interesar", "Por qué encaja"],
    ["Ópticas y clínicas", "Cantera femenina, tiempos muertos", "Salud y deporte base: encaja con su imagen"],
    ["Tiendas de deporte y zapatillas", "Equipación, campus", "Su cliente juega en vuestra pista"],
    ["Bares y heladerías cercanos", "Concurso de triples, redes", "Las familias van antes o después del partido"],
    ["Academias de idiomas y estudios", "Equipos juveniles", "Llegan a los jóvenes y a sus padres"],
    ["Inmobiliarias y aseguradoras", "Lonas del pabellón", "Visibilidad toda la temporada ante familias"],
  ],
  calendario:
    "La temporada va de septiembre a mayo o junio. Las equipaciones y las lonas se deciden **en verano y en pretemporada**. Durante el curso funcionan bien los eventos con fecha: el torneo de Navidad, el 3x3 de primavera y, sobre todo, el campus de verano, que conviene ofrecer en marzo o abril.",
  consejoCalendario: {
    titulo: "Aprovecha el 3x3 y los torneos al aire libre",
    texto:
      "Un torneo 3x3 en una plaza o un parque atrae a gente que no va al pabellón. Para un comercio de la zona es un evento muy visible y fácil de patrocinar.",
  },
  errorTipico: {
    titulo: "El error típico: olvidar a los equipos femeninos",
    texto:
      "Muchas empresas buscan precisamente apoyar el deporte femenino. Si tu club tiene equipos de chicas, preséntalos como una propuesta propia, no como un añadido.",
  },
  preguntas: [
    {
      pregunta: "¿Qué espacios publicitarios tiene un pabellón de baloncesto?",
      respuesta:
        "Las lonas detrás de las canastas y en la grada, el banquillo, la mesa de anotadores y el marcador si el club puede usarlo. Antes de ofrecerlos, comprueba con el ayuntamiento o el dueño del pabellón qué se puede poner.",
    },
    {
      pregunta: "¿Se puede patrocinar solo un equipo de cantera?",
      respuesta:
        "Sí. Muchas empresas prefieren patrocinar un equipo concreto, por ejemplo el infantil femenino, porque es más cercano y más fácil de contar que el patrocinio de todo el club.",
    },
    {
      pregunta: "¿Qué evento de baloncesto atrae más a los patrocinadores?",
      respuesta:
        "El campus de verano y los torneos con nombre propio, como uno de Navidad o un 3x3 al aire libre. Tienen fecha, reúnen a muchas familias y la empresa sabe exactamente qué recibe.",
    },
  ],
});

export const patrocinioBalonmano = guiaDeDeporte({
  clave: "balonmano",
  slug: "patrocinio-para-clubes-de-balonmano",
  nombre: "balonmano",
  deUnClub: "un club de balonmano",
  titulo: "Patrocinio para clubes de balonmano: ideas y cómo conseguirlo",
  tituloSeo: "Patrocinio para clubes de balonmano: ideas y cómo conseguirlo",
  descripcion:
    "Cómo conseguir patrocinio para un club de balonmano: qué ofrecer en el pabellón y en redes, a qué empresas escribir y cómo lograr que renueven.",
  entradilla:
    "El balonmano tiene una afición fiel y muy de pueblo o de barrio: familias que llevan años en la grada y negocios que conocen el club. Ese vínculo es lo que más valora una empresa local.",
  portadaAlt: "Un jugador de balonmano saltando para lanzar y una jugadora de cantera con el balón en un pabellón",
  resumen: [
    "La afición del balonmano es fiel y muy local: para un negocio de la zona es un público ideal.",
    "Puedes ofrecer la equipación, las lonas del pabellón, el patrocinio de los desplazamientos, el torneo de base o las redes del club.",
    "Empieza por las familias del club y los comercios de tu localidad, con propuestas pequeñas y grandes.",
    "Cumple lo prometido y enséñaselo al final de la temporada: es lo que hace que el patrocinador repita.",
  ],
  valor:
    "En muchas ciudades y pueblos, el club de balonmano es **una seña de identidad**: familias que llevan años en la grada, exjugadores que ahora entrenan a sus hijos y negocios de toda la vida que conocen a la directiva. Los partidos se juegan en pabellón, con el público muy cerca, y las ligas obligan a viajar. Todo eso son oportunidades para que una empresa local se haga ver y quede como la que apoya al club del pueblo.",
  valorTarjetas: [
    { icono: "🤾", titulo: "Afición fiel", texto: "Las mismas familias, temporada tras temporada, en el mismo pabellón." },
    { icono: "🏘️", titulo: "Muy local", texto: "El club es parte del pueblo o del barrio, y sus negocios lo saben." },
    { icono: "🚌", titulo: "Viajes por la liga", texto: "Cada desplazamiento es una ocasión para llevar el nombre de la empresa." },
  ],
  ideas: [
    { icono: "👕", titulo: "La equipación", texto: "Del primer equipo o de cada categoría de cantera, por separado." },
    { icono: "🧱", titulo: "Lonas en el pabellón", texto: "Detrás de las porterías: salen en casi cada foto de un gol." },
    { icono: "🚌", titulo: "Los desplazamientos", texto: "Una empresa que pone el autobús, o que lo patrocina, y sale en la foto de la salida." },
    { icono: "🏆", titulo: "El torneo de base", texto: "Un torneo con nombre propio, con equipos de otras localidades." },
    { icono: "🎙️", titulo: "El partido patrocinado", texto: "Un partido en casa con el nombre de una empresa: megafonía, saque de honor y redes." },
    { icono: "⛺", titulo: "El campus o la escuela de verano", texto: "Niños y niñas de toda la comarca durante una semana." },
  ],
  empresas: [
    ["Tipo de empresa", "Qué le puede interesar", "Por qué encaja"],
    ["Negocios de toda la vida del pueblo", "Equipación, partido patrocinado", "Quieren seguir siendo «los de aquí»"],
    ["Empresas de transporte y autobuses", "Desplazamientos", "Patrocinio en especie fácil de cuantificar"],
    ["Fisioterapia y clínicas deportivas", "Cantera, patrocinio en especie", "El balonmano es deporte de contacto"],
    ["Bares y restaurantes", "Redes, el partido de la jornada", "La afición se reúne antes y después"],
    ["Constructoras e industrias locales", "Lonas, primer equipo", "Imagen de empresa comprometida con su localidad"],
  ],
  calendario:
    "La temporada de balonmano va de septiembre a mayo. Las equipaciones y las lonas se cierran **en verano y en pretemporada**. Los desplazamientos largos y las fases de ascenso son buenos momentos para propuestas puntuales, igual que los torneos de base de Navidad y de final de temporada.",
  consejoCalendario: {
    titulo: "Las fases de ascenso venden solas",
    texto:
      "Si un equipo se juega el ascenso, ofrécelo a una empresa como patrocinio especial para esos partidos. Es un momento con mucha atención y con fecha cerrada.",
  },
  errorTipico: {
    titulo: "El error típico: dar por hecho que el patrocinador de siempre seguirá",
    texto:
      "Muchos clubes de balonmano viven de dos o tres patrocinadores fieles. Si un año fallan, el club se queda sin nada. Cuídalos con un resumen de lo que recibieron y busca a la vez patrocinadores nuevos y más pequeños.",
  },
  preguntas: [
    {
      pregunta: "¿Qué puede ofrecer un club de balonmano modesto a una empresa?",
      respuesta:
        "Visibilidad ante una afición fiel y local: equipaciones, lonas en el pabellón, menciones en los partidos, publicaciones en redes y presencia en torneos y campus. Para un negocio de la zona, eso vale mucho aunque el club no esté en una categoría alta.",
    },
    {
      pregunta: "¿Se pueden patrocinar los desplazamientos de un equipo?",
      respuesta:
        "Sí, y es una propuesta muy clara: la empresa pone o paga el autobús de algunos viajes y aparece en la foto de la salida y en las redes del club. También puede ser patrocinio en especie, si la empresa es de transporte.",
    },
    {
      pregunta: "¿Cómo consigo que un patrocinador de balonmano renueve?",
      respuesta:
        "Apunta todo lo que le prometiste, guarda fotos y enlaces de cada cosa cumplida y mándale un resumen al final de la temporada, antes de pedirle la renovación.",
    },
  ],
});

export const patrocinioVoleibol = guiaDeDeporte({
  clave: "voleibol",
  slug: "patrocinio-para-clubes-de-voleibol",
  nombre: "voleibol",
  deUnClub: "un club de voleibol",
  titulo: "Patrocinio para clubes de voleibol: ideas y cómo conseguirlo",
  tituloSeo: "Patrocinio para clubes de voleibol: ideas y cómo conseguirlo",
  descripcion:
    "Ideas de patrocinio para un club de voleibol, en pista y en vóley playa. Qué ofrecer, a qué empresas escribir, cuándo hacerlo y cómo conseguir que repitan.",
  entradilla:
    "El voleibol tiene algo que pocos deportes tienen: una temporada en pabellón y otra en la playa. Dos escaparates distintos para una misma empresa, con muchísima cantera, sobre todo femenina.",
  portadaAlt: "Dos jugadoras de voleibol saltando a bloquear en la red, junto a un balón de voleibol en la pista",
  resumen: [
    "El voleibol tiene mucha cantera, sobre todo femenina, y dos temporadas: pista en invierno y playa en verano.",
    "Puedes ofrecer la equipación, la red y los postes, los torneos de vóley playa, el campus y las redes del club.",
    "Encaja con negocios que buscan familias jóvenes y con los que quieren apoyar el deporte femenino.",
    "Cumple lo prometido y enséñaselo al final: así el patrocinador de invierno vuelve en verano.",
  ],
  valor:
    "En muchos clubes de voleibol la mayoría de las jugadoras son chicas, desde benjamines hasta sénior. Para una empresa, eso es un mensaje claro de **deporte, igualdad y formación**, que muchas marcas quieren firmar. Además, el voleibol tiene dos temporadas: la de pista, en pabellón, de otoño a primavera, y la de **vóley playa** en verano, al aire libre y con público de paso. Son dos escaparates para el mismo patrocinador.",
  valorTarjetas: [
    { icono: "🏐", titulo: "Mucha cantera", texto: "Equipos en casi todas las categorías, con muchas familias detrás." },
    { icono: "⚖️", titulo: "Deporte femenino", texto: "Un mensaje de igualdad que muchas empresas quieren apoyar." },
    { icono: "🏖️", titulo: "Pista y playa", texto: "Invierno en pabellón y verano en la arena: visibilidad todo el año." },
  ],
  ideas: [
    { icono: "👕", titulo: "La equipación de un equipo", texto: "Cada categoría puede tener su propio patrocinador." },
    { icono: "🥅", titulo: "La red y los postes", texto: "El logo en las protecciones de los postes se ve en cada jugada." },
    { icono: "🏖️", titulo: "El torneo de vóley playa", texto: "Un evento de verano, al aire libre, con mucha gente de paso." },
    { icono: "⛺", titulo: "El campus de verano", texto: "Una semana con niños y niñas de toda la comarca." },
    { icono: "🚌", titulo: "Los viajes a campeonatos", texto: "Cuando la cantera viaja a un campeonato de España, alguien tiene que llevarla." },
    { icono: "📱", titulo: "Las redes del club", texto: "Resúmenes y fotos de cada jornada, de la mano de una empresa." },
  ],
  empresas: [
    ["Tipo de empresa", "Qué le puede interesar", "Por qué encaja"],
    ["Clínicas, ópticas y farmacias", "Cantera femenina, redes", "Salud y deporte base: encaja con su imagen"],
    ["Heladerías, chiringuitos y hostelería", "Vóley playa", "Su temporada fuerte coincide con la del torneo"],
    ["Tiendas de deporte", "Equipación, campus", "Su cliente está en el club"],
    ["Academias y centros de estudio", "Equipos juveniles", "Llegan a las jugadoras y a sus familias"],
    ["Agencias de viajes y transporte", "Viajes a campeonatos", "Patrocinio en especie fácil de contar"],
  ],
  calendario:
    "La temporada de pista va de septiembre a mayo, y las equipaciones se cierran **en verano**. El vóley playa se prepara **en primavera**: es el momento de ofrecer el torneo de verano a la hostelería de la zona, que decide entonces su temporada. Los campeonatos de España de base, en primavera y verano, son otra buena ocasión.",
  consejoCalendario: {
    titulo: "Ofrece un paquete de todo el año",
    texto:
      "Una misma empresa puede patrocinar un equipo en invierno y el torneo de playa en verano. Para ella es más visibilidad, y para el club, un patrocinador para doce meses.",
  },
  errorTipico: {
    titulo: "El error típico: ofrecer el vóley playa demasiado tarde",
    texto:
      "Si llamas a un chiringuito en julio, ya tiene la temporada planificada. Ten el torneo de verano preparado y ofrécelo en marzo o abril.",
  },
  preguntas: [
    {
      pregunta: "¿Qué puede ofrecer un club de voleibol a un patrocinador?",
      respuesta:
        "Equipaciones por categorías, la red y los postes, lonas en el pabellón, torneos de vóley playa, el campus de verano, los viajes a campeonatos y las redes del club.",
    },
    {
      pregunta: "¿El vóley playa interesa a los patrocinadores?",
      respuesta:
        "Sí, sobre todo a la hostelería y los comercios de costa o de zonas con playa o arena: es un evento de verano, al aire libre y con público que pasa por allí aunque no conozca el club.",
    },
    {
      pregunta: "¿Cómo presento la cantera femenina a una empresa?",
      respuesta:
        "Como una propuesta propia: cuántas jugadoras tiene el club, en qué categorías y qué consigue. Muchas empresas buscan precisamente apoyar el deporte femenino y lo valoran más que una camiseta genérica.",
    },
  ],
});

export const patrocinioRugby = guiaDeDeporte({
  clave: "rugby",
  slug: "patrocinio-para-clubes-de-rugby",
  nombre: "rugby",
  deUnClub: "un club de rugby",
  titulo: "Patrocinio para clubes de rugby: ideas y cómo conseguirlo",
  tituloSeo: "Patrocinio para clubes de rugby: ideas y cómo conseguirlo",
  descripcion:
    "Ideas de patrocinio para un club de rugby: el tercer tiempo, la equipación, la escuela y los valores. A qué empresas pedírselo y cómo conseguir que repitan.",
  entradilla:
    "El rugby tiene algo que las empresas valoran mucho: unos valores muy reconocibles y una comunidad muy unida. El tercer tiempo, la escuela y el compañerismo son tu mejor carta de presentación.",
  portadaAlt: "Un saque de banda de rugby de noche y jugadores de cantera disputando un placaje",
  resumen: [
    "El rugby transmite valores muy claros, como el respeto, el compañerismo y el esfuerzo, y muchas empresas quieren asociarse a ellos.",
    "Además de la camiseta, el rugby tiene propuestas únicas: el tercer tiempo, la escuela de rugby, la melé o el torneo de seven.",
    "Encaja con empresas que buscan transmitir trabajo en equipo, también ante sus propios empleados.",
    "La comunidad del rugby es muy unida: empieza por las familias y los exjugadores, que suelen tener negocio o contactos.",
  ],
  valor:
    "Pocos deportes tienen una imagen tan clara como el rugby: **respeto al rival y al árbitro, compañerismo y esfuerzo**. Es una imagen que muchas empresas quieren para su marca, y también para sus empleados. Además, los clubes de rugby suelen ser comunidades muy unidas, con exjugadores, familias y veteranos que siguen ligados al club durante años, y con un tercer tiempo que reúne a los dos equipos después de cada partido.",
  valorTarjetas: [
    { icono: "🏉", titulo: "Valores reconocibles", texto: "Respeto, compañerismo y esfuerzo: lo que muchas marcas quieren transmitir." },
    { icono: "🤝", titulo: "Comunidad unida", texto: "Familias, veteranos y exjugadores que siguen en el club durante años." },
    { icono: "🍻", titulo: "El tercer tiempo", texto: "Después de cada partido, los dos equipos y sus familias juntos." },
  ],
  ideas: [
    { icono: "🍻", titulo: "El tercer tiempo", texto: "La comida o el picoteo de después del partido, patrocinado por un bar o restaurante." },
    { icono: "👕", titulo: "La equipación", texto: "La camiseta de rugby tiene mucho espacio y se ve muy bien en las fotos." },
    { icono: "🧒", titulo: "La escuela de rugby", texto: "Los más pequeños, una propuesta muy atractiva para negocios familiares." },
    { icono: "⚡", titulo: "El torneo de seven", texto: "Un torneo rápido, de un día, con muchos equipos y ambiente de fiesta." },
    { icono: "🏢", titulo: "Rugby para empresas", texto: "Una sesión de trabajo en equipo para los empleados del patrocinador." },
    { icono: "📱", titulo: "El ensayo de la jornada", texto: "Una publicación semanal en redes con el logo de la empresa." },
  ],
  empresas: [
    ["Tipo de empresa", "Qué le puede interesar", "Por qué encaja"],
    ["Bares, cervecerías y restaurantes", "El tercer tiempo", "Es su terreno: comida, bebida y gente reunida"],
    ["Empresas medianas y despachos", "Rugby para empresas, primer equipo", "Trabajo en equipo para su plantilla"],
    ["Fisioterapia y clínicas deportivas", "Patrocinio en especie, escuela", "El rugby es deporte de contacto"],
    ["Tiendas de deporte y nutrición", "Equipación, torneo de seven", "Su cliente juega y entrena en el club"],
    ["Negocios de exjugadores y familias", "Escuela, equipos de base", "Ya conocen el club y sus valores"],
  ],
  calendario:
    "La temporada de rugby va de septiembre a mayo o junio. Las equipaciones se cierran **en verano**. Los torneos de seven y las jornadas de escuela suelen hacerse en primavera, buen momento para propuestas puntuales. Las actividades para empresas encajan en cualquier época, sobre todo **antes de Navidad**, cuando muchas buscan actividades para su plantilla.",
  consejoCalendario: {
    titulo: "Ofrece una sesión de rugby para empleados",
    texto:
      "A una empresa le cuesta poco y lo recuerda mucho: una tarde en el campo con sus trabajadores, aprendiendo a jugar con los entrenadores del club. Es un regalo que abre la puerta a un patrocinio.",
  },
  errorTipico: {
    titulo: "El error típico: no aprovechar la red del propio club",
    texto:
      "En rugby, los veteranos y exjugadores suelen tener negocio o trabajar en empresas de la zona. Antes de llamar a desconocidos, pregunta dentro del club.",
  },
  preguntas: [
    {
      pregunta: "¿Por qué una empresa patrocinaría un club de rugby?",
      respuesta:
        "Porque el rugby transmite valores muy reconocibles, como el respeto, el compañerismo y el esfuerzo, y reúne a una comunidad muy unida. Para una empresa es una forma de asociar su marca a esos valores y de llegar a las familias del club.",
    },
    {
      pregunta: "¿Qué es el patrocinio del tercer tiempo?",
      respuesta:
        "El tercer tiempo es la reunión de los dos equipos y sus familias después del partido. Un bar o restaurante puede patrocinarlo, poniendo la comida o la bebida, y aparecer en las fotos y en las redes del club.",
    },
    {
      pregunta: "¿Se puede ofrecer rugby a los empleados de una empresa?",
      respuesta:
        "Sí. Una sesión de rugby adaptada, con los entrenadores del club, es una actividad de trabajo en equipo muy original. Puede ser parte del patrocinio o una forma de empezar la relación con la empresa.",
    },
  ],
});

export const patrocinioFutbolSala = guiaDeDeporte({
  clave: "futbolSala",
  slug: "patrocinio-para-clubes-de-futbol-sala",
  nombre: "fútbol sala",
  deUnClub: "un club de fútbol sala",
  titulo: "Patrocinio para clubes de fútbol sala: ideas y cómo conseguirlo",
  tituloSeo: "Patrocinio para clubes de fútbol sala: ideas y cómo conseguirlo",
  descripcion:
    "Cómo conseguir patrocinio para un club de fútbol sala: qué ofrecer en el pabellón y en redes, a qué negocios escribir, cuándo hacerlo y cómo lograr que repitan.",
  entradilla:
    "El fútbol sala es rápido, espectacular y se juega muy cerca del público. Los goles caben en un vídeo de diez segundos y eso, para un negocio local, es oro en redes.",
  portadaAlt: "Jugadores de fútbol sala disputando el balón y una jugadora conduciendo en una pista de pabellón",
  resumen: [
    "El fútbol sala se juega en pabellón, con el público muy cerca y jugadas rápidas que funcionan muy bien en redes.",
    "Puedes ofrecer la equipación, las lonas, el portero patrocinado, el gol de la jornada en redes o el torneo de verano.",
    "Encaja con negocios del barrio y con marcas que buscan público joven.",
    "Cumple lo prometido, guarda las pruebas y enséñaselo al patrocinador: es lo que hace que renueve.",
  ],
  valor:
    "El fútbol sala tiene **mucho gol y mucha velocidad**, y se juega en pabellón con la grada encima de la pista. Las jugadas caben en un vídeo corto y se comparten muchísimo, sobre todo entre gente joven. Además, muchos clubes de fútbol sala son de barrio, con equipos de base y veteranos, y con una relación muy directa con los negocios de alrededor.",
  valorTarjetas: [
    { icono: "⚡", titulo: "Mucho gol", texto: "Jugadas rápidas y espectaculares, perfectas para vídeos cortos." },
    { icono: "📱", titulo: "Público joven", texto: "Redes muy activas, con jugadores y aficionados jóvenes." },
    { icono: "🏟️", titulo: "Pista cercana", texto: "La grada está encima: las lonas y las camisetas se ven de cerca." },
  ],
  ideas: [
    { icono: "👕", titulo: "La equipación", texto: "Camiseta de juego o de calentamiento, por equipos." },
    { icono: "🧤", titulo: "El portero", texto: "La equipación del portero es distinta y muy visible: una propuesta propia." },
    { icono: "🎥", titulo: "El gol de la jornada", texto: "El mejor gol de cada semana en redes, con el logo de un negocio." },
    { icono: "🧱", titulo: "Lonas en el pabellón", texto: "Detrás de las porterías o en la grada, durante toda la temporada." },
    { icono: "🏆", titulo: "El torneo de verano", texto: "Un torneo de barrio con nombre propio y muchos equipos." },
    { icono: "🎙️", titulo: "El partido patrocinado", texto: "Un partido en casa con el nombre de la empresa, megafonía y saque de honor." },
  ],
  empresas: [
    ["Tipo de empresa", "Qué le puede interesar", "Por qué encaja"],
    ["Bares y hamburgueserías del barrio", "Gol de la jornada, partido patrocinado", "Público joven que sale después del partido"],
    ["Tiendas de deporte y zapatillas", "Equipación, portero", "Su cliente juega en vuestra pista"],
    ["Gimnasios y centros deportivos", "Lonas, redes", "Mismo público, interesado en el deporte"],
    ["Talleres y tiendas de móviles", "Lonas, equipos sénior", "Clientes jóvenes y adultos de la zona"],
    ["Peluquerías y barberías", "Redes, equipos juveniles", "Muy de barrio y con público joven"],
  ],
  calendario:
    "La temporada de fútbol sala va de septiembre a mayo o junio. Las equipaciones y las lonas se cierran **en verano y en pretemporada**. Los torneos de verano, muy habituales en fútbol sala, se preparan en primavera: es el momento de ofrecerlos a los negocios del barrio.",
  consejoCalendario: {
    titulo: "Los vídeos cortos son tu mejor argumento",
    texto:
      "Enseña a la empresa un par de vídeos de goles de vuestras redes y cuánta gente los vio. Es mucho más convincente que cualquier explicación.",
  },
  errorTipico: {
    titulo: "El error típico: no medir las redes",
    texto:
      "Si ofreces publicaciones en redes, apunta cuánta gente las ve. Sin esos datos, la empresa no sabe qué recibe y es fácil que no renueve.",
  },
  preguntas: [
    {
      pregunta: "¿Qué puede ofrecer un club de fútbol sala a un patrocinador?",
      respuesta:
        "Equipaciones, la equipación del portero, lonas en el pabellón, partidos patrocinados, torneos de verano y, sobre todo, publicaciones en redes con los goles y jugadas de cada jornada.",
    },
    {
      pregunta: "¿Funcionan las redes sociales para conseguir patrocinio en fútbol sala?",
      respuesta:
        "Sí, muy bien. Las jugadas de fútbol sala son rápidas y espectaculares, y los vídeos cortos se comparten mucho. Si el club publica con regularidad y mide cuánta gente lo ve, tiene un argumento muy claro para una empresa.",
    },
    {
      pregunta: "¿Un club de fútbol sala de barrio puede tener patrocinadores?",
      respuesta:
        "Sí. Los negocios del barrio son los primeros interesados en que les vean las familias y los jóvenes de la zona. Empieza por ellos con propuestas pequeñas y concretas.",
    },
  ],
});

export const GUIAS_DE_DEPORTE: Guia[] = [
  patrocinioFutbol,
  patrocinioBaloncesto,
  patrocinioBalonmano,
  patrocinioVoleibol,
  patrocinioRugby,
  patrocinioFutbolSala,
];
