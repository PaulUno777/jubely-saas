export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16 sm:px-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
          Jubely Agent
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Poste caisse et enrôlement pour les equipes des marchands.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Cette app couvre les premiers flux du MVP: connexion staff, creation de client,
          scan QR et attribution de points lors des prochaines phases.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Semaine 1</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Ecran de connexion staff et shell applicatif pour la caisse.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Semaine 2</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Formulaire d&apos;enrolement client avec validation et QR associe.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Suite</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Attribution de points, validation de recompense et vue operationnelle.
          </p>
        </div>
      </section>
    </main>
  );
}
