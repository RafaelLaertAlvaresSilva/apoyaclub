"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CampoTrampa } from "@/components/CampoTrampa";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";
import { apuntarAvisoDeZona, type EstadoAvisoDeZona } from "../actions";

/**
 * Lo que se ofrece cuando el buscador no encuentra nada (pedido por
 * Rafael el 7-11-2026): con pocos clubes todavía, es lo que ve casi
 * cualquier empresa que filtra por su provincia. Antes se iba sin dejar
 * rastro. Ahora puede:
 *
 *   - dejar su correo para que le avisemos cuando haya algo (sin cuenta);
 *   - invitar a un club que conozca, por WhatsApp o copiando el enlace.
 */
export function AvisoYInvitacion({
  zona,
  pais,
  provincia,
  deporte,
}: {
  /** Cómo se lee la zona: "Alicante · fútbol", "España". */
  zona: string;
  pais: string | null;
  provincia: string | null;
  deporte: string | null;
}) {
  const t = useTranslations("buscar.avisoZona");
  const locale = useLocale();
  const [estado, enviar, enviando] = useActionState<EstadoAvisoDeZona, FormData>(apuntarAvisoDeZona, null);
  const [copiado, setCopiado] = useState(false);

  const enlaceParaClubes = `${SITE_URL}/${locale}/para-clubes`;
  const mensaje = t("mensajeInvitacion", { url: enlaceParaClubes });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
      <section className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <h3 className="font-semibold text-teal-950">{t("titulo", { zona })}</h3>
        {estado && "ok" in estado ? (
          <p role="status" className="mt-2 text-sm text-teal-900">
            {t("ok")}
          </p>
        ) : (
          <form action={enviar} className="mt-2 space-y-2">
            <p className="text-sm text-teal-900">{t("texto")}</p>
            <CampoTrampa />
            <input type="hidden" name="pais" value={pais ?? ""} />
            <input type="hidden" name="provincia" value={provincia ?? ""} />
            <input type="hidden" name="deporte" value={deporte ?? ""} />
            <label htmlFor="aviso-zona-email" className="sr-only">
              {t("email")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="aviso-zona-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("email")}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-accion-tinta focus:outline-none focus:ring-1 focus:ring-accion-tinta"
              />
              <button
                type="submit"
                disabled={enviando}
                className="rounded-lg bg-accion px-4 py-2 text-sm font-medium text-sobre-color hover:bg-accion-fuerte disabled:opacity-50"
              >
                {enviando ? t("enviando") : t("boton")}
              </button>
            </div>
            {estado && "error" in estado && (
              <p role="alert" className="text-sm text-red-700">
                {estado.error}
              </p>
            )}
            <p className="text-xs text-teal-900/80">
              {t.rich("legal", {
                privacidad: (trozo) => (
                  <Link href="/privacidad" className="underline">
                    {trozo}
                  </Link>
                ),
              })}
            </p>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="font-semibold text-zinc-900">{t("invitarTitulo")}</h3>
        <p className="mt-2 text-sm text-zinc-600">{t("invitarTexto")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-accion px-4 py-2 text-sm font-medium text-sobre-color hover:bg-accion-fuerte"
          >
            {t("whatsapp")}
          </a>
          <button
            type="button"
            onClick={copiar}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {copiado ? t("copiado") : t("copiar")}
          </button>
        </div>
      </section>
    </div>
  );
}
