import { useTranslations } from "next-intl";
/**
 * El recordatorio que acompaña a cada sitio donde el club sube fotos
 * (migración 0036).
 *
 * Va donde se sube y no en un documento legal aparte, porque es donde
 * sirve de algo: nadie va a leer las condiciones antes de arrastrar una
 * foto del equipo. Y dice quién responde —el club— sin pedirle que
 * marque nada: guardar aquí un "confirmo que tengo los permisos" daría
 * a entender que ApoyaClub los ha comprobado, y no es así.
 *
 * Lo de los menores no es un añadido: en un club de base, la mitad de
 * las fotos son de cantera.
 */
export function AvisoDerechosDeImagen({ compacto = false }: { compacto?: boolean }) {
  const t = useTranslations("panel.avisos");
  return (
    <p
      className={`rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 ${
        compacto ? "" : "leading-relaxed"
      }`}
    >
      {t("derechosImagen")}
      {!compacto && (
        <>
          {" "}
          {t.rich("derechosImagenPermiso", {
            fuerte: (trozo) => <strong className="font-semibold">{trozo}</strong>,
          })}
        </>
      )}
    </p>
  );
}
