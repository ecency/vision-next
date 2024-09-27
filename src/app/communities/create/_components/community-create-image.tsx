import Image from "next/image";

export function CommunityCreateImage() {
  return (
    <div className="col-span-12 md:col-span-4 lg:col-span-6">
      <Image alt="" width={1000} height={1000} src="/assets/community-img.svg" className="w-full" />
    </div>
  );
}
