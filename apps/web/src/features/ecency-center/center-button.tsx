import { UilCommentDots } from "@tooni/iconscout-unicons-react";
import { useRouter } from "next/navigation";

interface Props {
  onClick?: () => void;
}

export function CenterButton(props: Props) {
  const router = useRouter();

  const handleClick = () => {
    //props.onClick?.(); // optional external onClick
    router.push("/chats");
  };

  return (
    <div
      onClick={handleClick}
      className="group hidden md:flex items-center justify-start bg-white dark:bg-neutral-800 border border-[--border-color] rounded-full cursor-pointer"
    >
      <div className="transition-transform duration-150 group-hover:rotate-[25deg] group-hover:scale-90">
        <UilCommentDots className="size-12 text-gray-600 dark:text-gray-300 duration-300" />
      </div>
    </div>
  );
}
