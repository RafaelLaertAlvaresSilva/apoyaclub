/**
 * Cómo se escribe una guía de ApoyaClub.
 *
 * Las guías (apoyaclub.com/es/guias) son la parte de la web pensada para
 * que nos encuentren en Google y en los buscadores con IA: responden a lo
 * que buscan los clubes ("cómo conseguir patrocinadores") y las empresas
 * ("patrocinar un club deportivo"). Ver la auditoría SEO de noviembre de
 * 2026.
 *
 * Una guía es un objeto de datos, no un archivo de texto con formato:
 * así el diseño de todas es el mismo, el índice sale solo de los
 * apartados y las pruebas pueden comprobar que no falta nada (resumen,
 * preguntas, enlaces que existen…). Para escribir una nueva, se copia
 * una de `src/content/guias/` y se añade a `src/lib/guias/index.ts`.
 *
 * Dentro de cualquier texto se puede usar:
 *   - **negrita**
 *   - [un enlace](/para-clubes) a otra página de la web (sin el idioma)
 *   - [un enlace](https://…) a otra web, que se abre en otra pestaña
 */

export type CategoriaDeGuia = "clubes" | "empresas" | "ideas";

/** Un trozo de la guía. El tipo decide cómo se pinta. */
export type Bloque =
  /** Un párrafo normal. */
  | { tipo: "parrafo"; texto: string }
  /** Un apartado del índice. `id` es el ancla (#id) y debe ser única. */
  | { tipo: "apartado"; id: string; titulo: string; antetitulo?: string }
  /** Un subtítulo dentro de un apartado (no sale en el índice). */
  | { tipo: "subtitulo"; titulo: string }
  /** Una lista de puntos. */
  | { tipo: "lista"; elementos: string[]; numerada?: boolean }
  /** Tarjetas en rejilla: opciones, ideas, tipos de empresa… */
  | { tipo: "tarjetas"; elementos: { icono: string; titulo: string; texto: string }[] }
  /** Una tabla sencilla. La primera fila son los encabezados. */
  | { tipo: "tabla"; filas: string[][]; nota?: string }
  /** Recuadros destacados. */
  | { tipo: "consejo"; titulo: string; texto: string }
  | { tipo: "error"; titulo: string; texto: string }
  /** Un ejemplo para copiar (un correo, un mensaje…). */
  | { tipo: "ejemplo"; titulo: string; lineas: string[] }
  /** Una lista de comprobación. */
  | { tipo: "checklist"; titulo: string; elementos: string[] }
  /** La llamada a probar ApoyaClub, en mitad de la guía. */
  | { tipo: "llamada"; titulo: string; texto: string };

export type Guia = {
  /** La dirección: /es/guias/<slug>. No se cambia una vez publicada. */
  slug: string;
  categoria: CategoriaDeGuia;
  /** El titular que se ve en la página. */
  titulo: string;
  /** El título de la pestaña y de Google (unos 60 caracteres). */
  tituloSeo: string;
  /** La descripción de Google (unos 150 caracteres). */
  descripcion: string;
  /** La entradilla bajo el titular. */
  entradilla: string;
  /** La foto de portada, en /public. Apaisada (16:9). */
  portada: string;
  portadaAlt: string;
  /** Fechas en formato AAAA-MM-DD. */
  publicada: string;
  actualizada: string;
  /** "En resumen": la respuesta en tres o cuatro frases. Es lo que más
   * citan Google y las IA, así que va arriba y sin rodeos. */
  resumen: string[];
  cuerpo: Bloque[];
  preguntas: { pregunta: string; respuesta: string }[];
  /** Slugs de otras guías para el final. Las que aún no existen se
   * ignoran, así se pueden dejar puestas antes de escribirlas. */
  relacionadas: string[];
};
