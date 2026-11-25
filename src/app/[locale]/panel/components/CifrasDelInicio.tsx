import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Las cuatro cifras del inicio del panel, grandes y con su icono.
 *
 * Es lo que tienen todas las herramientas de trabajo serias al entrar:
 * de un vistazo, cómo va la cosa y qué está esperando. Cada una lleva a
 * su pantalla. Las dos que piden hacer algo —solicitudes sin abrir y
 * tareas pasadas de fecha— se encienden en su color cuando no están a
 * cero; las otras dos son el termómetro de la ficha.
 *
 * Los números NO se calculan aquí: llegan de la página, que ya los ha
 * pedido para el resto del inicio.
 */
type Cifra = {
  clave: "visitas" | "contactos" | "solicitudes" | "vencidas";
  valor: number;
  href: string;
  /** Si pide hacer algo y no está a cero. */
  alerta: boolean;
  tono: "verde" | "azul" | "rojo";
};

const TRAZOS: Record<Cifra["clave"], string> = {
  visitas: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  contactos:
    "M13.83 16.57a1 1 0 0 0 1.21-.3l.36-.47A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.47.35a1 1 0 0 0-.29 1.23 14 14 0 0 0 6.39 6.39",
  solicitudes:
    "M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  vencidas: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
};

/* El verde y el azul salen de los tonos del panel (`.tonal`), que ya
 * saben cambiar en el modo oscuro; el rojo, de la escala roja, que
 * también lo sabe. */
const CLASES_TONO: Record<Cifra["tono"], string> = {
  verde: "tonal tono-verde bg-(--tono-fondo) text-(--tono-tinta) ring-(--tono-borde)",
  azul: "tonal tono-azul bg-(--tono-fondo) text-(--tono-tinta) ring-(--tono-borde)",
  rojo: "bg-red-50 text-red-700 ring-red-200",
};

export function CifrasDelInicio({
  visitas,
  contactos,
  dias,
  solicitudesSinAbrir,
  tareasVencidas,
}: {
  visitas: number;
  contactos: number;
  /** De cuántos días son las dos primeras (las métricas van por ventana). */
  dias: number;
  solicitudesSinAbrir: number;
  tareasVencidas: number;
}) {
  const t = useTranslations("panel.inicio.cifras");

  const cifras: Cifra[] = [
    { clave: "visitas", valor: visitas, href: "/panel/alcance", alerta: false, tono: "verde" },
    { clave: "contactos", valor: contactos, href: "/panel/alcance", alerta: false, tono: "azul" },
    {
      clave: "solicitudes",
      valor: solicitudesSinAbrir,
      href: "/panel/solicitudes",
      alerta: solicitudesSinAbrir > 0,
      tono: solicitudesSinAbrir > 0 ? "rojo" : "verde",
    },
    {
      clave: "vencidas",
      valor: tareasVencidas,
      href: "/panel/tareas",
      alerta: tareasVencidas > 0,
      tono: tareasVencidas > 0 ? "rojo" : "verde",
    },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cifras.map((cifra) => (
        <li key={cifra.clave}>
          <Link
            href={cifra.href}
            className={`group relative flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
              cifra.alerta ? "border-red-200" : "border-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`flex size-10 flex-none items-center justify-center rounded-xl ring-1 ${CLASES_TONO[cifra.tono]}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d={TRAZOS[cifra.clave]} />
                </svg>
              </span>
              {cifra.alerta && (
                <span className="relative flex size-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peligro opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-peligro" />
                </span>
              )}
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums tracking-tight text-titular">{cifra.valor}</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-700">{t(`${cifra.clave}.etiqueta`)}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {cifra.clave === "visitas" || cifra.clave === "contactos"
                ? t("ultimosDias", { dias })
                : t(`${cifra.clave}.${cifra.alerta ? "hayQueMirar" : "alDia"}`)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
