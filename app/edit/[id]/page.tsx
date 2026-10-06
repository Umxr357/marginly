import { Marginly } from "../../components/folio";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Marginly view="edit" id={id} />;
}
