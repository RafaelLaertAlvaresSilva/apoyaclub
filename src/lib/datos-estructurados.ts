/**
 * Datos estructurados (JSON-LD) de las páginas públicas.
 *
 * Es lo que le dice a Google y a los buscadores con IA (ChatGPT,
 * Perplexity, Gemini…) qué es ApoyaClub, quién está detrás, para quién
 * es y cuánto cuesta, sin tener que adivinarlo leyendo la página. Hasta
 * la auditoría SEO de noviembre de 2026 solo las fichas de club lo
 * tenían; la portada y las preguntas frecuentes no.
 *
 * Funciones puras, sin React: así se prueban solas y la página solo
 * tiene que pintar el resultado con <DatosEstructurados />.
 */

/** Perfiles de ApoyaClub en redes. Se enlazan como `sameAs` para que los
 * buscadores sepan que esas cuentas son de la misma organización. */
export const PERFILES_APOYACLUB = [
  "https://www.instagram.com/apoyaclub/",
  "https://www.facebook.com/1416280698239903",
  "https://www.linkedin.com/company/apoyaclub/",
] as const;

/** Precios públicos de la suscripción del club en España (IVA incluido).
 * Los mismos que enseña la sección de precio de la portada. */
export const PRECIOS_CLUB_EUR = [
  { nombre: "Fundador", precio: "199.00", periodo: "año" },
  { nombre: "Temporada", precio: "249.00", periodo: "año" },
  { nombre: "Mensual", precio: "29.90", periodo: "mes" },
] as const;

type Nodo = Record<string, unknown>;

/** Organización + web + aplicación, enlazadas entre sí con `@id`. */
export function grafoDeLaPortada(siteUrl: string, idioma: string, descripcion: string): Nodo {
  const organizacion = `${siteUrl}/#organizacion`;
  const web = `${siteUrl}/#web`;
  const fundador = `${siteUrl}/#fundador`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizacion,
        name: "ApoyaClub",
        url: siteUrl,
        logo: `${siteUrl}/icon-512.png`,
        description: descripcion,
        email: "info@apoyaclub.com",
        founder: { "@id": fundador },
        sameAs: [...PERFILES_APOYACLUB],
      },
      {
        "@type": "Person",
        "@id": fundador,
        name: "Rafael Alvares",
        jobTitle: "Fisioterapeuta deportivo y fundador de ApoyaClub",
        url: `${siteUrl}/${idioma}/quienes-somos`,
        worksFor: { "@id": organizacion },
      },
      {
        "@type": "WebSite",
        "@id": web,
        name: "ApoyaClub",
        url: `${siteUrl}/${idioma}`,
        inLanguage: idioma,
        publisher: { "@id": organizacion },
        // Sin `SearchAction`: el buscador filtra por deporte y zona, no
        // tiene una caja de texto libre a la que Google pueda mandar.
      },
      {
        "@type": "SoftwareApplication",
        name: "ApoyaClub",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${siteUrl}/${idioma}/para-clubes`,
        description: descripcion,
        publisher: { "@id": organizacion },
        offers: PRECIOS_CLUB_EUR.map((p) => ({
          "@type": "Offer",
          name: p.nombre,
          price: p.precio,
          priceCurrency: "EUR",
          url: `${siteUrl}/${idioma}/para-clubes#precio`,
        })),
      },
    ],
  };
}

/** Preguntas frecuentes de una página, tal como se leen en ella. */
export function grafoDePreguntas(preguntas: { pregunta: string; respuesta: string }[]): Nodo {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((p) => ({
      "@type": "Question",
      name: p.pregunta,
      acceptedAnswer: { "@type": "Answer", text: p.respuesta },
    })),
  };
}

/**
 * El JSON va dentro de un <script>: un `</script>` en un texto (una
 * respuesta de la FAQ, por ejemplo) cerraría la etiqueta antes de
 * tiempo. Se escapa el `<` para que nunca pueda pasar.
 */
export function serializarParaScript(datos: Nodo): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
