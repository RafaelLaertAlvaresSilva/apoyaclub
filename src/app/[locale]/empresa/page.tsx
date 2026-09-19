import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerOfertasDeLaEmpresa } from "@/lib/empresas";
import { createClient } from "@/lib/supabase/server";
import { EmpresaNav } from "./components/EmpresaNav";
import { OfertasManager } from "./components/OfertasManager";
import { TraerGuardados } from "./components/TraerGuardados";

export const metadata: Metadata = { title: "Lo que ofrezco" };

type FilaEmpresa = {
  name: string | null;
  slug: string | null;
  open_to_sponsor: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_public_consent: boolean;
};

/**
 * El panel de la empresa (migración 0046).
 *
 * Lo primero y casi lo único: lo que ofrece. La ficha está en otra
 * pestaña porque es lo de menos — una empresa que publica una oferta
 * ya vale, aunque no rellene nada más.
 */
export default async function EmpresaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El layout ya protege esta ruta; segunda capa por si se renderiza en
  // otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const [{ data: empresa }, ofertas] = await Promise.all([
    supabase
      .from("companies")
      .select("name, slug, open_to_sponsor, contact_name, contact_email, contact_phone, contact_public_consent")
      .eq("id", user.id)
      .maybeSingle<FilaEmpresa>(),
    obtenerOfertasDeLaEmpresa(supabase, user.id),
  ]);

  const publicadas = ofertas.filter((oferta) => !oferta.archivadaEn).length;

  const contacto = {
    nombre: empresa?.contact_name ?? null,
    email: empresa?.contact_email ?? null,
    telefono: empresa?.contact_phone ?? null,
    publico: empresa?.contact_public_consent ?? true,
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel de empresa</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {empresa?.name ?? "Tu empresa"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Lo que puedes poner y qué pides a cambio. Los clubes lo ven en el directorio y te
            escriben ellos.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <EmpresaNav activo="ofertas" />

      <TraerGuardados />

      {/* Solo cuando hay algo publicado: el enlace a una ficha vacía no
          le sirve de nada a nadie. */}
      {publicadas > 0 && empresa?.slug && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Tu ficha ya es pública.{" "}
          <Link href={`/empresas/${empresa.slug}`} className="font-medium underline">
            Mira cómo la ven los clubes
          </Link>
          .
        </p>
      )}

      <OfertasManager ofertas={ofertas} contacto={contacto} />
    </div>
  );
}
