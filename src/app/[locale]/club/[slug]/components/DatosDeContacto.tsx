"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Contacto = {
  email: string | null;
  nombre: string | null;
  telefono: string | null;
  horario: string | null;
};

/**
 * Los datos de contacto del club, detrás de un botón.
 *
 * No es un muro: no hay que registrarse ni dar nada a cambio. Es un
 * clic, y sale todo de una vez — persona, teléfono, correo y horario.
 *
 * Ese clic hace dos cosas que sin él no se pueden hacer:
 *
 *  1. El correo y el teléfono no quedan escritos en el HTML de una
 *     página pública, que es de donde los sacan los robots que arman
 *     listas de spam. El club deja de recibir basura por estar aquí.
 *  2. La plataforma puede decirle al club "este mes tres empresas
 *     miraron tus datos de contacto". Es la señal más valiosa que
 *     produce ApoyaClub: no es una visita suelta, es alguien a un paso
 *     de escribir.
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
  const t = useTranslations("club.contactoPublico");
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
        setError(t("errorCarga"));
        return;
      }

      setContacto((await respuesta.json()) as Contacto);
    } catch {
      setError(t("errorCarga"));
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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accion px-5 py-3 text-sm font-semibold text-sobre-color transition-colors hover:bg-accion-fuerte disabled:opacity-60"
        >
          {cargando ? t("cargando") : textoBoton}
        </button>
        <p className="mt-2 text-xs text-zinc-500">
          {t("unSoloClic")}
        </p>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  const vacio = !contacto.nombre && !contacto.telefono && !contacto.email && !contacto.horario;

  if (vacio) {
    return (
      <p className="text-sm text-zinc-600">
        {t("sinDatos")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <dl className="space-y-2 text-sm">
        {contacto.nombre && <Dato etiqueta={t("persona")} valor={contacto.nombre} />}
        {contacto.telefono && <Dato etiqueta={t("telefono")} valor={contacto.telefono} />}
        {contacto.email && <Dato etiqueta={t("correo")} valor={contacto.email} />}
        {contacto.horario && <Dato etiqueta={t("horario")} valor={contacto.horario} />}
      </dl>

      <div className="flex shrink-0 flex-wrap gap-2">
        {contacto.email && (
          <a
            href={`mailto:${contacto.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accion px-4 py-2.5 text-sm font-medium text-sobre-color transition-colors hover:bg-accion-fuerte"
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

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{etiqueta}</dt>
      <dd className="text-zinc-900">{valor}</dd>
    </div>
  );
}
