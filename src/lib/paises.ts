/**
 * Los países en los que está ApoyaClub.
 *
 * El país es del CLUB, no del idioma de la web: un club de Brasil puede
 * registrarse leyendo la web en español, y uno de Galicia leyéndola en
 * portugués. Por eso se pregunta al registrarse —con el del idioma ya
 * marcado, que es lo normal— y se guarda en la cuenta del club
 * (`app_metadata.pais`), donde el club no puede cambiarlo él solo.
 *
 * Es lo que separa a los clubes en el admin: cada representante ve los
 * de su país, y Rafael, todos con un filtro.
 *
 * Los clubes que se registraron antes de que existiera esto no tienen
 * país guardado: son todos de España.
 */
export const PAISES = ["ES", "PT", "BR"] as const;

export type Pais = (typeof PAISES)[number];

export const PAIS_POR_DEFECTO: Pais = "ES";

export const NOMBRE_DEL_PAIS: Record<Pais, string> = {
  ES: "España",
  PT: "Portugal",
  BR: "Brasil",
};

export const BANDERA_DEL_PAIS: Record<Pais, string> = {
  ES: "🇪🇸",
  PT: "🇵🇹",
  BR: "🇧🇷",
};

export function esPaisValido(valor: unknown): valor is Pais {
  return typeof valor === "string" && (PAISES as readonly string[]).includes(valor);
}

/** El país que sale marcado en el registro, según el idioma de la web. */
export function paisDelIdioma(locale: string): Pais {
  if (locale === "br") return "BR";
  if (locale === "pt") return "PT";
  return "ES";
}

/** El país de una cuenta. Sin país guardado, España (las altas antiguas). */
export function paisDeLaCuenta(appMetadata: Record<string, unknown> | null | undefined): Pais {
  const pais = appMetadata?.pais;
  return esPaisValido(pais) ? pais : PAIS_POR_DEFECTO;
}
