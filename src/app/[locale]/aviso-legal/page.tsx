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
          La Plataforma pone en contacto a clubes y empresas, y ahí termina su papel. No
          participa en la negociación, no fija las condiciones del patrocinio, no cobra
          comisión alguna sobre él y no responde de que el acuerdo entre las partes se
          cumpla, ni del dinero, los bienes o los servicios que se intercambien.
        </p>
        <p>
          La información que se publica en la ficha de un club o de una empresa la
          introduce esa misma parte y es ella quien responde de su veracidad y de tener
          derecho a publicarla, incluidas las imágenes. La Plataforma no la verifica una
          por una; puede retirar o corregir cualquier contenido que resulte falso, ilícito
          o contrario a estas condiciones.
        </p>
        <p>
          El servicio se presta tal y como está y se procura mantenerlo disponible, pero no
          se garantiza que funcione sin interrupciones ni errores. Pueden producirse paradas
          por mantenimiento, por fallos de los proveedores técnicos o por causas ajenas.
        </p>
        <p>
          La Plataforma puede enlazar a sitios de terceros (la web de un club, la de una
          empresa, herramientas recomendadas). Esos sitios son ajenos y la Plataforma no
          responde de su contenido ni de lo que ocurra en ellos.
        </p>
      </section>

      <section>
        <h2>6. Legislación aplicable y jurisdicción</h2>
        <p>
          Estas condiciones se rigen por la legislación española. Para cualquier
          controversia, las partes se someten a los juzgados y tribunales que correspondan
          conforme a la ley. Cuando el usuario tenga la condición de consumidor, se aplicará
          el fuero que la normativa de consumo le reconozca, que no puede alterarse por este
          aviso.
        </p>
      </section>
    </LegalPageShell>
  );
}
