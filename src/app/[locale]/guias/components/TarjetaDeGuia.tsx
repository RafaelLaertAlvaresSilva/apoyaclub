import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { NOMBRE_CATEGORIA, minutosDeLectura, type Guia } from "@/lib/guias";

/** La tarjeta de una guía en el índice y en "Sigue leyendo". */
export function TarjetaDeGuia({ guia, destacada = false }: { guia: Guia; destacada?: boolean }) {
  return (
    <Link
      href={`/guias/${guia.slug}`}
      className={`group flex overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-navy/10 ${
        destacada ? "flex-col lg:grid lg:grid-cols-[1.15fr_1fr]" : "flex-col"
      }`}
    >
      <div className={`relative overflow-hidden bg-zinc-100 ${destacada ? "aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[20rem] lg:bg-brand-navy-dark" : "aspect-[16/9]"}`}>
        <Image
          src={guia.portada}
          alt=""
          fill
          sizes={destacada ? "(min-width: 1024px) 36rem, 100vw" : "(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"}
          className={`transition duration-500 group-hover:scale-[1.03] ${destacada ? "object-cover lg:object-contain" : "object-cover"}`}
        />
      </div>
      <div className={`flex flex-1 flex-col ${destacada ? "p-7 sm:p-10 lg:justify-center" : "p-6"}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
          {NOMBRE_CATEGORIA[guia.categoria]} · {minutosDeLectura(guia)} min
        </p>
        <h3
          className={`mt-2 font-extrabold leading-snug tracking-tight text-titular group-hover:text-accion-tinta ${
            destacada ? "text-2xl sm:text-3xl" : "text-lg"
          }`}
        >
          {guia.titulo}
        </h3>
        <p className={`mt-3 leading-relaxed text-zinc-600 ${destacada ? "text-base sm:text-lg" : "line-clamp-3 text-[0.95rem]"}`}>
          {guia.entradilla}
        </p>
        <span className="mt-auto pt-5 font-semibold text-accion-tinta">Leer la guía →</span>
      </div>
    </Link>
  );
}
