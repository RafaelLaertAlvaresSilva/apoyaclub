import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";
import { FormularioContacto } from "./components/FormularioContacto";

/**
 * Landing de conversión (Fase 13). Sustituye a la home mínima de las
 * fases anteriores: dos caminos claros (club / empresa), con su propio
 * problema, solución, ejemplo visual, precio y llamada a la acción, más
 * las secciones compartidas (cómo funciona, preguntas frecuentes,
 * fiscalidad y contacto). El resto del sitio no cambia: el Footer con
 * los enlaces legales lo sigue poniendo `app/layout.tsx`.
 */
export const metadata: Metadata = {
  title: "ApoyaClub — Conecta tu club deportivo con empresas patrocinadoras",
  description:
    "Publica la página de tu club y tus oportunidades de patrocinio, desde 50 € hasta el patrocinio principal. Las empresas buscan y contactan directamente. Sin comisiones.",
};

const PROBLEMAS_CLUB = [
  {
    titulo: "No sabes cómo presentar tu valor",
    texto:
      "Sin una página profesional, tu club es solo un nombre y un escudo. Las empresas no ven lo que de verdad ofreces: equipos, cantera, audiencia, comunidad.",
  },
  {
    titulo: "Dependes de la camiseta y la pancarta",
    texto:
      "El patrocinio se reduce a “ponme el logo en la equipación”, sin más opciones ni forma de destacar oportunidades concretas.",
  },
  {
    titulo: "Pierdes renovaciones cada temporada",
    texto:
      "Sin visibilidad constante ante nuevas empresas, cada temporada tienes que volver a buscar patrocinador casi desde cero.",
  },
] as const;

const EJEMPLOS_OPORTUNIDADES = [
  { titulo: "Publicidad en la equipación", precio: "150 €/temporada" },
  { titulo: "Contenido en redes sociales", precio: "50 €/mes" },
  { titulo: "Naming del pabellón", precio: "Patrocinio principal" },
] as const;

const ESTADISTICAS_EJEMPLO = [
  "Seguidores en redes",
  "Alcance estimado",
  "Asistencia media",
  "Jugadores en cantera",
] as const;

const PASOS_CLUB = [
  {
    titulo: "Crea la página de tu club",
    texto: "Cuéntanos sobre tus equipos, tu cantera, tu audiencia, tus instalaciones y tu comunidad.",
  },
  {
    titulo: "Publica tus oportunidades",
    texto: "Desde 50 € hasta el patrocinio principal: tú decides qué ofreces y a qué precio.",
  },
  {
    titulo: "Recibe solicitudes de empresas",
    texto: "Las empresas te encuentran y te contactan directamente. Vosotros negociáis el acuerdo.",
  },
] as const;

const PASOS_EMPRESA = [
  {
    titulo: "Busca por zona, deporte y presupuesto",
    texto: "Filtra entre los clubes y oportunidades que encajan con lo que buscas.",
  },
  {
    titulo: "Descubre el club a fondo",
    texto: "Equipos, cantera, audiencia y comunidad: la información que necesitas para decidir.",
  },
  {
    titulo: "Contacta directamente",
    texto: "Sin intermediarios ni comisiones. El acuerdo es siempre entre vosotros dos.",
  },
] as const;

const PREGUNTAS_FRECUENTES = [
  {
    pregunta: "¿Qué es exactamente ApoyaClub?",
    respuesta:
      "Una plataforma que conecta clubes deportivos con empresas que quieren patrocinarlos. El club publica una página con su valor real y un catálogo de oportunidades de patrocinio; la empresa busca, filtra y contacta directamente con el club.",
  },
  {
    pregunta: "¿Cuánto cuesta para un club?",
    respuesta: "El primer mes es gratis. Después, 29,90 €/mes con el IVA incluido, sin sorpresas en el precio.",
  },
  {
    pregunta: "¿Es gratis para las empresas?",
    respuesta: "Sí. Buscar clubes, ver sus páginas y contactar con ellos no tiene ningún coste para la empresa.",
  },
  {
    pregunta: "¿ApoyaClub cobra alguna comisión sobre el patrocinio?",
    respuesta:
      "No, la comisión es del 0 %. El club y la empresa negocian y acuerdan las condiciones directamente entre ellos.",
  },
  {
    pregunta: "¿Cómo se paga el patrocinio?",
    respuesta:
      "ApoyaClub no gestiona el cobro ni actúa como agencia: el pago y el resto del acuerdo se gestionan directamente entre el club y la empresa, por el medio que ambos decidáis.",
  },
  {
    pregunta: "¿Puedo cancelar cuando quiera?",
    respuesta:
      "Sí. Desde el panel del club puedes cancelar tu suscripción cuando quieras y seguirás teniendo acceso hasta el final del periodo ya pagado.",
  },
] as const;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rol = user?.app_metadata?.role as Role | undefined;
  const accesoDirecto = user && rol ? { href: RUTA_POR_ROL[rol], etiqueta: "Ir a mi panel" } : null;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
            Apoya<span className="text-emerald-600">Club</span>
          </Link>

          {accesoDirecto ? (
            <Link
              href={accesoDirecto.href}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              {accesoDirecto.etiqueta}
            </Link>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/login" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:inline">
                Iniciar sesión
              </Link>
              <Link
                href="/registro-club"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Crea la página de tu club
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: los dos caminos, uno al lado del otro */}
        <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              El punto de encuentro entre clubes deportivos y sus patrocinadores
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">
              Los clubes muestran su valor real — equipos, cantera, audiencia, instalaciones, comunidad — y publican
              oportunidades de patrocinio desde 50 € hasta el patrocinio principal. Las empresas buscan, filtran y
              contactan directamente. Sin comisiones.
            </p>

            <div className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-emerald-700">Para clubes</p>
                <p className="mt-1 text-zinc-600">
                  Crea tu página, publica tus oportunidades y que las empresas te encuentren.
                </p>
                <Link
                  href="/registro-club"
                  className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Crea la página de tu club
                </Link>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-emerald-700">Para empresas</p>
                <p className="mt-1 text-zinc-600">
                  Busca clubes de tu zona y patrocina desde 50 €. Acceso gratuito.
                </p>
                <Link
                  href="/buscar"
                  className="mt-4 inline-block rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  Explorar clubes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Para clubes */}
        <section id="clubes" className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Para clubes</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Consigue el patrocinio que tu club merece
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {PROBLEMAS_CLUB.map((problema) => (
                <div key={problema.titulo} className="rounded-xl border border-zinc-200 bg-white p-6">
                  <h3 className="font-semibold text-zinc-900">{problema.titulo}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{problema.texto}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Tu página profesional, siempre visible</h3>
                <p className="mt-3 text-zinc-600">
                  En vez de un logo suelto en una camiseta, tu club tiene una página propia con todo lo que lo hace
                  valioso: equipos, cantera, audiencia, instalaciones y comunidad. Y un catálogo de oportunidades de
                  patrocinio concretas, con su precio, para que cualquier empresa sepa exactamente cómo colaborar.
                </p>
                <p className="mt-3 text-zinc-600">
                  Tú decides qué ofreces y a qué precio, desde 50 € hasta el patrocinio principal.
                </p>
              </div>

              {/* Ejemplo visual: cómo se ve la página pública del club */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
                  <span className="ml-2 truncate text-xs text-zinc-400">apoyaclub.com/club/tu-club</span>
                </div>
                <div className="h-28 bg-gradient-to-br from-emerald-600 to-emerald-800 sm:h-32" />
                <div className="space-y-4 bg-white p-5">
                  <div>
                    <div className="h-4 w-40 rounded bg-zinc-800/90" />
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Fútbol</span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Cantera</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
                    {ESTADISTICAS_EJEMPLO.map((etiqueta) => (
                      <div key={etiqueta} className="rounded-lg bg-zinc-50 px-3 py-2">
                        <p className="text-xs text-zinc-500">{etiqueta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <p className="text-center text-sm text-zinc-500">Ejemplos de oportunidades que puedes publicar</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {EJEMPLOS_OPORTUNIDADES.map((oportunidad) => (
                  <div key={oportunidad.titulo} className="rounded-xl border border-zinc-200 bg-white p-5">
                    <h4 className="font-semibold text-zinc-900">{oportunidad.titulo}</h4>
                    <p className="mt-1 text-lg font-bold text-emerald-700">{oportunidad.precio}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Precio transparente</p>
              <p className="mt-2">
                <span className="text-4xl font-bold text-zinc-900">29,90 €</span>
                <span className="text-zinc-500">/mes, IVA incluido</span>
              </p>
              <p className="mt-1 text-emerald-700">El primer mes es gratis</p>
              <p className="mt-4 text-sm text-zinc-600">
                Comisión: 0 %. Tú y la empresa negociáis directamente, sin agencia de por medio.
              </p>
              <Link
                href="/registro-club"
                className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Crea la página de tu club
              </Link>
            </div>
          </div>
        </section>

        {/* Para empresas */}
        <section id="empresas" className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Para empresas</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Encuentra el club perfecto para tu marca
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
                Busca clubes de tu zona y filtra por deporte, presupuesto y objetivo. Patrocina desde 50 € hasta el
                patrocinio principal, con acceso siempre gratuito.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-zinc-900">Busca por zona, deporte, presupuesto y objetivo</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Filtra entre todos los clubes registrados hasta encontrar los que de verdad encajan contigo.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-zinc-900">Patrocina desde 50 €</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Desde una colaboración puntual hasta el patrocinio principal de un club: eliges tú.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-zinc-900">Acceso gratuito</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Buscar, ver la página de cada club y contactar con ellos no tiene ningún coste para tu empresa.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/buscar"
                className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Explorar clubes
              </Link>
            </div>
          </div>
        </section>

        {/* Cómo funciona en 3 pasos */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Cómo funciona en 3 pasos
            </h2>

            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Si eres un club</p>
                <ol className="mt-4 space-y-6">
                  {PASOS_CLUB.map((paso, indice) => (
                    <li key={paso.titulo} className="flex gap-4">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                        {indice + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-zinc-900">{paso.titulo}</h3>
                        <p className="mt-1 text-sm text-zinc-600">{paso.texto}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Si eres una empresa</p>
                <ol className="mt-4 space-y-6">
                  {PASOS_EMPRESA.map((paso, indice) => (
                    <li key={paso.titulo} className="flex gap-4">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                        {indice + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-zinc-900">{paso.titulo}</h3>
                        <p className="mt-1 text-sm text-zinc-600">{paso.texto}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Preguntas frecuentes
            </h2>

            <div className="mt-8 space-y-3">
              {PREGUNTAS_FRECUENTES.map((item) => (
                <details
                  key={item.pregunta}
                  className="group rounded-xl border border-zinc-200 bg-white p-5 open:border-emerald-200"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-900 marker:content-none">
                    {item.pregunta}
                    <span className="flex-none text-zinc-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-600">{item.respuesta}</p>
                </details>
              ))}
            </div>

            {/* Fiscalidad: aviso de que no se ofrece asesoramiento fiscal */}
            <div
              role="alert"
              className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"
            >
              <p className="font-semibold">Sobre la fiscalidad del patrocinio</p>
              <p className="mt-1">
                Un acuerdo de patrocinio entre un club y una empresa puede tener implicaciones fiscales (IVA,
                facturación, deducciones…) para ambas partes. ApoyaClub no gestiona el cobro ni actúa como agencia, y{" "}
                <strong>no ofrece asesoramiento fiscal</strong>: te recomendamos consultar con un asesor fiscal o
                gestoría antes de cerrar cualquier acuerdo.
              </p>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              ¿Tienes dudas? Escríbenos
            </h2>
            <p className="mt-3 text-center text-zinc-600">
              Ya seas un club, una empresa o simplemente tengas una pregunta, cuéntanoslo y te respondemos por email.
            </p>

            <div className="mt-8">
              <FormularioContacto />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
