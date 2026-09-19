"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BotonFavorito, useFavoritos } from "@/components/Favoritos";
import { Link } from "@/i18n/navigation";

type ClubGuardado = {
  id: string;
  slug: string;
  nombre: string;
  donde: string;
  logoUrl: string | null;
};

type OportunidadGuardada = {
  id: string;
  titulo: string;
  clubSlug: string;
  clubNombre: string;
  esNecesidad: boolean;
};

/**
 * Lo que la empresa ha guardado.
 *
 * Se pinta en el navegador porque quien no tiene cuenta guarda ahí: el
 * servidor no sabe nada de esa lista y no puede pintarla.
 */
export function ListaDeGuardados() {
  const { favoritos, conCuenta, cargando } = useFavoritos();

  /**
   * Lo que contestó el servidor, junto con la lista que se le preguntó.
   *
   * Van juntos en un solo estado a propósito: así "¿esto que enseño
   * corresponde a lo que hay guardado ahora?" se responde comparando, y
   * no hace falta un segundo estado de "estoy cargando" que habría que
   * encender desde dentro del efecto.
   */
  const [respuesta, setRespuesta] = useState<{
    clave: string;
    clubes: ClubGuardado[];
    oportunidades: OportunidadGuardada[];
  } | null>(null);

  // Los identificadores no sirven para enseñar nada: hay que pedir los
  // nombres. Se vuelve a pedir cada vez que cambia la lista.
  const clave = favoritos.map((favorito) => `${favorito.tipo}:${favorito.id}`).sort().join("|");

  useEffect(() => {
    if (cargando || favoritos.length === 0) return;

    let vivo = true;

    fetch("/api/favoritos/detalles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoritos }),
    })
      .then((contestacion) => (contestacion.ok ? contestacion.json() : null))
      .then((cuerpo: { clubes?: ClubGuardado[]; oportunidades?: OportunidadGuardada[] } | null) => {
        if (!vivo || !cuerpo) return;
        setRespuesta({
          clave,
          clubes: cuerpo.clubes ?? [],
          oportunidades: cuerpo.oportunidades ?? [],
        });
      })
      .catch(() => {
        // Sin red no hay nada que enseñar; el aviso de abajo lo cuenta.
      });

    return () => {
      vivo = false;
    };
    // `clave` resume la lista: sin ella, esto se volvería a pedir en
    // cada render, porque `favoritos` es un array nuevo cada vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, cargando]);

  if (cargando) {
    return <p className="text-sm text-zinc-500">Un momento…</p>;
  }

  if (favoritos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="font-medium text-zinc-900">Todavía no has guardado nada.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Pulsa el corazón en cualquier club u oportunidad y aparecerá aquí, para volver cuando
          tengas tiempo de mirarlo con calma.
        </p>
        <Link
          href="/buscar"
          className="mt-4 inline-block rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
        >
          Buscar clubes
        </Link>
      </div>
    );
  }

  // Solo vale lo que corresponde a lo que hay guardado ahora mismo: si
  // acaban de quitar algo, lo de antes no se enseña.
  const alDia = respuesta?.clave === clave ? respuesta : null;
  const clubesVisibles = alDia?.clubes ?? [];
  const oportunidadesVisibles = alDia?.oportunidades ?? [];

  const nadaQueEnsenar =
    !!alDia && clubesVisibles.length === 0 && oportunidadesVisibles.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Lo guardado puede dejar de existir: un club que se da de baja
          desaparece de las vistas públicas. Es mejor decirlo que dejar
          la página en blanco sin explicación. */}
      {nadaQueEnsenar && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Lo que tenías guardado ya no está disponible. Puede que esos clubes hayan dejado
          ApoyaClub.
        </p>
      )}

      {clubesVisibles.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Clubes</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {clubesVisibles.map((club) => (
              <li
                key={club.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4"
              >
                {club.logoUrl ? (
                  <Image
                    src={club.logoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain p-1"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-zinc-300" />
                )}

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/club/${club.slug}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {club.nombre}
                  </Link>
                  {club.donde && <p className="text-xs text-zinc-500">{club.donde}</p>}
                </div>

                <BotonFavorito tipo="club" id={club.id} nombre={club.nombre} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {oportunidadesVisibles.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Oportunidades</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {oportunidadesVisibles.map((oportunidad) => (
              <li
                key={oportunidad.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  {oportunidad.esNecesidad && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
                      Lo necesitan
                    </p>
                  )}
                  <p className="font-medium text-zinc-900">{oportunidad.titulo}</p>
                  <Link
                    href={`/club/${oportunidad.clubSlug}`}
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    {oportunidad.clubNombre}
                  </Link>
                </div>

                <BotonFavorito
                  tipo="oportunidad"
                  id={oportunidad.id}
                  nombre={oportunidad.titulo}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* La verdad sobre dónde vive esto. Quien guarda cosas sin cuenta
          tiene que saber que se quedan en este navegador, o se llevará
          el disgusto el día que mire desde el móvil. */}
      {!conCuenta && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Esto se guarda solo en este navegador: desde otro dispositivo no lo verás, y si borras
          los datos de navegación se pierde.{" "}
          <Link href="/registro-empresa" className="font-medium text-brand-teal-dark underline">
            Crea una cuenta gratis
          </Link>{" "}
          y se te guarda en todos. Lo que ya tienes marcado se viene contigo.
        </p>
      )}
    </div>
  );
}
