"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Contacto = { email: string | null; nombre: string | null; telefono: string | null };

/**
 * Correo de contacto del club y botones para escribir o llamar.
 *
 * Antes había que pulsar un botón para que apareciera. Se ha quitado:
 * la empresa que entra en la ficha tiene que poder escribir sin buscar
 * nada, y un clic de más entre ella y el club es un patrocinio menos.
 *
 * El correo se sigue pidiendo al servidor en vez de escribirlo en el
 * HTML, por dos motivos que no tienen nada que ver con esconderlo de
 * las personas:
 *
 *  1. Un correo escrito en abierto en una página pública lo recogen los
 *     robots que rastrean la web y acaba en listas de spam. Pedido por
 *     detrás, no está en el HTML y no lo recogen.
 *  2. Es lo que permite contarle al club "este mes tres empresas
 *     miraron tus datos de contacto", que es la señal más valiosa que
 *     produce la plataforma.
 *
 * La petición sale cuando el bloque entra en pantalla, no al cargar la
 * página. Así la métrica sigue queriendo decir algo — que alguien llegó
 * hasta el contacto — en vez de repetir el contador de visitas.
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
  const contenedor = useRef<HTMLDivElement>(null);
  const yaPedido = useRef(false);

  const cargar = useCallback(async () => {
    if (yaPedido.current) return;
    yaPedido.current = true;
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
        // Se permite reintentar: el fallo puede ser pasajero.
        yaPedido.current = false;
        return;
      }

      setContacto((await respuesta.json()) as Contacto);
    } catch {
      setError("No se han podido cargar los datos de contacto. Revisa tu conexión.");
      yaPedido.current = false;
    } finally {
      setCargando(false);
    }
  }, [slug]);

  useEffect(() => {
    const nodo = contenedor.current;

    // Navegador antiguo sin IntersectionObserver: se pide directamente.
    // Vale más un contacto visible que una métrica fina.
    if (!nodo || typeof IntersectionObserver === "undefined") {
      void cargar();
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          observador.disconnect();
          void cargar();
        }
      },
      // Un poco antes de que asome, para que ya esté puesto cuando se lee.
      { rootMargin: "200px" },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [cargar]);

  return (
    <div ref={contenedor}>
      {contacto ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* El nombre y el teléfono ya salen arriba, en la ficha del
              club. Aquí solo el correo, que es lo que faltaba. */}
          <div className="text-sm">
            {contacto.email && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Correo</p>
                <p className="text-zinc-900">{contacto.email}</p>
              </>
            )}
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
      ) : error ? (
        <div>
          <p className="mb-2 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {cargando ? "Cargando…" : textoBoton}
          </button>
        </div>
      ) : (
        // Hueco de la misma altura mientras llega, para que el bloque no
        // dé un salto delante de quien lo está leyendo.
        <div className="h-11 animate-pulse rounded-lg bg-zinc-100" aria-hidden="true" />
      )}
    </div>
  );
}
