import { redirect } from "next/navigation";

// v1 quedó de baja como acceso — todo el staff entra por /panel-v2/login.
export default function LoginPage() {
  redirect("/panel-v2/login");
}
