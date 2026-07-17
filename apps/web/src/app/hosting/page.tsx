import { Metadata } from "next";
import { HostingPage } from "./_page";

export const metadata: Metadata = {
  // Root layout applies the "%s | Ecency" template; a bare title avoids "… | Ecency | Ecency".
  title: "Blog Hosting",
  description: "Host your Hive blog on your own branded site at yourname.blogs.ecency.com."
};

export default function Page() {
  return <HostingPage />;
}
