import ClienteForm from "../../ClienteForm";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClienteForm modo="editar" clienteId={id} />;
}
