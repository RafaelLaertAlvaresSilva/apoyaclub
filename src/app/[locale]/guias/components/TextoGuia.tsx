import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { trozosDe } from "@/lib/guias";

/**
 * Pinta el texto de una guía con sus dos marcas: **negrita** y
 * [enlaces](/ruta). Los enlaces internos van con el idioma delante (los
 * pone `Link`); los de fuera se abren en otra pestaña. El análisis está
 * en `trozosDe` (`lib/guias`), que se prueba sin React.
 */
export function TextoGuia({ texto }: { texto: string }): ReactNode {
  return trozosDe(texto).map((trozo, i) => {
    if (trozo.tipo === "negrita") {
      return (
        <strong key={i} className="font-semibold text-titular">
          {trozo.texto}
        </strong>
      );
    }
    if (trozo.tipo === "enlace") {
      const clase = "font-semibold text-accion-tinta underline decoration-brand-teal/40 underline-offset-4 hover:decoration-brand-teal";
      return trozo.href.startsWith("/") ? (
        <Link key={i} href={trozo.href} className={clase}>
          {trozo.texto}
        </Link>
      ) : (
        <a key={i} href={trozo.href} className={clase} target="_blank" rel="noopener noreferrer">
          {trozo.texto}
        </a>
      );
    }
    return <Fragment key={i}>{trozo.texto}</Fragment>;
  });
}
