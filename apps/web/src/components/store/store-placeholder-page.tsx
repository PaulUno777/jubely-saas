import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";

type StorePlaceholderPageProps = {
  title: string;
  subtitle: string;
};

export function StorePlaceholderPage({ title, subtitle }: StorePlaceholderPageProps) {
  return (
    <>
      <StorePageHeader title={title} />
      <Main>
        <section className="rounded-2xl border border-border bg-card px-5 py-6">
          <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </section>
      </Main>
    </>
  );
}
