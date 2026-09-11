import { DatosDelTitular } from "@/components/DatosDelTitular";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_VERSIONS, formatearFechaLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal | ApoyaClub",
};

/**
 * Aviso legal (Fase 11): identificación del titular del sitio según la
 * LSSI-CE. PLANTILLA: los datos entre corchetes son de ejemplo y deben
 * sustituirse por los reales antes de publicar, junto con la revisión
 * de un abogado.
 */
export default function AvisoLegalPage() {
  return (
    <LegalPageShell
      titulo="Aviso legal"
      actualizado={formatearFechaLegal(LEGAL_VERSIONS.legalNotice)}
    >
      <section>
        <h2>1. Titular del sitio web</h2>
        <DatosDelTitular
          introduccion="En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos:"
        />
      </section>

      <section>
        <h2>2. Objeto</h2>
        <p>
          ApoyaClub (en adelante, &quot;la Plataforma&quot;) es un servicio en línea que
          pone en contacto a clubes deportivos con empresas interesadas en patrocinarlos o
          colaborar con ellos. La Plataforma facilita las herramientas (página del club,
          catálogo de oportunidades, buscador, dossier) pero no interviene en la
          negociación, el cierre ni el cobro del patrocinio entre club y empresa, ni actúa
          como agencia ni intermediario de pagos.
        </p>
      </section>

      <section>
        <h2>3. Condiciones de uso</h2>
        <p>
          El acceso y uso de la Plataforma atribuye la condición de usuario y implica la
          aceptación de este aviso legal, de las{" "}
          <Link href="/condiciones-de-uso" className="font-medium text-teal-700 hover:underline">
            Condiciones de Uso
          </Link>{" "}
          y de la{" "}
          <Link href="/privacidad" className="font-medium text-teal-700 hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>4. Propiedad intelectual e industrial</h2>
        <p>
          Los contenidos propios de la Plataforma (diseño, código, marca ApoyaClub, textos e
          imágenes que no sean del club o la empresa) son titularidad del titular del sitio o de sus
          licenciantes. Los contenidos que cada club o empresa publica sobre sí mismo (logo,
          fotos, descripciones) siguen siendo de su propiedad; al publicarlos, autorizan a
          la Plataforma a mostrarlos en el contexto del servicio (su página pública, el
          buscador, el dossier descargable).
        </p>
      </section>

      <section>
        <h2>5. Exclusión de responsabilidad</h2>
        <p>
          [Cláusula de exclusión de responsabilidad estándar: disponibilidad del servicio,
          veracidad de los datos que introducen los clubes y empresas, uso que hagan del
          contacto que se facilitan entre sí, enlaces a terceros, etc. Redacción pendiente
          de revisión jurídica.]
        </p>
      </section>

      <section>
        <h2>6. Legislación aplicable y jurisdicción</h2>
        <p>
          [Legislación española aplicable y fuero para la resolución de controversias.
          Redacción pendiente de revisión jurídica.]
        </p>
      </section>
    </LegalPageShell>
  );
}
