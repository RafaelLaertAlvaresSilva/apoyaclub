import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { ETIQUETA_FRANJA, obtenerEmpresaPublica } from "@/lib/directorio-empresas";
import { ETIQUETA_OBJETIVO } from "@/lib/opportunities";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { ProponerPatrocinio } from "./components/ProponerPatrocinio";

type ParametrosRuta = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ParametrosRuta): Promise<Metadata> {
  const { slug } = await params;
  const empresa = await obtenerEmpresaPublica(slug);

  if (!empresa) return { title: "Empresa no encontrada — ApoyaClub" };

  return {
    title: `${empresa.name} — Empresa que apoya el deporte base | ApoyaClub`,
    description:
      empresa.description ??
      `${empresa.name} está abierta a patrocinar clubes deportivos${empresa.city ? ` en ${empresa.city}` : ""}.`,
  };
}

export default async function PaginaEmpresa({ params }: ParametrosRuta) {
  const { slug } = await params;
  const empresa = await obtenerEmpresaPublica(slug);

  if (!empresa) notFound();

  // Quién está mirando. Solo hace falta para decidir qué enseñar debajo:
  // el formulario, o lo que hay que hacer para poder escribir.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rol = user?.app_metadata?.role as Role | undefined;
  const esClub = !!user && rol === "club";

  let yaEscrita = false;
  if (esClub) {
    const { data } = await supabase
      .from("club_proposals")
      .select("id")
      .eq("club_id", user.id)
      .eq("company_id", empresa.id)
      .maybeSingle<{ id: string }>();
    yaEscrita = !!data;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Link href="/empresas" className="text-sm font-medium text-teal-700 hover:underline">
          ← Todas las empresas
        </Link>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-wrap items-start gap-4">
            {empresa.logoUrl ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2">
                <Image
                  src={empresa.logoUrl}
                  alt={`Logo de ${empresa.name}`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-2xl font-bold text-teal-700">
                {empresa.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
                Abierta a patrocinar
              </span>
              <h1 className="mt-2 text-2xl font-bold text-zinc-900">{empresa.name}</h1>
              <p className="mt-1 text-sm text-zinc-600">
                {[empresa.sector, empresa.city, empresa.province].filter(Boolean).join(" · ") || "—"}
              </p>
              {empresa.website && (
                <a
                  href={empresa.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-2 inline-block text-sm font-medium text-teal-700 hover:underline"
                >
                  {empresa.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>

          {empresa.description && (
            <p className="mt-5 whitespace-pre-line text-zinc-700">{empresa.description}</p>
          )}

          {(empresa.budgetBand || empresa.objectives.length > 0) && (
            <dl className="mt-6 grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-2">
              {empresa.budgetBand && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Presupuesto orientativo
                  </dt>
                  <dd className="mt-1 font-medium text-zinc-900">
                    {ETIQUETA_FRANJA[empresa.budgetBand]}
                  </dd>
                </div>
              )}

              {empresa.objectives.length > 0 && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Le interesa apoyar
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {empresa.objectives.map((objetivo) => (
                      <span
                        key={objetivo}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                      >
                        {ETIQUETA_OBJETIVO[objetivo]}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {/* El correo de la empresa no sale aquí, ni detrás de un botón.
              Se apuntó al directorio para recibir propuestas ordenadas,
              no para que le lleguen correos sueltos de cualquiera. Todo
              pasa por el formulario, que además solo deja una por club. */}
        </div>

        <div className="mt-6">
          {esClub ? (
            <ProponerPatrocinio
              companyId={empresa.id}
              slug={empresa.slug}
              nombreEmpresa={empresa.name}
              yaEscrita={yaEscrita}
            />
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="font-medium text-zinc-900">
                ¿Tienes un club y quieres escribirle a {empresa.name}?
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                Entra con tu club y podrás mandarle una propuesta desde aquí, sin buscar su
                teléfono ni escribir en frío.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                >
                  Entrar con mi club
                </Link>
                <Link
                  href="/registro"
                  className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  Registrar mi club
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
