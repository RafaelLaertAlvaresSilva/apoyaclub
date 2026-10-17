"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BloquePlegable, cuantosRellenados } from "@/components/BloquePlegable";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import {
  agregarFoto,
  eliminarFoto,
  guardarIdentidad,
  guardarLogo,
  registrarConfirmacionMenores,
} from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";
import { ImageUploader } from "./ImageUploader";
import { PortadaEditor } from "./PortadaEditor";

export function IdentidadForm({
  userId,
  perfil,
}: {
  userId: string;
  perfil: ClubProfile | null;
}) {
  const t = useTranslations("panel.perfil");
  const tComun = useTranslations("panel.comun");
  const rellenados = (puestos: number, total: number) => tComun("rellenados", { puestos, total });
  const [estado, formAction] = useActionState(guardarIdentidad, null);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [confirmaSinMenores, setConfirmaSinMenores] = useState(false);
  const [, iniciarTransicion] = useTransition();

  const fotos = perfil?.photoUrls ?? [];

  // Los apartados plegables se abren solos si ya tienen algo dentro.
  //
  // No es solo comodidad: si un club guardó en su día una dirección mal
  // escrita, el navegador se niega a enviar el formulario por culpa de
  // ese campo, y con el apartado cerrado no puede enseñar dónde está el
  // problema. Se quedaría pulsando "Guardar" sin que pasara nada.
  const enlaces = [
    perfil?.website,
    perfil?.videoUrl,
    perfil?.socialLinks.instagram,
    perfil?.socialLinks.facebook,
    perfil?.socialLinks.twitter,
    perfil?.socialLinks.tiktok,
    perfil?.socialLinks.youtube,
  ];
  const contacto = [
    perfil?.contactName,
    perfil?.contactPhone,
    perfil?.contactEmail,
    perfil?.contactHours,
  ];
  const hayAlgo = (valores: (string | null | undefined)[]) =>
    valores.some((valor) => !!valor?.trim());

  function manejarErrorAccion(resultado: { error: string } | { ok: true } | null) {
    if (resultado && "error" in resultado) setErrorImagen(resultado.error);
  }

  return (
    <SeccionCard
      titulo={t("identidad")}
      descripcion={t("comoSePresentaTu")}
    >
      {perfil?.slug && (
        <p className="mb-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {t.rich("paginaPublicaYaEsta", {
            ruta: `/club/${perfil.slug}`,
            enlace: (trozo) => (
              <a href={`/club/${perfil.slug}`} target="_blank" rel="noreferrer" className="font-medium underline">
                {trozo}
              </a>
            ),
          })}
        </p>
      )}

      {/* Las imágenes solo cuando el club ya tiene ficha.
          *
          * Guardar una foto es un `update` sobre la fila del club, y esa
          * fila no existe hasta que se guardan nombre y localidad. Antes
          * de eso la imagen se subía al almacén y el `update` no tocaba
          * ninguna fila: ni se veía la foto, ni salía ningún error. Y era
          * el primer paso que pide el asistente de bienvenida, así que el
          * primer gesto de todo club nuevo fallaba en silencio. */}
      {!perfil ? (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">{t("imagenesTitulo")}</p>
          <p className="mt-1">{t("imagenesTexto")}</p>
        </div>
      ) : (
      <div className="mb-6 space-y-4">
        <PortadaEditor
          userId={userId}
          coverUrl={perfil?.coverUrl ?? null}
          coverPosition={perfil?.coverPosition ?? 50}
        />

        <Campo etiqueta={t("logoDelClub")}>
          <div className="flex items-center gap-4">
            {perfil?.logoUrl ? (
              <Image
                src={perfil.logoUrl}
                alt={t("logoDelClub")}
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg border border-placa-borde bg-placa object-contain p-1.5"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500">{t("sinLogo")}</div>
            )}
            <ImageUploader
              userId={userId}
              carpeta="logo"
              label={perfil?.logoUrl ? t("cambiarLogo") : t("subirLogo")}
              onSubido={async (url) => {
                const resultado = await guardarLogo(url);
                manejarErrorAccion(resultado);
              }}
            />
          </div>
        </Campo>

        <Campo etiqueta={t("fotosDelClub")} ayuda={t("instalacionesAficionEquiposLo")}>
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t("avisoMenores")}
          </div>

          <label className="mb-3 flex items-start gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={confirmaSinMenores}
              onChange={(evento) => {
                const marcado = evento.target.checked;
                setConfirmaSinMenores(marcado);
                if (marcado) {
                  iniciarTransicion(() => {
                    registrarConfirmacionMenores();
                  });
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
            />{t("confirmoQueLasFotos")}</label>

          <div className="flex flex-wrap gap-3">
            {fotos.map((foto) => (
              <div key={foto} className="group relative h-20 w-20">
                <Image
                  src={foto}
                  alt={t("fotoDelClub")}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() =>
                    iniciarTransicion(async () => {
                      const resultado = await eliminarFoto(foto);
                      manejarErrorAccion(resultado);
                    })
                  }
                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-peligro text-xs text-sobre-color group-hover:flex"
                  aria-label={t("quitarFoto")}
                >
                  ×
                </button>
              </div>
            ))}
            {confirmaSinMenores ? (
              <ImageUploader
                userId={userId}
                carpeta="fotos"
                label={t("anadirFoto")}
                onSubido={async (url) => {
                  const resultado = await agregarFoto(url);
                  manejarErrorAccion(resultado);
                }}
              />
            ) : (
              <p className="self-center text-xs text-zinc-500">{t("marcaLaCasillaDe")}</p>
            )}
          </div>
        </Campo>

        <AvisoError mensaje={errorImagen} />
      </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Lo obligatorio, dicho antes de empezar. Con el nombre y la
            localidad el club ya tiene página: todo lo demás suma, pero
            nada de ello impide publicar. Sin esta línea, la pantalla
            parecía un impreso que hay que completar entero. */}
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {t.rich("soloObligatorios", {
            fuerte: (trozo) => <strong className="font-medium text-zinc-800">{trozo}</strong>,
          })}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("nombreDelClub")}>
            <input
              name="name"
              defaultValue={perfil?.name ?? ""}
              required
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("localidad")}>
            <input
              name="city"
              defaultValue={perfil?.city ?? ""}
              required
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("provincia")}>
            <input name="province" defaultValue={perfil?.province ?? ""} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("codigoPostal")}>
            <input
              name="postalCode"
              defaultValue={perfil?.postalCode ?? ""}
              className={clasesInput}
            />
          </Campo>
        </div>

        <Campo etiqueta={t("descripcion")}>
          <textarea
            name="description"
            defaultValue={perfil?.description ?? ""}
            className={clasesTextarea}
          />
        </Campo>

        <BloquePlegable
          titulo={t("webVideoRedes")}
          abierto={hayAlgo(enlaces)}
          resumen={cuantosRellenados(
            enlaces,
            t("webVideoRedesVacio"),
            rellenados,
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta={t("web")}>
              <input
                name="website"
                type="url"
                defaultValue={perfil?.website ?? ""}
                placeholder="https://"
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("videoPresentacion")} ayuda={t("enlaceAYoutubeVimeo")}>
              <input
                name="videoUrl"
                type="url"
                defaultValue={perfil?.videoUrl ?? ""}
                placeholder="https://"
                className={clasesInput}
              />
            </Campo>
          </div>

          {/* Cada red con su etiqueta a la vista. Antes el nombre vivía
              dentro del campo como texto de ejemplo, así que en cuanto
              se escribía la dirección desaparecía: ni de un vistazo ni
              con un lector de pantalla se sabía cuál era cuál. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Instagram">
              <input
                name="instagram"
                defaultValue={perfil?.socialLinks.instagram ?? ""}
                placeholder="https://instagram.com/tuclub"
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="Facebook">
              <input
                name="facebook"
                defaultValue={perfil?.socialLinks.facebook ?? ""}
                placeholder="https://facebook.com/tuclub"
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="X / Twitter">
              <input
                name="twitter"
                defaultValue={perfil?.socialLinks.twitter ?? ""}
                placeholder="https://x.com/tuclub"
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="TikTok">
              <input
                name="tiktok"
                defaultValue={perfil?.socialLinks.tiktok ?? ""}
                placeholder="https://tiktok.com/@tuclub"
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="YouTube">
              <input
                name="youtube"
                defaultValue={perfil?.socialLinks.youtube ?? ""}
                placeholder="https://youtube.com/@tuclub"
                className={clasesInput}
              />
            </Campo>
          </div>
        </BloquePlegable>

        <BloquePlegable
          titulo={t("contactoPublico")}
          abierto={hayAlgo(contacto)}
          resumen={cuantosRellenados(
            contacto,
            t("contactoVacio"),
            rellenados,
          )}
        >
          <p className="text-xs text-zinc-500">{t("elCorreoDeTu")}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta={t("nombreDeContacto")}>
              <input
                name="contactName"
                defaultValue={perfil?.contactName ?? ""}
                placeholder={t("personaALaQue")}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("telefonoDeContacto")}>
              <input
                name="contactPhone"
                type="tel"
                defaultValue={perfil?.contactPhone ?? ""}
                placeholder={t("ej600000000")}
                className={clasesInput}
              />
            </Campo>
          </div>

          <Campo
            etiqueta={t("correoContacto")}
            ayuda={t("correoContactoAyuda")}
          >
            <input
              name="contactEmail"
              type="email"
              defaultValue={perfil?.contactEmail ?? ""}
              placeholder={t("correoContactoEjemplo")}
              className={clasesInput}
            />
          </Campo>

          <Campo
            etiqueta={t("horario")}
            ayuda={t("horarioAyuda")}
          >
            <input
              name="contactHours"
              defaultValue={perfil?.contactHours ?? ""}
              placeholder={t("horarioEjemplo")}
              maxLength={200}
              className={clasesInput}
            />
          </Campo>

          {/* Viene marcado (migración 0029). Un club que se da de alta
              para que le patrocinen quiere que le puedan llamar; tenerlo
              apagado por defecto dejaba fichas publicadas sin nadie a
              quien contactar. El que prefiera filtrar lo desmarca. */}
          <label className="flex items-start gap-2 rounded-lg bg-teal-50 p-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="contactPublicConsent"
              defaultChecked={perfil?.contactPublicConsent ?? true}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
            />
            <span>
              <span className="font-medium text-zinc-900">{t("mostrarContacto")}</span>
              <span className="mt-0.5 block text-xs text-zinc-600">{t("mostrarContactoAyuda")}</span>
            </span>
          </label>
        </BloquePlegable>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? tComun("guardado") : null} />

        <BotonEnviar>{t("guardarIdentidad")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
