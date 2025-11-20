import { redirect } from "next/navigation";

export default function RootRedirect() {
  // Always redirect root → dashboard
  redirect("/dashboard");
}
