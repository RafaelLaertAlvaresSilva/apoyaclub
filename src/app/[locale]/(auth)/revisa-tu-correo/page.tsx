import { Link } from "@/i18n/navigation";

export default function RevisaTuCorreoPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">Revisa tu correo</h1>
      <p className="text-sm text-zinc-500">
        Te hemos enviado un correo para verificar tu cuenta. Abre el enlace
        que contiene para activarla y poder iniciar sesión.
      </p>
      <p className="text-xs text-zinc-400">
        Si no lo encuentras, revisa también la carpeta de spam.
      </p>
      <Link href="/login" className="inline-block text-sm font-medium text-teal-700 hover:underline">
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
