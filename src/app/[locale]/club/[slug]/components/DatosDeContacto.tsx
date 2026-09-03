"use client";

import { useState } from "react";

type Contacto = { email: string | null; nombre: string | null; telefono: string | null };

/**
 * Datos de contacto del club, detrás de un botón (migración 0022).
 *
 * Dos motivos para no escribirlos directamente en la página: el correo
 * del club dejaba de estar en el HTML al alcance de cualquier robot que
 * recolecte direcciones, y la plataforma puede contar cuántas empresas
 * llegan hasta aquí, que es la métrica que le justifica la cuota al
 * club ("este mes tres empresas miraron tu contacto").
 *
 * No hay muro: cualquiera puede pulsar y verlos. Solo hace falta un
 * clic más.
 */
export function DatosDeContacto({
  slug,
  textoBoton,
  textoEmail,
  textoLlamar,
}: {
  slug: string;
  textoBoton: string;
  textoEmail: string;
  textoLlamar: string;
}) {
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mostrar() {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/contacto-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
        setError(cuerpo?.error ?? "No se han podido cargar los datos de contacto.");
        return;
      }

      setContacto((await respuesta.json()) as Contacto);
    } catch {
      setError("No se han podido cargar los datos de contacto. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  if (!contacto) {
    return (
      <div>
        <button
          type="button"
          onClick={mostrar}
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
        >
          {cargando ? "Cargando…" : textoBoton}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-zinc-600">
        {contacto.nombre && <p className="font-medium text-zinc-900">{contacto.nombre}</p>}
        {contacto.email && <p>{contacto.email}</p>}
        {contacto.telefono && <p>{contacto.telefono}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {contacto.email && (
          <a
            href={`mailto:${contacto.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            {textoEmail}
          </a>
        )}
        {contacto.telefono && (
          <a
            href={`tel:${contacto.telefono.replace(/\s+/g, "")}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {textoLlamar}
          </a>
        )}
      </div>
    </div>
  );
}
