"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const CLAVE_ALMACENAMIENTO = "apoyaclub_cookie_consent";

type EleccionCookies = {
  choice: "accepted" | "rejected";
  date: string;
};

function leerEleccionGuardada(): EleccionCookies | null {
  try {
    const bruto = window.localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!bruto) return null;
    return JSON.parse(bruto) as EleccionCookies;
  } catch {
    return null;
  }
}

function guardarEleccion(choice: EleccionCookies["choice"]) {
  try {
    const eleccion: EleccionCookies = { choice, date: new Date().toISOString() };
    window.localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(eleccion));
  } catch {
    // Si el navegador bloquea localStorage (modo privado, etc.), no hay
    // banner persistente, pero tampoco debe romper la página.
  }
}

// No hace falta suscribirse a cambios externos (otra pestaña, etc.): la
// única escritura ocurre desde este mismo componente al pulsar un botón,
// y eso ya provoca su propio re-render local.
function suscribirse() {
  return () => {};
}

/** Ya eligió (true) según lo guardado en localStorage. */
function leerSnapshotCliente(): boolean {
  return leerEleccionGuardada() !== null;
}

/**
 * En el servidor no hay localStorage: se asume "ya elegido" (banner
 * oculto) para el HTML inicial, y `useSyncExternalStore` corrige el
 * valor real en el cliente justo después de hidratar, sin el
 * `useEffect` + `setState` que dispara cascading renders.
 */
function leerSnapshotServidor(): boolean {
  return true;
}

/**
 * Banner de cookies RGPD (Fase 11): "Aceptar" y "Rechazar" con el mismo
 * peso visual, y la elección se guarda con fecha para poder demostrar
 * cuándo se dio (o no) el consentimiento. Solo cookies técnicas están
 * activas hoy (ver `/cookies`); este banner queda ya listo para cuando
 * se añadan cookies que sí requieran consentimiento.
 */
export function CookieBanner() {
  const t = useTranslations("common.componentes");
  const tc = useTranslations("common.cookies");
  const yaElegido = useSyncExternalStore(suscribirse, leerSnapshotCliente, leerSnapshotServidor);
  const [descartado, setDescartado] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const visible = !yaElegido && !descartado;

  /**
   * Mientras el aviso está puesto, la página se hace igual de alta que
   * él por abajo.
   *
   * Va pegado al borde inferior y nada le reservaba sitio, así que en un
   * teléfono tapaba los últimos 150 px: justo donde caen el botón de
   * crear la cuenta y los enlaces del pie. Se mide en vez de fijar una
   * altura a mano porque el texto ocupa tres líneas o cinco según el
   * ancho del teléfono.
   */
  useEffect(() => {
    if (!visible) return;

    function reservarSitio() {
      const alto = caja.current?.getBoundingClientRect().height ?? 0;
      document.body.style.paddingBottom = `${Math.round(alto)}px`;
    }

    reservarSitio();
    window.addEventListener("resize", reservarSitio);
    return () => {
      window.removeEventListener("resize", reservarSitio);
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  if (!visible) return null;

  function elegir(choice: EleccionCookies["choice"]) {
    guardarEleccion(choice);
    setDescartado(true);
  }

  return (
    <div
      ref={caja}
      role="dialog"
      aria-label={tc("aviso")}
      className="fixed inset-x-0 bottom-0 z-50 print:hidden border-t border-zinc-200 bg-white px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:px-4 sm:py-4"
    >
      {/* EN EL MÓVIL, UNA FRANJA BAJA Y NO UNA CAJA.
          Con el texto entero y los botones debajo medía 171 px en un
          teléfono, y en la portada tapaba medio botón "Soy un club",
          que es justo lo primero que hay que pulsar. Ahora el texto es
          corto, va al lado de los botones y la franja se queda en unos
          60 px. En pantallas anchas cabe todo en una línea y se deja el
          texto completo. Los dos botones siguen con el mismo peso: el
          RGPD no deja que "Rechazar" sea más difícil que "Aceptar". */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <p className="text-[13px] leading-snug text-zinc-600 sm:text-sm">
          <span className="sm:hidden">{tc("corto")} </span>
          <span className="hidden sm:inline">
            {tc("largo")}{" "}
          </span>
          <Link href="/cookies" className="font-medium text-teal-700 underline sm:no-underline sm:hover:underline">
            <span className="sm:hidden">{tc("masInformacion")}</span>
            <span className="hidden sm:inline">{t("politicaDeCookies")}</span>
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => elegir("rejected")}
            className="min-h-10 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:px-5 sm:py-3"
          >{t("rechazar")}</button>
          <button
            type="button"
            onClick={() => elegir("accepted")}
            className="min-h-10 rounded-lg bg-accion px-3 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-accion-fuerte sm:px-5 sm:py-3"
          >{t("aceptar")}</button>
        </div>
      </div>
    </div>
  );
}
