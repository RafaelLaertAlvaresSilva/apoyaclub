import { useTranslations } from "next-intl";

/**
 * Recordatorio de que las páginas legales son plantillas de partida y
 * no textos revisados por un abogado.
 *
 * Solo se ve fuera de producción, y por eso: el aviso está escrito para
 * quien monta la web —dice literalmente que no se use como base legal
 * real— pero lo leía cualquier visitante justo antes de registrarse o
 * de aceptar las condiciones. Una nota interna en la puerta de entrada
 * dice "esto no está terminado" a la única persona a la que no hay que
 * decírselo.
 *
 * Esconderlo no revisa los textos: siguen siendo los mismos y siguen
 * siendo vinculantes. Lo que se quita es el cartel, no el pendiente.
 * Ver `docs/brief-revision-juridica.md`.
 */
export function AvisoRevisionJuridica() {
  const t = useTranslations("common.componentes");

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      role="alert"
      className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-semibold">{t("plantillaPendienteDeRevision")}</p>
      <p className="mt-1">{t("esteTextoEsUn")}</p>
    </div>
  );
}
