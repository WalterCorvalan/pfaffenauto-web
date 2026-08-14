import Showroom3D from "@/components/showroom/Showroom3D";

export default async function ShowroomTestPage({
  params,
}: {
  params: Promise<{ marca: string }>;
}) {
  const { marca } = await params;
  const marcaValida = marca === "rely" ? "rely" : "karry";
  return <Showroom3D marca={marcaValida} />;
}
