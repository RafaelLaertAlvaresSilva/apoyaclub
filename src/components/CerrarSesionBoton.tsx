import { cerrarSesion } from "@/app/[locale]/actions";

export function CerrarSesionBoton() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
