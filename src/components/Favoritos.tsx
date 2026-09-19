"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import {
  alternarFavorito as alternarEnNavegador,
  estaGuardado,
  instantanea,
  instantaneaDelServidor,
  suscribirseAFavoritos,
  type Favorito,
  type TipoFavorito,
} from "@/lib/favoritos";
import { alternarFavoritoEnCuenta } from "@/app/[locale]/favoritos/actions";

/**
 * Los favoritos, para toda la web.
 *
 * Hay dos formas de guardar y la diferencia no puede notarse desde
 * fuera: quien no tiene cuenta guarda en su navegador, quien la tiene
 * guarda en su cuenta. El botón es el mismo y hace lo mismo.
 *
 * Quién es se pregunta una sola vez por carga de página, desde el
 * navegador. Mirarlo en el servidor al pintar cada página tiraría la
 * caché de la ficha del club y del buscador, y un corazón no vale eso.
 */

type Estado = {
  favoritos: Favorito[];
  conCuenta: boolean;
  cargando: boolean;
  alternar: (tipo: TipoFavorito, id: string) => Promise<void>;
};

const Contexto = createContext<Estado | null>(null);

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  // Lo guardado en el navegador, leído como lo que es: un almacén de
  // fuera de React. `useSyncExternalStore` se encarga de que en el
  // servidor salga vacío (allí no hay navegador) y de repintar cuando
  // cambie, sin tener que tocar estado desde un efecto.
  const enElNavegador = useSyncExternalStore(
    suscribirseAFavoritos,
    instantanea,
    instantaneaDelServidor,
  );

  /** Lo de la cuenta, cuando hay cuenta. Null mientras no se sabe. */
  const [deLaCuenta, setDeLaCuenta] = useState<Favorito[] | null>(null);
  const [cargando, setCargando] = useState(true);

  const conCuenta = deLaCuenta !== null;
  const favoritos = deLaCuenta ?? enElNavegador;

  useEffect(() => {
    let vivo = true;

    fetch("/api/favoritos")
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((cuerpo: { conCuenta?: boolean; favoritos?: Favorito[] } | null) => {
        if (!vivo || !cuerpo) return;
        if (cuerpo.conCuenta) setDeLaCuenta(cuerpo.favoritos ?? []);
      })
      .catch(() => {
        // Sin respuesta, se sigue con lo del navegador. Un fallo de red
        // no puede dejar la página sin botones.
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, []);

  const alternar = useCallback(
    async (tipo: TipoFavorito, id: string) => {
      if (!conCuenta) {
        alternarEnNavegador(tipo, id);
        return;
      }

      // Se pinta el cambio antes de que conteste el servidor: esperar
      // medio segundo a que se encienda un corazón se nota mucho.
      const estaba = estaGuardado(favoritos, tipo, id);
      const quitar = (lista: Favorito[]) =>
        lista.filter((favorito) => !(favorito.tipo === tipo && favorito.id === id));

      setDeLaCuenta((actuales) =>
        estaba ? quitar(actuales ?? []) : [...(actuales ?? []), { tipo, id }],
      );

      const resultado = await alternarFavoritoEnCuenta(tipo, id);

      // Si el servidor dice que no, se deshace: es peor un corazón
      // encendido que miente que uno que no se encendió.
      if (resultado && "error" in resultado) {
        setDeLaCuenta((actuales) =>
          estaba ? [...(actuales ?? []), { tipo, id }] : quitar(actuales ?? []),
        );
      }
    },
    [conCuenta, favoritos],
  );

  return (
    <Contexto.Provider value={{ favoritos, conCuenta, cargando, alternar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useFavoritos(): Estado {
  const estado = useContext(Contexto);
  if (!estado) {
    throw new Error("useFavoritos necesita estar dentro de <FavoritosProvider>.");
  }
  return estado;
}

/**
 * El botón de guardar.
 *
 * Un corazón y nada más: sin ventanas, sin registros y sin listas que
 * haya que crearse antes. Guardar algo tiene que costar un clic o no
 * lo hace nadie.
 */
export function BotonFavorito({
  tipo,
  id,
  nombre,
  clases = "",
}: {
  tipo: TipoFavorito;
  id: string;
  /** Lo que se guarda, para que un lector de pantalla lo diga. */
  nombre: string;
  clases?: string;
}) {
  const { favoritos, alternar, cargando } = useFavoritos();
  const guardado = estaGuardado(favoritos, tipo, id);

  return (
    <button
      type="button"
      onClick={() => void alternar(tipo, id)}
      aria-pressed={guardado}
      aria-label={guardado ? `Quitar ${nombre} de guardados` : `Guardar ${nombre}`}
      title={guardado ? "Quitar de guardados" : "Guardar para luego"}
      className={`rounded-lg p-1.5 text-lg leading-none transition-colors ${
        guardado ? "text-red-600 hover:bg-red-50" : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500"
      } ${cargando ? "opacity-60" : ""} ${clases}`}
    >
      <span aria-hidden="true">{guardado ? "♥" : "♡"}</span>
    </button>
  );
}
