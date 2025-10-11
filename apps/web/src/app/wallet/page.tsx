import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function WalletPage() {
  const cookieStore = cookies();
  const observer = cookieStore.get(ACTIVE_USER_COOKIE_NAME)?.value;

  if (!observer) {
    // fallback
    redirect("/");
  }

  redirect(`/@${encodeURIComponent(observer)}/wallet`);
}
