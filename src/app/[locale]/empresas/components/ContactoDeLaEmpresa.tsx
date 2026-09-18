"use client";

import { useState } from "react";

type Contacto = {
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  web: string | null;
};

/**
 * Los datos de contacto de la empresa, detrás de un botón.
 *
 * Igual que en la ficha del club. No es un muro —no hay que
 * registrarse ni dar nada a cambio, es un clic— y sirve para que el
 * correo y el teléfono no queden escritos en el HTML de una página
 * pública, que es de donde los sacan los robots que arman listas de
 * spam. Una empresa que se apunta aquí para ayudar a un club de su
 * barrio no puede salir de esto con el buzón lleno de basura.
 */
export function ContactoDeLaEmpresa({ slug }: { slug: string }) {
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mostrar() {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/contacto-empresa", {
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
      setError("No se han podido cargar los datos de contacto. Inténtalo de nuevo.");
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
          className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy disabled:opacity-60"
        >
          {cargando ? "Un momento…" : "Ver datos de contacto"}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  const hayContacto = !!contacto.email || !!contacto.telefono;

  // Sin consentimiento no llega nada. Si al menos tiene web, ahí va el
  // club; si no, se le dice la verdad en vez de dejarlo dando vueltas.
  if (!hayContacto) {
    return contacto.web ? (
      <p className="text-sm text-zinc-700">
        Esta empresa no ha publicado sus datos de contacto.{" "}
        <a
          href={contacto.web}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium text-brand-teal-dark hover:underline"
        >
          Escríbele por su web
        </a>
        .
      </p>
    ) : (
      <p className="text-sm text-zinc-700">
        Esta empresa todavía no ha publicado ninguna forma de contacto.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {contacto.nombre && (
        <p className="text-zinc-700">
          <span className="font-medium text-zinc-900">Preguntar por: </span>
          {contacto.nombre}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {contacto.email && (
          <a
            href={`mailto:${contacto.email}`}
            className="rounded-lg bg-brand-teal-dark px-4 py-2 font-medium text-white transition-colors hover:bg-brand-navy"
          >
            {contacto.email}
          </a>
        )}
        {contacto.telefono && (
          <a
            href={`tel:${contacto.telefono.replace(/\s/g, "")}`}
            className="rounded-lg border border-brand-teal-dark px-4 py-2 font-medium text-brand-teal-dark transition-colors hover:bg-teal-50"
          >
            {contacto.telefono}
          </a>
        )}
      </div>
    </div>
  );
}
