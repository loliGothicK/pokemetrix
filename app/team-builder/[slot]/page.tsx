import Index from "@/components/client/team-builder/index";

export default async function TeamBuilderSlotPage({
  params,
}: {
  readonly params: Promise<{ readonly slot: string }>;
}) {
  const { slot } = await params;
  return <Index regulation={"M-B"} activeSlot={Number(slot)} />;
}
