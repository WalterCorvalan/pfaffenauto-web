import ShowroomEntrada from "@/components/showroom/ShowroomEntrada";

export default async function ShowroomTestPage({
  params,
}: {
  params: Promise<{ marca: string }>;
}) {
  const { marca } = await params;
  const marcaValida = marca === "rely" ? "rely" : "karry";
  return <ShowroomEntrada marca={marcaValida} fachadaSrc={`/fachada-${marcaValida}.jpeg`} />;
}
