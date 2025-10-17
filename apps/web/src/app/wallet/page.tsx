import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function WalletPage() {
  const cookieStore = await cookies();
  let observer = cookieStore.get(ACTIVE_USER_COOKIE_NAME)?.value || "";

  if (observer.startsWith("@")) observer = observer.slice(1);

  const destination = observer
      ? `/@${encodeURIComponent(observer)}/wallet`
      : "/signup";

  redirect(destination);
}
