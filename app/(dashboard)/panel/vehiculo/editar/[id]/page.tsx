import VehiculoForm from "../../VehiculoForm";

export default async function EditarAutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehiculoForm modo="editar" autoId={id} />;
}