"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import {
  alternarFavorito,
  crearListaYGuardar,
  obtenerListasParaOportunidad,
  type ListaConEstado,
} from "@/app/[locale]/empresa/favoritos/actions";
import { useSesionActual } from "../hooks/useSesionActual";

/**
 * Botón "Guardar en favoritos" de cada oportunidad en la página pública
 * del club (Fase 8). Solo tiene sentido para una empresa con sesión
 * iniciada: para un club o un visitante anónimo se oculta o se convierte
 * en un enlace a iniciar sesión (ver `useSesionActual`).
 */
export function GuardarFavoritoBoton({ opportunityId }: { opportunityId: string }) {
  const sesion = useSesionActual();
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [listas, setListas] = useState<ListaConEstado[] | null>(null);
  const [nombreNuevaLista, setNombreNuevaLista] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function manejarClicFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", manejarClicFuera);
    return () => document.removeEventListener("mousedown", manejarClicFuera);
  }, [abierto]);

  async function abrir() {
    setAbierto(true);
    setError(null);
    if (listas !== null) return;

    setCargando(true);
    const resultado = await obtenerListasParaOportunidad(opportunityId);
    setCargando(false);

    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setListas(resultado.listas);
  }

  async function alternar(listId: string) {
    setListas((actual) =>
      actual
        ? actual.map((lista) => (lista.id === listId ? { ...lista, guardado: !lista.guardado } : lista))
        : actual,
    );

    const resultado = await alternarFavorito(listId, opportunityId);

    if ("error" in resultado) {
      setError(resultado.error);
      // Revierte el cambio optimista si ha fallado.
      setListas((actual) =>
        actual
          ? actual.map((lista) => (lista.id === listId ? { ...lista, guardado: !lista.guardado } : lista))
          : actual,
      );
    }
  }

  async function crearYGuardar() {
    const nombre = nombreNuevaLista.trim();
    if (!nombre) return;

    setCargando(true);
    const resultado = await crearListaYGuardar(nombre, opportunityId);
    setCargando(false);

    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setListas((actual) => [...(actual ?? []), resultado.lista]);
    setNombreNuevaLista("");
  }

  const clasesBase =
    "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";

  if (sesion.cargando) {
    return (
      <span className={`${clasesBase} border-zinc-200 text-zinc-300`} aria-hidden="true">
        ☆ Guardar
      </span>
    );
  }

  // Un club no guarda favoritos: solo tiene sentido para una empresa.
  if (sesion.rol === "club") return null;

  if (sesion.rol !== "empresa") {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={`${clasesBase} border-zinc-300 text-zinc-600 hover:bg-zinc-100`}
      >
        ☆ Guardar
      </Link>
    );
  }

  const guardadoEnAlguna = listas?.some((lista) => lista.guardado) ?? false;

  return (
    <div className="relative inline-block" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className={`${clasesBase} ${
          guardadoEnAlguna
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        {guardadoEnAlguna ? "★ Guardado" : "☆ Guardar"}
      </button>

      {abierto && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-lg">
          <p className="mb-2 text-xs font-medium text-zinc-500">Guardar en una lista</p>

          {cargando && listas === null ? (
            <p className="text-sm text-zinc-400">Cargando…</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {(listas ?? []).map((lista) => (
                <label key={lista.id} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={lista.guardado}
                    onChange={() => alternar(lista.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {lista.name}
                </label>
              ))}
              {listas?.length === 0 && (
                <p className="text-sm text-zinc-400">Todavía no tienes ninguna lista.</p>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-1 border-t border-zinc-100 pt-3">
            <input
              type="text"
              value={nombreNuevaLista}
              onChange={(evento) => setNombreNuevaLista(evento.target.value)}
              placeholder="Nueva lista…"
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={crearYGuardar}
              disabled={!nombreNuevaLista.trim()}
              className="whitespace-nowrap rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Crear
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <Link
            href="/empresa/favoritos"
            className="mt-3 block text-center text-xs font-medium text-emerald-700 hover:underline"
          >
            Gestionar mis listas
          </Link>
        </div>
      )}
    </div>
  );
}
