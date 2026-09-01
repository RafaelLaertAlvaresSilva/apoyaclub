import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cuenta eliminada | ApoyaClub",
};

/** Página de despedida tras eliminar la cuenta (Fase 11, club o empresa). */
export default function CuentaEliminadaPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Tu cuenta se ha eliminado</h1>
        <p className="text-sm text-zinc-600">
          Hemos borrado tu cuenta y todos los datos asociados. Gracias por haber probado
          ApoyaClub.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
