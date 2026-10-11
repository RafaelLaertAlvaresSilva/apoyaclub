import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAXIMO_POR_PATROCINADOR,
  TAMANO_MAXIMO_BYTES,
  agruparPorPatrocinador,
  esTipoValido,
  extensionDe,
  filaADocumento,
  mensajeDelProblema,
  nombreLimpio,
  problemaAlSubir,
  rutaDelDocumento,
  tamanoLegible,
  type FilaDocumento,
} from "@/lib/documentos-patrocinio";

/**
 * Los papeles de cada patrocinio (migración 0051).
 *
 * Lo que de verdad hay que vigilar aquí no es el diseño: es que un
 * archivo no acabe donde no debe y que el tope se cuente bien. Son dos
 * cosas que, cuando fallan, no se ven — el club sube su contrato y todo
 * parece correcto.
 */
describe("qué se puede subir", () => {
  const PDF = "application/pdf";

  it("acepta un PDF normal", () => {
    expect(problemaAlSubir({ tipoMime: PDF, tamano: 500_000, yaGuardados: 0 })).toBeNull();
  });

  it("acepta la foto de un contrato firmado en papel", () => {
    // Media España firma en papel y lo guarda como foto del móvil. Si
    // solo entrara PDF, esos clubes no podrían subir nada.
    expect(problemaAlSubir({ tipoMime: "image/jpeg", tamano: 2_000_000, yaGuardados: 1 })).toBeNull();
  });

  it("rechaza lo que no es ni PDF ni foto", () => {
    for (const tipo of ["application/zip", "text/html", "application/x-msdownload", ""]) {
      expect(
        problemaAlSubir({ tipoMime: tipo, tamano: 1000, yaGuardados: 0 }),
        `debería rechazar ${tipo || "(vacío)"}`,
      ).not.toBeNull();
    }
  });

  it("rechaza justo por encima del tope y acepta justo en el tope", () => {
    expect(problemaAlSubir({ tipoMime: PDF, tamano: TAMANO_MAXIMO_BYTES, yaGuardados: 0 })).toBeNull();
    expect(problemaAlSubir({ tipoMime: PDF, tamano: TAMANO_MAXIMO_BYTES + 1, yaGuardados: 0 })).toBe(
      "demasiado-grande",
    );
  });

  it("rechaza un archivo vacío", () => {
    expect(problemaAlSubir({ tipoMime: PDF, tamano: 0, yaGuardados: 0 })).toBe("vacio");
  });

  it("deja subir el sexto y corta el séptimo", () => {
    expect(
      problemaAlSubir({ tipoMime: PDF, tamano: 1000, yaGuardados: MAXIMO_POR_PATROCINADOR - 1 }),
    ).toBeNull();
    expect(
      problemaAlSubir({ tipoMime: PDF, tamano: 1000, yaGuardados: MAXIMO_POR_PATROCINADOR }),
    ).toBe("limite-alcanzado");
  });

  it("avisa de que falta el archivo antes que de ninguna otra cosa", () => {
    expect(problemaAlSubir({ tipoMime: undefined, tamano: undefined, yaGuardados: 0 })).toBe(
      "sin-archivo",
    );
  });

  it("cada motivo tiene un aviso escrito", () => {
    for (const motivo of [
      "sin-archivo",
      "tipo-no-permitido",
      "demasiado-grande",
      "vacio",
      "limite-alcanzado",
    ] as const) {
      expect(mensajeDelProblema(motivo).length, `${motivo} sin mensaje`).toBeGreaterThan(10);
    }
  });
});

/**
 * De dónde sale el nombre del archivo dentro del almacén.
 *
 * Esta es la parte que más daño haría si estuviera mal. El nombre lo
 * escribe quien sube, y el almacén separa las carpetas por barras: un
 * nombre con barras dentro podría escribir fuera de la carpeta del
 * club.
 */
describe("dónde se guarda cada archivo", () => {
  it("la carpeta del club va delante del todo", () => {
    // Las políticas del almacén miran el PRIMER trozo de la ruta contra
    // el usuario de la sesión. Con el patrocinador delante, cualquiera
    // podría escribir en la carpeta de otro club.
    const ruta = rutaDelDocumento("club-1", "patro-9", "application/pdf", "abc");
    expect(ruta.split("/")[0]).toBe("club-1");
    expect(ruta).toBe("club-1/patro-9/abc.pdf");
  });

  it("la extensión sale del tipo declarado y no del nombre", () => {
    expect(extensionDe("application/pdf")).toBe("pdf");
    expect(extensionDe("image/jpeg")).toBe("jpg");
    expect(extensionDe("image/png")).toBe("png");
    expect(extensionDe("image/webp")).toBe("webp");
    // Un tipo que no conocemos nunca da una extensión ejecutable.
    expect(extensionDe("application/x-msdownload")).toBe("bin");
  });

  it("la ruta nunca contiene lo que escribió el usuario", () => {
    // El nombre del archivo no entra en la ruta en ningún caso: va a
    // una columna aparte, solo para enseñarlo.
    const ruta = rutaDelDocumento("club-1", "patro-9", "application/pdf", "abc");
    expect(ruta).not.toContain("..");
    expect(ruta.split("/")).toHaveLength(3);
  });
});

describe("el nombre que se enseña", () => {
  it("se queda solo con el nombre, sin carpetas", () => {
    expect(nombreLimpio("C:\\Users\\Rafa\\Desktop\\contrato.pdf")).toBe("contrato.pdf");
    expect(nombreLimpio("/home/rafa/factura 2026.pdf")).toBe("factura 2026.pdf");
    expect(nombreLimpio("../../otro.pdf")).toBe("otro.pdf");
  });

  it("nunca se queda vacío", () => {
    expect(nombreLimpio("")).toBe("documento");
    expect(nombreLimpio("   ")).toBe("documento");
    expect(nombreLimpio("/")).toBe("documento");
  });

  it("recorta los nombres larguísimos", () => {
    expect(nombreLimpio("a".repeat(400)).length).toBe(120);
  });
});

describe("el tamaño que lee el club", () => {
  it("se escribe como lo escribiría una persona", () => {
    expect(tamanoLegible(512)).toBe("512 B");
    expect(tamanoLegible(820 * 1024)).toBe("820 KB");
    expect(tamanoLegible(Math.round(2.4 * 1024 * 1024))).toBe("2,4 MB");
  });
});

describe("los tipos de documento", () => {
  it("solo hay tres y son los que acepta la base de datos", () => {
    expect(esTipoValido("contrato")).toBe(true);
    expect(esTipoValido("factura")).toBe(true);
    expect(esTipoValido("otro")).toBe(true);
    expect(esTipoValido("certificado-medico")).toBe(false);
    expect(esTipoValido("")).toBe(false);
  });

  it("un tipo desconocido guardado de antes no rompe la pantalla", () => {
    const fila: FilaDocumento = {
      id: "1",
      sponsor_id: "p1",
      kind: "loquesea",
      storage_path: "c/p/1.pdf",
      file_name: "x.pdf",
      mime_type: "application/pdf",
      size_bytes: 10,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(filaADocumento(fila).tipo).toBe("otro");
  });
});

describe("el reparto por patrocinador", () => {
  const doc = (id: string, patrocinadorId: string) =>
    filaADocumento({
      id,
      sponsor_id: patrocinadorId,
      kind: "contrato",
      storage_path: `c/${patrocinadorId}/${id}.pdf`,
      file_name: `${id}.pdf`,
      mime_type: "application/pdf",
      size_bytes: 10,
      created_at: "2026-01-01T00:00:00Z",
    });

  it("agrupa cada papel con su empresa", () => {
    const mapa = agruparPorPatrocinador([doc("1", "a"), doc("2", "b"), doc("3", "a")]);
    expect(mapa.get("a")?.map((d) => d.id)).toEqual(["1", "3"]);
    expect(mapa.get("b")?.map((d) => d.id)).toEqual(["2"]);
    expect(mapa.get("c")).toBeUndefined();
  });

  it("sin documentos devuelve un mapa vacío, no revienta", () => {
    expect(agruparPorPatrocinador([]).size).toBe(0);
  });
});

/**
 * La migración, leída tal cual.
 *
 * Son dos cosas que no se pueden comprobar con una función pura y que,
 * si se tuercen, no avisa nadie: un contrato en un almacén público se
 * ve desde fuera sin que salte ningún error.
 */
describe("el almacén de los papeles", () => {
  const SQL = readFileSync(
    join(process.cwd(), "supabase", "migrations", "0051_documentos_del_patrocinio.sql"),
    "utf8",
  );

  it("encuentra la migración", () => {
    expect(SQL).toContain("club_sponsor_documents");
  });

  /**
   * LA COMPROBACIÓN QUE MÁS IMPORTA DE TODO EL ARCHIVO.
   *
   * `club-media`, el almacén de logos y fotos, es público: cualquiera
   * con la dirección ve el archivo, y está bien, porque son fotos que
   * se enseñan. Si estos papeles acabaran en un almacén público, los
   * contratos y las facturas de todos los clubes serían legibles desde
   * fuera, y no fallaría nada: se vería igual de bien.
   */
  it("es privado, al contrario que el de las fotos", () => {
    const bloque = SQL.slice(SQL.indexOf("insert into storage.buckets"));
    expect(bloque).toContain("'club-docs'");
    expect(bloque).toContain("false"); // la columna `public`
    expect(bloque).not.toMatch(/'club-docs',\s*\n?\s*true/);

    // Y no hay política de lectura abierta como la de club-media.
    expect(SQL).not.toContain("using (bucket_id = 'club-docs')");
    expect(SQL).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });

  it("no admite ejecutables ni archivos comprimidos", () => {
    const bloque = SQL.slice(SQL.indexOf("allowed_mime_types"), SQL.indexOf("on conflict"));
    expect(bloque).toContain("application/pdf");
    expect(bloque).not.toContain("application/zip");
    expect(bloque).not.toContain("*/*");
  });

  it("la tabla solo la ve su club", () => {
    for (const operacion of ["select", "insert", "update", "delete"]) {
      expect(SQL, `falta la política de ${operacion}`).toContain(
        `club_sponsor_documents_${operacion}_own`,
      );
    }
    expect(SQL).toContain("enable row level security");
  });

  it("el tope de tamaño está en los dos sitios y coincide", () => {
    // 10 MB en el bucket y 10 MB en la restricción de la tabla: uno
    // protege lo que entra por el almacén y el otro lo que entra por la
    // tabla. Si no coincidieran, habría una puerta más ancha.
    expect(SQL).toContain("10485760");
    expect(TAMANO_MAXIMO_BYTES).toBe(10485760);
  });
});

/**
 * Los archivos no se borran solos.
 *
 * La base de datos se lleva las filas con `on delete cascade`, pero el
 * almacén no sabe nada de claves ajenas. Si la aplicación no barre los
 * archivos a mano, se quedan ocupando sitio para siempre — y, en la
 * baja de una cuenta, el club desaparece y sus contratos siguen
 * guardados, que es un derecho de supresión a medias.
 */
describe("la limpieza de los archivos", () => {
  const RAIZ = join(process.cwd(), "src", "app", "[locale]", "panel");

  it("al borrar un patrocinador se borran sus papeles del almacén", () => {
    const acciones = readFileSync(join(RAIZ, "actions.ts"), "utf8");
    const bloque = acciones.slice(acciones.indexOf("export async function eliminarPatrocinador"));
    const fin = bloque.indexOf("\n}");
    const funcion = bloque.slice(0, fin);

    expect(funcion).toContain("rutasDeLosDocumentos");
    expect(funcion).toContain("BUCKET_DOCUMENTOS");
    expect(funcion).toContain(".remove(");

    // Las rutas se leen ANTES del delete: después ya no hay filas.
    expect(funcion.indexOf("rutasDeLosDocumentos")).toBeLessThan(
      funcion.indexOf('.from("club_sponsors")'),
    );
  });

  it("al darse de baja se borran también", () => {
    const privacidad = readFileSync(join(RAIZ, "privacidad", "actions.ts"), "utf8");

    // Acotado al CUERPO de la función, no al archivo entero: mirando
    // todo el archivo, esta comprobación pasaba aunque se quitara la
    // llamada, porque la línea del `import` ya contiene el nombre. Una
    // prueba que no puede fallar no es una prueba.
    const funcion = privacidad.slice(privacidad.indexOf("export async function eliminarCuentaClub"));

    expect(funcion).toContain("await todasLasRutasDelClub(supabase, user.id)");
    expect(funcion).toContain("BUCKET_DOCUMENTOS");
    expect(funcion).toContain(".remove(rutasDeDocumentos)");

    // Antes de borrar al usuario, que es cuando desaparecen las filas.
    expect(funcion.indexOf("todasLasRutasDelClub")).toBeLessThan(funcion.indexOf("deleteUser"));
  });
});
