export function BarraProgreso({ porcentaje }: { porcentaje: number }) {
  const mensaje =
    porcentaje >= 100
      ? "¡Perfil completo!"
      : porcentaje >= 60
        ? "Buen ritmo, ya casi está."
        : "Cuanta más información añadas, más fácil será que te encuentren.";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-700">Perfil completado</p>
        <p className="text-sm font-semibold text-emerald-700">{porcentaje}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{mensaje}</p>
    </div>
  );
}
