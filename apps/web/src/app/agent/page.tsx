export default function AgentHome() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-normal tracking-tight">Espace agent</h1>
      <a className="text-sm font-medium text-primary underline underline-offset-4" href="/agent/customers">
        Créer un client
      </a>
    </div>
  );
}

