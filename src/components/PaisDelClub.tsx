"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * El país del club que está usando el panel (el de su cuenta, ver
 * `lib/paises.ts`), para que el panel enseñe sus precios en SU moneda:
 * reales para un club de Brasil, euros para uno de España o Portugal,
 * lea la web en el idioma que la lea (pedido por Rafael el 6-11-2026).
 *
 * Lo pone el layout del panel; fuera del panel vale null (euros).
 */
const Contexto = createContext<string | null>(null);

export function PaisDelClubProvider({ pais, children }: { pais: string | null; children: ReactNode }) {
  return <Contexto.Provider value={pais}>{children}</Contexto.Provider>;
}

export function usePaisDelClub(): string | null {
  return useContext(Contexto);
}
