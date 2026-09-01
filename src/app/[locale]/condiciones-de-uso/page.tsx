import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_VERSIONS, formatearFechaLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Condiciones de uso | ApoyaClub",
};

/**
 * Condiciones de uso (Fase 11). PLANTILLA pendiente de revisión
 * jurídica: describe el modelo de negocio ya acordado (club de pago,
 * empresa gratis, 0% de comisión, sin gestión del cobro del
 * patrocinio) para que el abogado parta de la realidad del servicio,
 * no de un texto genérico.
 */
export default function CondicionesDeUsoPage() {
  return (
    <LegalPageShell
      titulo="Condiciones de uso"
      actualizado={formatearFechaLegal(LEGAL_VERSIONS.terms)}
    >
      <section>
        <h2>1. Qué es ApoyaClub</h2>
        <p>
          ApoyaClub es una plataforma que conecta clubes deportivos con empresas que
          quieren patrocinarlos o colaborar con ellos. El club publica su página, su
          catálogo de oportunidades de patrocinio y, si quiere, un dossier descargable; la
          empresa busca y filtra esas oportunidades y contacta directamente con el club que
          le interese.
        </p>
      </section>

      <section>
        <h2>2. La Plataforma no interviene en el acuerdo</h2>
        <p>
          ApoyaClub pone a disposición las herramientas (página, catálogo, buscador,
          dossier, mensajes de contacto), pero no participa en la negociación ni en el
          cierre del patrocinio, no gestiona ni cobra ningún pago entre el club y la
          empresa, y no actúa como agencia ni intermediario. El acuerdo comercial, sus
          condiciones y su cumplimiento son responsabilidad exclusiva del club y de la
          empresa. La Plataforma no cobra comisión alguna sobre esos acuerdos.
        </p>
      </section>

      <section>
        <h2>3. Cuenta de club: precio y suscripción</h2>
        <p>
          El registro del club incluye un primer mes de acceso gratuito. Transcurrido ese
          mes, el uso continuado de la Plataforma tiene un coste de 29,90 €/mes (IVA
          incluido), gestionado mediante suscripción recurrente a través de Stripe. El club
          puede cancelar la suscripción en cualquier momento desde su panel; el acceso a las
          funciones de pago se mantiene hasta el final del periodo ya abonado. Si la
          suscripción no está activa, el club conserva sus datos, pero su página pública y
          sus oportunidades dejan de ser visibles para las empresas.
        </p>
      </section>

      <section>
        <h2>4. Cuenta de empresa</h2>
        <p>El acceso para empresas es y será gratuito.</p>
      </section>

      <section>
        <h2>5. Veracidad de los datos y contenidos publicados</h2>
        <p>
          Cada club y cada empresa son responsables de la veracidad, exactitud y legalidad
          de los datos y contenidos que publican en su perfil (identidad, cifras, fotos,
          catálogo de oportunidades, mensajes de contacto). ApoyaClub no verifica de forma
          activa esos contenidos, aunque puede retirarlos si tiene conocimiento de que
          infringen la ley, estas condiciones o derechos de terceros.
        </p>
      </section>

      <section>
        <h2>6. Datos de menores</h2>
        <p>
          Los clubes con cantera pueden gestionar datos relacionados con menores de edad.
          Al usar la Plataforma, el club se compromete a cumplir las indicaciones
          específicas al respecto que se muestran en su panel (datos de cantera solo
          agregados, y consentimiento antes de subir cualquier foto en la que se pueda
          identificar a un menor) y a contar con el consentimiento necesario de los padres
          o tutores legales cuando corresponda. Más detalle en la{" "}
          <a href="/privacidad" className="font-medium text-emerald-700 hover:underline">
            Política de Privacidad
          </a>
          .
        </p>
      </section>

      <section>
        <h2>7. Uso indebido de la Plataforma</h2>
        <p>
          [Listado de conductas prohibidas: suplantación, contenido ilícito o engañoso, uso
          del contacto facilitado por otro usuario con fines distintos a los previstos,
          scraping masivo, etc. Redacción pendiente de revisión jurídica.]
        </p>
      </section>

      <section>
        <h2>8. Baja y eliminación de la cuenta</h2>
        <p>
          El club o la empresa pueden eliminar su cuenta en cualquier momento desde su
          panel, en la sección &quot;Privacidad y datos&quot;. La eliminación cancela
          cualquier suscripción activa y borra de forma permanente los datos e imágenes
          asociados a la cuenta, salvo lo que la ley obligue a conservar.
        </p>
      </section>

      <section>
        <h2>9. Modificación de estas condiciones</h2>
        <p>
          [Cláusula sobre cómo y con qué antelación se comunican los cambios a estas
          condiciones. Redacción pendiente de revisión jurídica.]
        </p>
      </section>

      <section>
        <h2>10. Legislación aplicable y jurisdicción</h2>
        <p>
          [Legislación española aplicable y fuero para la resolución de controversias.
          Redacción pendiente de revisión jurídica.]
        </p>
      </section>
    </LegalPageShell>
  );
}
