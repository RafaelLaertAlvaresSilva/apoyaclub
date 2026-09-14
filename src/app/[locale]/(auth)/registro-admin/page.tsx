"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { CLASES_CAMPO_ACCESO } from "@/components/CampoContrasena";
import { registrarAdmin } from "./actions";

/**
 * Sin enlace público hacia esta página (Fase 12): solo quien conozca la
 * URL y la clave de `ADMIN_SIGNUP_KEY` puede llegar a crear una cuenta
 * de administrador.
 */
export default function RegistroAdminPage() {
  const t = useTranslations("auth.registroAdmin");
  const tComun = useTranslations("auth.comun");
  const [estado, formAction] = useActionState(registrarAdmin, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("subtitulo")}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-zinc-700">
            {t("nombre")}
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="name"
            className={CLASES_CAMPO_ACCESO}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            {tComun("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={CLASES_CAMPO_ACCESO}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            {tComun("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={CLASES_CAMPO_ACCESO}
          />
          <p className="mt-1 text-xs text-zinc-500">{tComun("minimoCaracteres")}</p>
        </div>

        <div>
          <label htmlFor="confirmarPassword" className="mb-1 block text-sm font-medium text-zinc-700">
            {tComun("confirmarPassword")}
          </label>
          <input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            required
            autoComplete="new-password"
            className={CLASES_CAMPO_ACCESO}
          />
        </div>

        <div>
          <label htmlFor="claveAdmin" className="mb-1 block text-sm font-medium text-zinc-700">
            {t("clave")}
          </label>
          <input
            id="claveAdmin"
            name="claveAdmin"
            type="password"
            required
            autoComplete="off"
            className={CLASES_CAMPO_ACCESO}
          />
        </div>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>{t("boton")}</BotonEnviar>
      </form>

      <div className="text-center text-sm text-zinc-500">
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            {tComun("iniciaSesion")}
          </Link>
        </p>
      </div>
    </div>
  );
}
