import { ChatsScreen } from "@/app/chats/_screens";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    community: string;
  };
}

export default function Chats({ params }: Props) {
  return <ChatsScreen params={[params.community, "channel"]} />;
}
