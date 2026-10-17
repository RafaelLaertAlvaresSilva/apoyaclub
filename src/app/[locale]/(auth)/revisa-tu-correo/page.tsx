import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TITULAR } from "@/lib/titular";
import { ReenviarCorreo } from "./ReenviarCorreo";

export async function generateMetadata(): Promise<Metadata> {
  const tMetadatos = await getTranslations("auth.titulos");
  return { title: tMetadatos("revisaCorreo") };
}

/**
 * Donde aterriza un club recién registrado.
 *
 * Era un callejón sin salida: decía "te hemos enviado un correo" y la
 * única opción era volver al acceso. Si el correo no llegaba —spam, una
 * letra mal escrita, el proveedor— no había nada que hacer. Es el punto
 * del recorrido donde más gente se cae, así que ahora tiene las dos
 * salidas que hacen falta: reenviarlo y escribirnos.
 */
export default function RevisaTuCorreoPage() {
  const t = useTranslations("auth.revisaCorreo");
  const tComun = useTranslations("auth.comun");

  return (
    <div className="space-y-5">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("titulo")}</h1>
        <p className="text-sm text-zinc-600">{t("texto")}</p>
        <p className="text-xs text-zinc-500">{t("spam")}</p>
      </div>

      <ReenviarCorreo />

      <div className="space-y-2 text-center text-sm">
        <p className="text-zinc-500">
          {t.rich("teEquivocaste", {
            enlace: (texto) => (
              <a
                href={`mailto:${TITULAR.email}?subject=${encodeURIComponent(t("asuntoNoLlega"))}`}
                className="font-medium text-accion-tinta hover:underline"
              >
                {texto}
              </a>
            ),
          })}
        </p>
        <Link href="/login" className="inline-block font-medium text-accion-tinta hover:underline">
          {tComun("volverALogin")}
        </Link>
      </div>
    </div>
  );
}
