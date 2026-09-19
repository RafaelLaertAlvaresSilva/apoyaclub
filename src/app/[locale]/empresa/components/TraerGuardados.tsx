"use client";

import { useEffect, useState } from "react";
import { leerFavoritos, vaciarFavoritos } from "@/lib/favoritos";
import { subirFavoritosDelNavegador } from "../../favoritos/actions";

/**
 * Lo que la empresa había guardado sin cuenta, a su cuenta.
 *
 * Es la pasarela entre las dos formas de guardar. La empresa marca
 * clubes sin registrarse, un día se registra, y al entrar en su panel
 * se lo encuentra todo donde debe estar. Sin esto, registrarse
 * castigaría por haber empezado sin cuenta — justo al revés de lo que
 * interesa.
 *
 * No pinta nada mientras no hay nada que traer, que es lo normal.
 */
export function TraerGuardados() {
  const [subidos, setSubidos] = useState<number | null>(null);

  useEffect(() => {
    const guardados = leerFavoritos();
    if (guardados.length === 0) return;

    let vivo = true;

    void subirFavoritosDelNavegador(guardados).then((resultado) => {
      if (!vivo || "error" in resultado) return;

      // La cesta se vacía solo cuando el servidor ha dicho que sí. Si
      // falla, se queda donde estaba y se reintenta la próxima vez.
      vaciarFavoritos();
      setSubidos(resultado.subidos);
    });

    return () => {
      vivo = false;
    };
  }, []);

  if (!subidos) return null;

  return (
    <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
      Hemos traído a tu cuenta {subidos === 1 ? "lo que tenías guardado" : `las ${subidos} cosas que tenías guardadas`}{" "}
      en este navegador. Ahora las verás desde cualquier dispositivo.
    </p>
  );
}
