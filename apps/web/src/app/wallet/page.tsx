import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function WalletPage() {
  const cookiesStore = await cookies();

  const observer = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
  const destination = observer ? `/@${observer}/wallet` : "/signup";

  redirect(destination);
}
