import { Link } from "@/i18n/navigation";

/**
 * Aviso, arriba del panel, de que hay empresas esperando respuesta.
 *
 * El contador del menú ya lo señala, pero esto es lo único que de verdad
 * mueve el negocio del club: una empresa que escribe y no recibe
 * respuesta en unos días se va con otro. Merece ocupar sitio y color
 * hasta que el club entre a leerla.
 */
export function AvisoSolicitudes({ sinAbrir }: { sinAbrir: number }) {
  if (sinAbrir === 0) return null;

  return (
    <section className="rounded-xl border-2 border-teal-600 bg-teal-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Tienes empresas esperando
      </p>
      <h2 className="mt-1 text-lg font-semibold text-zinc-900">
        {sinAbrir === 1
          ? "Una empresa te ha escrito y sigue sin respuesta"
          : `${sinAbrir} empresas te han escrito y siguen sin respuesta`}
      </h2>
      <p className="mt-1 text-sm text-zinc-700">
        Responder pronto es la diferencia entre un patrocinio y un correo olvidado.
      </p>
      <Link
        href="/panel/solicitudes"
        className="mt-3 inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
      >
        {sinAbrir === 1 ? "Ver la solicitud" : "Ver las solicitudes"}
      </Link>
    </section>
  );
}
