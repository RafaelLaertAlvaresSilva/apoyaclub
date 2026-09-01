import { Link } from "@/i18n/navigation";

export default function ClubNoEncontrado() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
      <p className="text-sm font-medium text-emerald-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">No encontramos este club</h1>
      <p className="mt-2 max-w-md text-zinc-600">
        El enlace puede haber caducado o el club puede haber cambiado de dirección. Comprueba
        la URL o vuelve al inicio.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
