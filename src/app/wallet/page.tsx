import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export default async function WalletPage() {
  const cookiesStore = await cookies();

  const observer = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;

  return NextResponse.redirect(`@${observer}/wallet`);
}
