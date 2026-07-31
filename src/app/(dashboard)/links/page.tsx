import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LinksClient from "./LinksClient";

export default async function LinksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <LinksClient />;
}
