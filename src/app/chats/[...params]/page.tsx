import { Feedback, Navbar } from "@/features/shared";
import { ChatsScreen } from "@/app/chats/_screens";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    params: string[];
  };
}

export default function Chats({ params }: Props) {
  return (
    <>
      <Feedback />
      <Navbar />
      <ChatsScreen params={params.params ?? []} />
    </>
  );
}
