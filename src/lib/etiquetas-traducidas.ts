import type {
  BudgetPeriod,
  CategoriaNecesidad,
  CollaborationType,
  ObjectiveTag,
  OpportunityStatus,
  OpportunityType,
  SponsorLevel,
  TeamLevel,
} from "@/lib/types";
import type { TipoDeOferta } from "@/lib/empresas";
import type { Responsable } from "@/lib/ficha-oportunidad";
import type { OrdenBusqueda } from "@/lib/search-types";

/**
 * Las etiquetas de los catálogos fijos (tipo de oportunidad, nivel de
 * patrocinio, categoría de lo que se necesita...) en el idioma de quien
 * mira.
 *
 * Las tablas `ETIQUETA_*` de `lib/` siguen existiendo y siguen en
 * español: las usan el panel, los PDF y el dossier, que de momento solo
 * están en español. Las páginas públicas usan esto, que lee los mismos
 * textos de `common.etiquetas` en el idioma de la página.
 *
 * Recibe la función de traducir ya hecha para servir igual en un
 * componente de cliente (`useTranslations`) que en uno de servidor
 * (`await getTranslations`):
 *
 *   const E = etiquetador(useTranslations("common.etiquetas"));
 *   E.tipoOportunidad(oportunidad.opportunityType)
 */
type Traductor = (clave: string) => string;

export function etiquetador(t: Traductor) {
  return {
    tipoOportunidad: (id: OpportunityType) => t(`tipoOportunidad.${id}`),
    estadoOportunidad: (id: OpportunityStatus) => t(`estadoOportunidad.${id}`),
    nivelPatrocinio: (id: SponsorLevel) => t(`nivelPatrocinio.${id}`),
    formaColaboracion: (id: CollaborationType) => t(`formaColaboracion.${id}`),
    periodo: (id: BudgetPeriod) => t(`periodo.${id}`),
    objetivo: (id: ObjectiveTag) => t(`objetivo.${id}`),
    categoriaNecesidad: (id: CategoriaNecesidad) => t(`categoriaNecesidad.${id}`),
    tipoOferta: (id: TipoDeOferta) => t(`tipoOferta.${id}`),
    responsable: (id: Responsable) => t(`responsable.${id}`),
    redSocial: (id: string) => t(`redSocial.${id}`),
    orden: (id: OrdenBusqueda) => t(`orden.${id}`),
    nivelPatrocinioAyuda: (id: SponsorLevel) => t(`nivelPatrocinioAyuda.${id}`),
    nivelEquipo: (id: TeamLevel) => t(`nivelEquipo.${id}`),
    busca: (id: "todo" | "patrocinios" | "necesidades") => t(`busca.${id}`),
  };
}

export type Etiquetas = ReturnType<typeof etiquetador>;
