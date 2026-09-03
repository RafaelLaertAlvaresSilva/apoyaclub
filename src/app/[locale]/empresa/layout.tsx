import { BarraLogo } from "@/components/BarraLogo";

/**
 * Envuelve todas las páginas de `/empresa`.
 *
 * Solo añade la barra del logo: la empresa tampoco tenía forma de volver
 * a la portada desde su zona. El control de acceso lo hace el middleware
 * y, además, cada página y cada Server Action se comprueban a sí mismas.
 */
export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BarraLogo />
      {children}
    </>
  );
}
