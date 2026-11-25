import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/* Discreta y no a todo color: es un aviso que el club ya conoce y ve en
 * cada página, no una alarma. Borde y fondo ámbar suaves y un icono. */
const FRANJA =
  "flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900";

function IconoOculto() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="hidden h-4 w-4 flex-none sm:block"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49M14.084 14.158a3 3 0 0 1-4.242-4.242M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143M2 2l20 20" />
    </svg>
  );
}

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
      <IconoOculto />
      <span>{t("avisoModoPruebas")}</span>
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
      <IconoOculto />
      <span>
        {t("avisoOcultoPorElClub")}{" "}
        <Link href="/panel/privacidad" className="underline underline-offset-2">
          {t("avisoOcultoPorElClubEnlace")}
        </Link>
      </span>
    </div>
  );
}
