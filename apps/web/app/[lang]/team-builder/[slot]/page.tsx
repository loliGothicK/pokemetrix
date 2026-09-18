import { redirect } from "next/navigation";

export const instant = false;

export default async function TeamBuilderSlotPage({
  params,
}: {
  readonly params: Promise<{ readonly lang: string; readonly slot: string }>;
}) {
  const { lang, slot } = await params;
  redirect(`/${lang}/team-builder?slot=${slot}`);
}
