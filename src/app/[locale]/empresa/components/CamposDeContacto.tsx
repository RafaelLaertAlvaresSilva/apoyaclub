"use client";

import { useTranslations } from "next-intl";
import type { ContactoEmpresa } from "@/lib/empresas";
import { Campo, clasesInput } from "../../panel/components/SeccionCard";

/**
 * Cómo te contactan (migración 0047).
 *
 * El mismo bloque en el formulario de la oferta y en la ficha, para que
 * no puedan separarse con el tiempo y acabar pidiendo cosas distintas.
 *
 * Se pide al publicar y no "más adelante" porque este es el momento en
 * que hace falta: una oferta sin forma de contacto es un cartel con el
 * teléfono arrancado. El club la lee, le encaja, y no tiene a dónde ir
 * — que es exactamente lo que pasaba antes de esto.
 */
export function CamposDeContacto({ contacto }: { contacto: ContactoEmpresa }) {
  const t = useTranslations("empresa.panel");
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
      <p className="text-sm font-medium text-zinc-900">{t("comoTeContactan")}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {t("correoTelefonoBastaPero")}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta={t("correo")}>
            <input
              name="contactoEmail"
              type="email"
              maxLength={200}
              defaultValue={contacto.email ?? ""}
              placeholder="hola@tuempresa.es"
              className={clasesInput}
            />
          </Campo>

          <Campo etiqueta={t("telefono")}>
            <input
              name="contactoTelefono"
              type="tel"
              maxLength={40}
              defaultValue={contacto.telefono ?? ""}
              placeholder="600 00 00 00"
              className={clasesInput}
            />
          </Campo>
        </div>

        <Campo etiqueta={t("personaContacto")} ayuda={t("quienHablaClubCuando")}>
          <input
            name="contactoNombre"
            maxLength={120}
            defaultValue={contacto.nombre ?? ""}
            placeholder={t("martaRuiz")}
            className={clasesInput}
          />
        </Campo>

        {/* El consentimiento, explícito y con las palabras claras. Un
            nombre y un teléfono de una persona no se publican porque
            sí, ni aunque la empresa quiera que la llamen. */}
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="contactoPublico"
            defaultChecked={contacto.publico}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
          />
          <span>
            <span className="block font-medium text-zinc-900">
              {t("clubesPuedenVerEstos")}
            </span>
            <span className="mt-1 block text-zinc-500">
              {t("noSalenEscritosPagina")}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
