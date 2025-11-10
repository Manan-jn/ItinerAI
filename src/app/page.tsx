import { redirect } from "next/navigation";

export default function RootRedirectPage() {
  redirect("/flights");
}
