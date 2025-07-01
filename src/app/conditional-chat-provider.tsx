"use client";

import { useClientActiveUser } from "@/api/queries";
import { PropsWithChildren, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChatProvider } from "@/app/chat-provider";

export function ConditionalChatProvider(props: PropsWithChildren) {
    const activeUser = useClientActiveUser();
    const pathname = usePathname();

    const shouldMountChat = useMemo(() => {
        if (activeUser) return true;
        return !!pathname?.startsWith("/chats");
    }, [activeUser, pathname]);

    if (!shouldMountChat) {
        return props.children;
    }

    return (
        <ChatProvider>
            {props.children}
        </ChatProvider>
    );
}
