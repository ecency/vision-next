import { ChatsScreen } from "@/app/chats/_screens";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    community: string;
  }>;
}

export default async function Chats({ params }: Props) {
  const { community } = await params;
  return <ChatsScreen params={[community, "channel"]} />;
}
