import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { BarraLogo } from "@/components/BarraLogo";
import { FondoDeAcceso } from "@/components/FondoDeAcceso";
import { logosDelIdioma } from "@/lib/logos";

/**
 * El marco de las pantallas de acceso: entrar, registrarse, recuperar la
 * contraseña.
 *
 * En el ordenador es una tarjeta partida en dos, como en las
 * plataformas grandes: a la izquierda, en el azul de la marca, qué es
 * ApoyaClub y tres cosas que el club tiene dentro; a la derecha, el
 * formulario. Quien entra por primera vez sabe dónde está sin salir de
 * la página. En el teléfono solo va el formulario: el panel azul no
 * cabe al lado y encima empujaría los campos fuera de la pantalla.
 *
 * Los tres puntos son herramientas que existen de verdad (ver
 * `home.herramientas.lista`), no promesas.
 */
const ICONOS_DE_LOS_PUNTOS = [
  // La página del club
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
  // Oportunidades y dossier
  "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8",
  // Tareas y avisos
  "m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("auth.panelLateral");
  const logos = logosDelIdioma(useLocale());
  const puntos = t.raw("puntos") as string[];

  return (
    <>
      <BarraLogo />
      <div className="relative isolate flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
        <FondoDeAcceso />

        {/* La sombra grande despega la tarjeta de la foto de fondo. */}
        <div className="grid w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-navy/15 ring-1 ring-zinc-200 lg:max-w-5xl lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark p-10 lg:block">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-teal/25 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-brand-teal/15 blur-3xl" />

            {/* Todo arriba, a la altura del título del formulario: en
                los formularios largos (registrar el club) la tarjeta es
                mucho más alta que el texto, y con el texto pegado abajo
                quedaba un hueco azul vacío enorme encima. */}
            <div className="relative">
            <Image src={logos.oscuro} alt="ApoyaClub" width={218} height={48} className="h-11 w-auto" />

            <div className="pt-10">
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-sobre-color">{t("titulo")}</h2>
              <p className="mt-3 leading-relaxed text-sobre-color/75">{t("texto")}</p>

              <ul className="mt-8 space-y-4">
                {puntos.map((punto, indice) => (
                  <li key={punto} className="flex items-center gap-3.5">
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-sobre-color/10 text-brand-teal ring-1 ring-sobre-color/15">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d={ICONOS_DE_LOS_PUNTOS[indice] ?? ICONOS_DE_LOS_PUNTOS[0]} />
                      </svg>
                    </span>
                    <span className="text-[15px] font-semibold text-sobre-color/90">{punto}</span>
                  </li>
                ))}
              </ul>
            </div>
            </div>
          </aside>

          <main id="contenido" className="p-8 sm:p-10 lg:p-12">{children}</main>
        </div>
      </div>
    </>
  );
}
