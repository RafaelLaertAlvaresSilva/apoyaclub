import { useTranslations } from "next-intl";

/**
 * Franja de arriba del panel para un club en modo de pruebas
 * (migración 0053). Sin ella, el club —o el administrador probando con
 * él— vería que todo funciona y no entendería por qué su página da
 * "no encontrada" o por qué no sale en el buscador.
 *
 * No lleva botón: el modo lo pone y lo quita el administrador.
 */
export function AvisoModoPruebas() {
  const t = useTranslations("panel.perfil2");

  return (
    <div role="status" className="bg-aviso px-4 py-2.5 text-center text-sm font-medium text-sobre-aviso">
      {t("avisoModoPruebas")}
    </div>
  );
}
