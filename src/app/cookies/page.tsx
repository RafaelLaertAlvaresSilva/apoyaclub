import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_VERSIONS, formatearFechaLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de cookies | ApoyaClub",
};

/**
 * Política de cookies (Fase 11). PLANTILLA pendiente de revisión
 * jurídica. Describe las cookies que la aplicación usa hoy: sesión de
 * Supabase Auth (técnica, necesaria) y la propia elección del banner de
 * cookies (técnica). Si en el futuro se añade analítica o publicidad,
 * esta página y el banner deben actualizarse antes de activarlas.
 */
export default function CookiesPage() {
  return (
    <LegalPageShell titulo="Política de cookies" actualizado={formatearFechaLegal(LEGAL_VERSIONS.cookies)}>
      <section>
        <h2>1. Qué son las cookies</h2>
        <p>
          Las cookies son pequeños archivos que un sitio web guarda en tu navegador para
          recordar información entre visitas, como el hecho de haber iniciado sesión o la
          elección que hagas en un banner como este.
        </p>
      </section>

      <section>
        <h2>2. Cookies técnicas (siempre activas)</h2>
        <p>
          Son necesarias para que la Plataforma funcione y no requieren tu consentimiento.
          En ApoyaClub son:
        </p>
        <ul>
          <li>
            Cookies de sesión de Supabase Auth: mantienen tu sesión iniciada como club o
            empresa mientras navegas por tu panel.
          </li>
          <li>
            Cookie de preferencia de cookies: guarda si has aceptado o rechazado las
            cookies no técnicas, para no volver a preguntártelo en cada visita.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Cookies no técnicas</h2>
        <p>
          Actualmente ApoyaClub no instala cookies de analítica, publicidad ni redes
          sociales. Si en el futuro se incorporan, se detallarán aquí (finalidad,
          proveedor y duración) y solo se activarán si las aceptas expresamente en el
          banner de cookies.
        </p>
      </section>

      <section>
        <h2>4. Cómo gestionar tu elección</h2>
        <p>
          Puedes aceptar o rechazar las cookies no técnicas en el banner que aparece en tu
          primera visita, con la misma facilidad en ambos casos. También puedes borrar las
          cookies ya guardadas desde la configuración de tu propio navegador en cualquier
          momento.
        </p>
      </section>
    </LegalPageShell>
  );
}
