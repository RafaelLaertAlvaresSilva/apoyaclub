import { BarraLogo } from "@/components/BarraLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BarraLogo />
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
