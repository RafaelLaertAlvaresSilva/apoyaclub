import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const FRANJA = "bg-aviso px-4 py-2.5 text-center text-sm font-medium text-sobre-aviso";

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
    <div role="status" className={FRANJA}>
      {t("avisoModoPruebas")}
    </div>
  );
}

/**
 * La misma franja cuando es el propio club quien ha decidido no
 * mostrarse (migración 0055). Aquí sí lleva enlace: lo ha apagado él y
 * tiene que poder encenderlo sin buscar dónde.
 */
export function AvisoOcultoPorElClub() {
  const t = useTranslations("panel.perfil2");

  return (
    <div role="status" className={FRANJA}>
      {t("avisoOcultoPorElClub")}{" "}
      <Link href="/panel/privacidad" className="underline underline-offset-2">
        {t("avisoOcultoPorElClubEnlace")}
      </Link>
    </div>
  );
}
