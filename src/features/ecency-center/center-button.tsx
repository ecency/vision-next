import { motion } from "framer-motion";
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
    <motion.div
      onClick={handleClick}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="hidden md:flex items-center justify-start bg-white dark:bg-neutral-800 border border-[--border-color] rounded-full cursor-pointer"
      variants={{
        rest: {},
        hover: {}
      }}
    >
      <motion.div
        variants={{
          rest: { rotate: 0 },
          hover: { rotate: 25, scale: 0.9 }
        }}
      >
        <UilCommentDots className="w-12 h-12 text-gray-600 dark:text-gray-300 duration-300" />
      </motion.div>
    </motion.div>
  );
}
