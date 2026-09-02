"use client";

import { useEffect } from "react";

/**
 * Último recurso (Fase 15): se muestra cuando el fallo ocurre en el
 * layout raíz, es decir, cuando ni siquiera `[locale]/error.tsx` puede
 * renderizarse. Por eso trae su propio `<html>` y `<body>` y no depende
 * de ningún componente ni de ninguna hoja de estilos de la aplicación:
 * si esta pantalla también fallara, no quedaría nada que enseñar.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f4f5",
          color: "#18181b",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <p style={{ color: "#0d9488", fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>
            ApoyaClub
          </p>
          <h1 style={{ fontSize: "1.5rem", margin: "0.5rem 0 0" }}>
            La aplicación ha dejado de responder
          </h1>
          <p style={{ color: "#52525b", lineHeight: 1.6 }}>
            Ha sido un fallo nuestro. Recarga la página; si sigue pasando, escríbenos y lo
            revisamos.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              backgroundColor: "#14304f",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
          {error.digest ? (
            <p style={{ marginTop: "2rem", color: "#a1a1aa", fontSize: "0.75rem" }}>
              Referencia del error: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
