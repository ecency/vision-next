import { motion } from "framer-motion";
import Image from "next/image";

interface Props {
  onClick?: () => void;
}

export function CenterButton(props: Props) {
  return (
    <motion.div
      {...props}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="flex items-center justify-start bg-white border border-[--border-color] rounded-full cursor-pointer"
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
        <Image
          src="/assets/logo-circle.svg"
          alt="Logo"
          width={75}
          height={72}
          className="w-[3rem] h-[3rem] duration-300"
        />
      </motion.div>
      <div className="pl-2 pr-4 font-semibold text-sm text-blue-dark-sky">Center</div>
    </motion.div>
  );
}
