"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { useRouter } from "@/i18n/navigation";
import { guardarLoBasico } from "../../actions";
import { Campo, clasesInput, clasesTextarea } from "../../components/SeccionCard";

/**
 * Paso 1 del asistente: nombre, localidad, provincia y unas líneas sobre
 * el club. Al guardar bien, pasa solo al paso 2.
 */
export function PasoLoBasico({
  nombre,
  ciudad,
  provincia,
  descripcion,
}: {
  nombre: string;
  ciudad: string;
  provincia: string;
  descripcion: string;
}) {
  const t = useTranslations("panel.empezar.pasos.club");
  const tPerfil = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(guardarLoBasico, null);
  const router = useRouter();

  useEffect(() => {
    if (estado && "ok" in estado && estado.ok) {
      router.push("/panel/empezar?paso=2");
      router.refresh();
    }
  }, [estado, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta={tPerfil("nombreDelClub")}>
          <input name="name" defaultValue={nombre} required className={clasesInput} />
        </Campo>
        <Campo etiqueta={tPerfil("localidad")}>
          <input name="city" defaultValue={ciudad} required className={clasesInput} />
        </Campo>
        <Campo etiqueta={tPerfil("provincia")}>
          <input name="province" defaultValue={provincia} className={clasesInput} />
        </Campo>
      </div>

      <Campo etiqueta={t("quienesSomos")} ayuda={t("ayudaDescripcion")}>
        <textarea name="description" defaultValue={descripcion} rows={5} className={clasesTextarea} />
      </Campo>
      <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm italic leading-relaxed text-zinc-600">{t("ejemploDescripcion")}</p>

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <div>
        <BotonEnviar>{t("boton")}</BotonEnviar>
      </div>
    </form>
  );
}
