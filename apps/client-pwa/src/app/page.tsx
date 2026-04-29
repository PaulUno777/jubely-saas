export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16 sm:px-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
          Jubely Client PWA
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Experience client de fidelite pour consulter ses points et son QR code.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Cette application servira de base au parcours MVP: connexion, affichage du QR client,
          consultation du solde et reclamation de recompense plus tard.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sprint 1</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ecrans d&apos;inscription, connexion et affichage du QR code personnel.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sprint 2</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Consultation du solde de points et historique des transactions de fidelite.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sprint 3</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Reclamation de recompense avec QR code de validation a usage unique.
          </p>
        </div>
      </section>
    </main>
  );
}
