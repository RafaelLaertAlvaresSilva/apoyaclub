import { Link } from "@/i18n/navigation";
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
          <Link href="/privacidad" className="font-medium text-teal-700 hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>7. Uso indebido de la Plataforma</h2>
        <p>
          Al usar ApoyaClub te comprometes a no hacer nada de lo siguiente:
        </p>
        <ul>
          <li>
            Hacerte pasar por un club, una empresa o una persona que no eres, o crear una
            ficha de un club sin estar autorizado por él.
          </li>
          <li>
            Publicar información falsa o engañosa sobre el club, sus equipos, su audiencia o
            lo que ofrece a un patrocinador.
          </li>
          <li>
            Subir imágenes, vídeos, escudos o marcas sobre los que no tengas derechos, o en
            los que aparezcan personas —y en especial menores— sin su consentimiento o el de
            sus padres o tutores.
          </li>
          <li>
            Usar los datos de contacto que se facilitan en la Plataforma para algo distinto
            de hablar de la colaboración concreta que los motivó. En particular, no se
            pueden usar para enviar publicidad no solicitada, ni incorporarlos a listas de
            correo, ni cederlos o venderlos a terceros.
          </li>
          <li>
            Extraer de forma masiva y automatizada el contenido de la Plataforma, ya sea con
            robots, scripts o cualquier otro medio.
          </li>
          <li>
            Intentar acceder a cuentas, datos o áreas que no te corresponden, o alterar el
            funcionamiento del servicio.
          </li>
          <li>Publicar contenido ilícito, ofensivo o discriminatorio.</li>
        </ul>
        <p>
          Incumplir cualquiera de estos puntos puede suponer la retirada del contenido, la
          suspensión de la cuenta o su cancelación, según la gravedad. Si el incumplimiento
          ha causado un daño a otro usuario o a un tercero, responde quien lo cometió.
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
          Estas condiciones pueden cambiar, por ejemplo si cambian las funciones de la
          Plataforma o la normativa aplicable. Cada versión lleva su fecha de última
          actualización en la cabecera de esta página.
        </p>
        <p>
          Si el cambio afecta de forma relevante a tus derechos o a lo que pagas, te
          avisaremos por correo electrónico con antelación suficiente antes de que entre en
          vigor, y podrás darte de baja sin penalización si no estás de acuerdo. Los cambios
          menores —corregir una redacción, añadir una aclaración— se publican directamente
          en esta página.
        </p>
      </section>

      <section>
        <h2>10. Legislación aplicable y jurisdicción</h2>
        <p>
          Estas condiciones se rigen por la legislación española. Para cualquier
          controversia, las partes se someten a los juzgados y tribunales que correspondan
          conforme a la ley. Cuando el usuario tenga la condición de consumidor, se aplicará
          el fuero que la normativa de consumo le reconozca, que no puede alterarse por
          estas condiciones.
        </p>
      </section>
    </LegalPageShell>
  );
}
