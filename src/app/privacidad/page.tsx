import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_VERSIONS, formatearFechaLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad | ApoyaClub",
};

/**
 * Política de privacidad (Fase 11). PLANTILLA pendiente de revisión
 * jurídica, escrita a partir de lo que la aplicación realmente hace
 * hoy (qué se guarda, dónde, y las herramientas de autoservicio de
 * exportar/eliminar cuenta ya implementadas) para que el abogado
 * ajuste la redacción, no la invente desde cero.
 */
export default function PrivacidadPage() {
  return (
    <LegalPageShell
      titulo="Política de privacidad"
      actualizado={formatearFechaLegal(LEGAL_VERSIONS.privacy)}
    >
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          [Nombre y apellidos / razón social], con [NIF/CIF nº XXXXXXXXX] y domicilio en
          [dirección completa], es el responsable del tratamiento de los datos personales
          recogidos a través de ApoyaClub. Contacto para cuestiones de privacidad: [email de
          contacto].
        </p>
      </section>

      <section>
        <h2>2. Qué datos se recogen</h2>
        <p>Según el tipo de cuenta:</p>
        <ul>
          <li>Cuenta (club y empresa): correo electrónico y contraseña (cifrada).</li>
          <li>
            Perfil del club: nombre, localidad, provincia, código postal, instalaciones,
            web, redes sociales, descripción, logo y fotos, nombre y teléfono de contacto
            (solo si el club decide mostrarlos públicamente), nivel deportivo, historia,
            cifras de audiencia y, sobre la cantera, únicamente totales agregados (número
            de equipos, jugadores y familias — nunca nombres ni fotos individuales de
            menores a través de ese formulario).
          </li>
          <li>
            Perfil de la empresa: nombre, sector, localidad, web, rango de presupuesto
            orientativo y objetivos de patrocinio.
          </li>
          <li>
            Oportunidades de patrocinio publicadas por el club y solicitudes de contacto
            que envía una empresa a un club (incluyen el mensaje escrito por la empresa).
          </li>
          <li>
            Datos de pago: al suscribirse, el club paga a través de Stripe. ApoyaClub no
            almacena el número de tarjeta; Stripe actúa como encargado del tratamiento para
            el cobro.
          </li>
          <li>Registro de consentimientos: qué aceptó cada usuario y cuándo (con fecha).</li>
        </ul>
      </section>

      <section>
        <h2>3. Con qué finalidad y legitimación</h2>
        <p>
          Los datos se usan para crear y gestionar la cuenta, mostrar la página pública del
          club y su catálogo de oportunidades a las empresas, permitir la búsqueda y el
          contacto entre club y empresa, gestionar la suscripción de pago del club, generar
          el dossier comercial en PDF que el propio club solicita y cumplir obligaciones
          legales (facturación, atención de derechos). La base legal es la ejecución del
          contrato de uso de la Plataforma (Condiciones de Uso) y, para las comunicaciones
          entre club y empresa, el interés legítimo de facilitar el contacto que ambas
          partes han buscado activamente.
        </p>
      </section>

      <section>
        <h2>4. Con quién se comparten los datos</h2>
        <p>
          ApoyaClub usa terceros como encargados del tratamiento, que solo tratan los datos
          según sus instrucciones y para prestar el servicio: Supabase (base de datos,
          autenticación y almacenamiento de imágenes), Stripe (pagos y suscripciones),
          Resend (envío de emails transaccionales) y Vercel (alojamiento). Los datos del
          catálogo público de un club (identidad, oportunidades) son visibles para
          cualquier empresa registrada, porque esa visibilidad es el propósito del
          servicio. ApoyaClub no vende datos a terceros.
        </p>
      </section>

      <section>
        <h2>5. Transferencias internacionales</h2>
        <p>
          [Detallar si Supabase/Stripe/Resend/Vercel implican transferencia de datos fuera
          del Espacio Económico Europeo y con qué garantías (cláusulas contractuales tipo,
          adecuación, etc.), según la región de proyecto elegida en cada servicio.
          Redacción pendiente de revisión jurídica.]
        </p>
      </section>

      <section>
        <h2>6. Menores de edad y datos de cantera</h2>
        <p>
          ApoyaClub está pensada para el uso de personas adultas responsables del club o de
          la empresa, no para que la usen directamente menores de edad. Los datos sobre la
          cantera de un club se recogen siempre de forma agregada (totales de equipos,
          jugadores y familias), nunca como nombres, fotos ni fichas individuales de
          menores concretos. Antes de subir cualquier foto a la página del club, la
          Plataforma pide al club confirmar que no incluye a menores identificables sin el
          consentimiento de sus padres o tutores legales; si el club dispone de ese
          consentimiento (por ejemplo, para una foto de equipo autorizada por las familias),
          es responsable de conservar la prueba de dicho consentimiento.
        </p>
      </section>

      <section>
        <h2>7. Plazo de conservación</h2>
        <p>
          Los datos se conservan mientras la cuenta esté activa. Si se elimina la cuenta
          (ver sección 9), se borran de forma permanente, salvo los que la ley obligue a
          conservar por más tiempo (por ejemplo, datos de facturación). [Plazos concretos de
          conservación tras la eliminación, incluyendo el registro de consentimientos:
          pendiente de revisión jurídica.]
        </p>
      </section>

      <section>
        <h2>8. Tus derechos</h2>
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición,
          limitación del tratamiento y portabilidad. Para el acceso y la portabilidad,
          puedes descargar todos tus datos en cualquier momento desde tu panel
          (&quot;Privacidad y datos&quot; → &quot;Descargar mis datos&quot;); para la
          supresión, puedes eliminar tu cuenta y todos sus datos desde el mismo apartado.
          Para el resto de derechos, o si tienes cualquier duda, escribe a [email de
          contacto]. También tienes derecho a reclamar ante la Agencia Española de
          Protección de Datos (www.aepd.es) si consideras que no se han atendido tus
          derechos correctamente.
        </p>
      </section>

      <section>
        <h2>9. Exportar y eliminar tu cuenta</h2>
        <p>
          Desde tu panel puedes, en cualquier momento y sin necesidad de contactar con
          nadie: descargar una copia de todos tus datos en un archivo, y eliminar tu cuenta
          de forma permanente (lo que también cancela cualquier suscripción activa y borra
          tus imágenes).
        </p>
      </section>

      <section>
        <h2>10. Seguridad</h2>
        <p>
          Las contraseñas se guardan cifradas y nunca en texto plano. El acceso a los datos
          de cada cuenta está restringido por permisos a nivel de base de datos (solo el
          propio club o empresa puede leer y escribir sus datos privados), y las
          comunicaciones con la Plataforma viajan cifradas (HTTPS).
        </p>
      </section>

      <section>
        <h2>11. Cookies</h2>
        <p>
          ApoyaClub usa cookies técnicas necesarias y, si las aceptas, cookies adicionales.
          Puedes ver el detalle y cambiar tu elección en la{" "}
          <a href="/cookies" className="font-medium text-emerald-700 hover:underline">
            Política de Cookies
          </a>
          .
        </p>
      </section>

      <section>
        <h2>12. Cambios en esta política</h2>
        <p>
          Si esta política cambia de forma relevante, se avisará en la Plataforma y se
          actualizará la fecha de &quot;última actualización&quot; de esta página.
        </p>
      </section>
    </LegalPageShell>
  );
}
