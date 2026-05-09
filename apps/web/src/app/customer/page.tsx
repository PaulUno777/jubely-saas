export default function CustomerHome() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-normal tracking-tight">Espace client</h1>
      <div className="flex gap-3">
        <a className="text-sm font-medium text-primary underline underline-offset-4" href="/customer/enroll">
          S’inscrire
        </a>
        <a className="text-sm font-medium text-primary underline underline-offset-4" href="/customer/qr">
          Mon QR
        </a>
      </div>
    </div>
  );
}

