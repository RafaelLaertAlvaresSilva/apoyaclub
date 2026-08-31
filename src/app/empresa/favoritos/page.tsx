import Link from "next/link";
import { redirect } from "next/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import type { ClubRow } from "@/lib/club-mappers";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { formatoValorOportunidad } from "@/lib/opportunities";
import { createClient } from "@/lib/supabase/server";
import { EmpresaNav } from "../components/EmpresaNav";
import { eliminarFavorito, eliminarListaFavoritos, renombrarListaFavoritos } from "./actions";
import { NuevaListaForm } from "./components/NuevaListaForm";

type FavoritoConOportunidad = {
  id: string;
  list_id: string;
  opportunity_id: string;
  // Embed de PostgREST a través de la FK `opportunity_id` (Fase 8): si
  // la oportunidad ya no es visible (reservada, cerrada, archivada o
  // borrada), la RLS pública de `opportunities` la deja en null en vez
  // de ocultar la fila entera del favorito.
  opportunities: OpportunityRow | null;
};

/** Panel de empresa: listas de favoritos (Fase 8). */
export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    redirect("/login");
  }

  const [{ data: listasRaw }, { data: favoritosRaw }] = await Promise.all([
    supabase
      .from("company_favorite_lists")
      .select("id, name, created_at")
      .eq("company_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("company_favorites")
      .select("id, list_id, opportunity_id, opportunities(*)")
      .eq("company_id", user.id)
      .returns<FavoritoConOportunidad[]>(),
  ]);

  const listas = listasRaw ?? [];
  const favoritos = favoritosRaw ?? [];

  // Los clubes no tienen lectura pública en la propia tabla `clubs`
  // (Fase 4): se leen de la vista `club_public_profiles` (Fase 5), igual
  // que hace la página pública del club.
  const clubIds = Array.from(
    new Set(
      favoritos
        .map((favorito) => favorito.opportunities?.club_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: clubesRaw } =
    clubIds.length > 0
      ? await supabase.from("club_public_profiles").select("id, name, slug").in("id", clubIds)
      : { data: [] as Pick<ClubRow, "id" | "name" | "slug">[] };

  const clubesPorId = new Map((clubesRaw ?? []).map((club) => [club.id, club]));

  const favoritosPorLista = new Map<string, FavoritoConOportunidad[]>();
  for (const favorito of favoritos) {
    const grupo = favoritosPorLista.get(favorito.list_id) ?? [];
    grupo.push(favorito);
    favoritosPorLista.set(favorito.list_id, grupo);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Panel de empresa</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Favoritos</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <EmpresaNav activo="favoritos" />

      <NuevaListaForm />

      {listas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
          Todavía no tienes ninguna lista. Guarda una oportunidad como favorita desde la página de
          un club para crear tu primera lista, o crea una aquí arriba.
        </p>
      ) : (
        <div className="space-y-4">
          {listas.map((lista) => {
            const items = favoritosPorLista.get(lista.id) ?? [];
            return (
              <section key={lista.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <form action={renombrarListaFavoritos} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={lista.id} />
                    <input
                      name="name"
                      defaultValue={lista.name}
                      className="rounded-lg border border-transparent px-2 py-1 text-base font-semibold text-zinc-900 hover:border-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                      Guardar nombre
                    </button>
                  </form>
                  <form action={eliminarListaFavoritos}>
                    <input type="hidden" name="id" value={lista.id} />
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                      Eliminar lista
                    </button>
                  </form>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-zinc-400">Todavía no has guardado ninguna oportunidad aquí.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((favorito) => {
                      const oportunidad = favorito.opportunities
                        ? opportunityRowToOpportunity(favorito.opportunities)
                        : null;
                      const club = oportunidad ? clubesPorId.get(oportunidad.clubId) : null;

                      return (
                        <li
                          key={favorito.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            {oportunidad ? (
                              <>
                                <p className="truncate text-sm font-medium text-zinc-900">
                                  {oportunidad.title}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {club ? (
                                    <Link href={`/club/${club.slug}`} className="hover:underline">
                                      {club.name}
                                    </Link>
                                  ) : (
                                    "Club no disponible"
                                  )}
                                  {" · "}
                                  {formatoValorOportunidad.format(oportunidad.value)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-zinc-400">Esta oportunidad ya no está disponible.</p>
                            )}
                          </div>
                          <form action={eliminarFavorito}>
                            <input type="hidden" name="id" value={favorito.id} />
                            <button
                              type="submit"
                              className="shrink-0 text-xs font-medium text-zinc-500 hover:text-red-600 hover:underline"
                            >
                              Quitar
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
