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
        <section className="surface-human rounded-2xl border border-human/30 px-5 py-6">
          <h2 className="font-display text-2xl font-normal tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-human-foreground/80">{subtitle}</p>
        </section>
      </Main>
    </>
  );
}
