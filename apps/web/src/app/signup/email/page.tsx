import { redirect } from "next/navigation";

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ referral?: string }>;
}) {
  const params = await searchParams;
  const referral = typeof params?.referral === "string" ? params.referral : "";
  const target = referral ? `/signup/free?referral=${encodeURIComponent(referral)}` : "/signup/free";
  redirect(target);
}
