/**
 * Herramientas de terceros que se le recomiendan al club.
 *
 * El principio de negocio de ApoyaClub es que el club sale a buscar
 * empresas y la plataforma le da las herramientas para enseñarse. Pero
 * hasta ahora le dábamos con qué enseñarse (página, dossier, catálogo) y
 * nada con qué *encontrar* a quién enseñárselo: un directivo mira su
 * lista de solicitudes vacía y no sabe por dónde empezar. Aquí es donde
 * encaja una herramienta de prospección ajena.
 *
 * Tres decisiones de diseño, y las tres son deliberadas:
 *
 *   1. Es un enlace, no una integración. No se comparte ningún dato del
 *      club con el tercero, así que no hay ninguna cesión que declarar
 *      en la política de privacidad ni nada que mantener si el acuerdo
 *      se rompe.
 *   2. Cada recomendación dice si ApoyaClub cobra comisión. Esconderlo
 *      sería engañar al club que paga la cuota, que es exactamente la
 *      confianza sobre la que se sostiene el negocio.
 *   3. Sin enlace configurado, la recomendación no existe. Nada de
 *      dejar el bloque puesto "para cuando haya acuerdo": mientras no
 *      lo haya, el club no ve nada.
 */

export type Recomendacion = {
  id: string;
  nombre: string;
  /** Qué hace, en una frase que entienda un directivo de club. */
  queEs: string;
  /** Por qué le sirve a un club concreto, no en abstracto. */
  paraQue: string;
  /** Referencia de precio, tal y como la anuncia el tercero. */
  precio: string;
  url: string;
  /** true si ApoyaClub percibe una comisión por las altas desde el enlace. */
  conComision: boolean;
};

/**
 * Las recomendaciones activas.
 *
 * El enlace vive en una variable de entorno porque lleva el código de
 * afiliado, que cambia sin tocar el código y no tiene por qué estar en
 * el repositorio.
 */
export function obtenerRecomendaciones(): Recomendacion[] {
  const prospectPro = process.env.NEXT_PUBLIC_PROSPECTPRO_URL;

  return [
    prospectPro
      ? {
          id: "prospectpro",
          nombre: "ProspectPro",
          queEs:
            "Una herramienta para sacar listas de empresas por zona y por sector, con su web y su teléfono.",
          paraQue:
            "Tu página y tu dossier ya están listos, pero hay que mandárselos a alguien. Esto te da a quién: las empresas de tu provincia que encajan con lo que ofreces.",
          precio: "Menos de 5 € al mes",
          url: prospectPro,
          conComision: true,
        }
      : null,
  ].filter((recomendacion): recomendacion is Recomendacion => recomendacion !== null);
}
