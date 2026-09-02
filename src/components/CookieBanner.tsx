"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useSyncExternalStore } from "react";

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
  const yaElegido = useSyncExternalStore(suscribirse, leerSnapshotCliente, leerSnapshotServidor);
  const [descartado, setDescartado] = useState(false);

  if (yaElegido || descartado) return null;

  function elegir(choice: EleccionCookies["choice"]) {
    guardarEleccion(choice);
    setDescartado(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-zinc-600">
          Usamos cookies técnicas necesarias para que ApoyaClub funcione. Puedes aceptar o
          rechazar las cookies no técnicas; más información en nuestra{" "}
          <Link href="/cookies" className="font-medium text-teal-700 hover:underline">{t("politicaDeCookies")}</Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => elegir("rejected")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >{t("rechazar")}</button>
          <button
            type="button"
            onClick={() => elegir("accepted")}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >{t("aceptar")}</button>
        </div>
      </div>
    </div>
  );
}
