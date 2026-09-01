import { Link } from "@/i18n/navigation";
import { AvisoRevisionJuridica } from "./AvisoRevisionJuridica";

/**
 * Estructura común de las páginas legales (Fase 11): título, fecha de
 * última actualización, aviso de revisión jurídica pendiente y el
 * contenido en sí. `children` debe ser una lista de secciones (h2 + p)
 * ya formateadas por cada página.
 */
export function LegalPageShell({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Volver a ApoyaClub
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{titulo}</h1>
      <p className="mt-1 text-sm text-zinc-500">Última actualización: {actualizado}</p>

      <div className="mt-6">
        <AvisoRevisionJuridica />
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
