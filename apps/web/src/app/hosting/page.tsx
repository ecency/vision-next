import { Metadata } from "next";
import { HostingPage } from "./_page";

export const metadata: Metadata = {
  title: "Blog Hosting | Ecency",
  description: "Host your Hive blog on your own branded site at yourname.blogs.ecency.com."
};

export default function Page() {
  return <HostingPage />;
}
