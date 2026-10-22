/** Una fila del listado de empresas del admin (migración 0055). */
export type EmpresaAdminRow = {
  id: string;
  name: string;
  slug: string | null;
  sector: string | null;
  lugar: string;
  email: string | null;
  createdAt: string;
  /** Si ha guardado su ficha: sin ella no hay nada que suspender ni esconder. */
  fichaCreada: boolean;
  /** Si ella misma ha marcado salir en el directorio. */
  enElDirectorio: boolean;
  avisosActivados: boolean;
  ofertasActivas: number;
  propuestasRecibidas: number;
  guardados: number;
  suspended: boolean;
  modoPruebas: boolean;
};
