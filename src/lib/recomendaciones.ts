/**
 * Herramientas de terceros que el club tiene a mano desde su panel.
 *
 * El principio de negocio de ApoyaClub es que el club sale a buscar
 * empresas y la plataforma le da las herramientas para enseñarse. Pero
 * le dábamos con qué enseñarse (página, dossier, catálogo) y nada con
 * qué *encontrar* a quién enseñárselo: un directivo mira su lista de
 * solicitudes vacía y no sabe por dónde empezar.
 *
 * Hay dos formas muy distintas de resolver eso, y la diferencia no es de
 * matiz:
 *
 *   - "recomendada": ApoyaClub la sugiere y el club la contrata aparte.
 *     Si hay comisión de por medio, se dice. Un club que paga una cuota
 *     tiene derecho a saber si la recomendación de su proveedor es
 *     interesada, y esa confianza es sobre lo que se sostiene el negocio.
 *
 *   - "incluida": ApoyaClub compra las licencias y el club la usa sin
 *     pagar nada más. Aquí no hay comisión que declarar, pero sí algo
 *     más serio: para dar de alta al club en la herramienta hay que
 *     pasarle sus datos, y eso es una cesión a un tercero que tiene que
 *     estar en la política de privacidad y en un contrato con él.
 *
 * Nada se enseña sin enlace configurado: no se deja el bloque puesto
 * "para cuando haya acuerdo".
 */

export type ModoHerramienta = "recomendada" | "incluida";

export type Recomendacion = {
  id: string;
  nombre: string;
  /** Qué hace, en una frase que entienda un directivo de club. */
  queEs: string;
  /** Por qué le sirve a un club concreto, no en abstracto. */
  paraQue: string;
  modo: ModoHerramienta;
  /** Referencia de precio. Null cuando va incluida en la cuota. */
  precio: string | null;
  url: string;
  /** Solo tiene sentido en modo "recomendada". */
  conComision: boolean;
  /** Qué tiene que hacer el club para empezar a usarla, si hace falta algo. */
  comoSeActiva?: string;
};

/**
 * Las herramientas activas.
 *
 * El enlace vive en una variable de entorno porque cambia sin tocar el
 * código (lleva el código de afiliado, o la dirección de alta que dé el
 * proveedor), y el modo también: el mismo acuerdo puede empezar siendo
 * una recomendación y acabar en licencias compradas.
 */
export function obtenerRecomendaciones(): Recomendacion[] {
  const prospectPro = process.env.NEXT_PUBLIC_PROSPECTPRO_URL;
  const modoProspectPro: ModoHerramienta =
    process.env.NEXT_PUBLIC_PROSPECTPRO_MODO === "incluida" ? "incluida" : "recomendada";

  const herramientas: (Recomendacion | null)[] = [
    prospectPro
      ? {
          id: "prospectpro",
          nombre: "ProspectPro",
          queEs:
            "Una herramienta para sacar listas de empresas por zona y por sector, con su web y su teléfono.",
          paraQue:
            "Tu página y tu dossier ya están listos, pero hay que mandárselos a alguien. Esto te da a quién: las empresas de tu provincia que encajan con lo que ofreces.",
          modo: modoProspectPro,
          precio: modoProspectPro === "incluida" ? null : "Menos de 5 € al mes",
          url: prospectPro,
          conComision: modoProspectPro === "recomendada",
          comoSeActiva:
            modoProspectPro === "incluida"
              ? "Escríbenos y te damos de alta. Va dentro de tu cuota, no pagas nada más."
              : undefined,
        }
      : null,
  ];

  return herramientas.filter(
    (herramienta): herramienta is Recomendacion => herramienta !== null,
  );
}
