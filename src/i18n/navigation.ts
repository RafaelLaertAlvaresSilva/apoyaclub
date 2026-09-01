import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * Fase 14: sustitutos de `next/link` y `next/navigation` que ya saben
 * anteponer el idioma actual a cualquier ruta interna. Se usan exactamente
 * igual que los originales de Next.js; la única diferencia es de dónde se
 * importan:
 *
 *   import Link from "next/link"              -> import { Link } from "@/i18n/navigation"
 *   import { redirect } from "next/navigation" -> import { redirect } from "@/i18n/navigation"
 *   import { useRouter } from "next/navigation" -> import { useRouter } from "@/i18n/navigation"
 *   import { usePathname } from "next/navigation" -> import { usePathname } from "@/i18n/navigation"
 *
 * `notFound` y `useSearchParams` no dependen del idioma y se siguen
 * importando de `next/navigation` tal cual.
 */
export const { Link, redirect, permanentRedirect, useRouter, usePathname, getPathname } =
  createNavigation(routing);
