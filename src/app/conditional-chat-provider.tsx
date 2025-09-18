"use client";

import { PropsWithChildren, Suspense, lazy, useMemo } from "react";
import { usePathname } from "next/navigation";

const ChatProvider = lazy(() =>
    import("@/app/chat-provider").then((m) => ({ default: m.ChatProvider }))
);

export function ConditionalChatProvider(props: PropsWithChildren) {
    const pathname = usePathname();

    const shouldMountChat = useMemo(
        () => !!pathname?.startsWith("/chats"),
        [pathname]
    );

    if (!shouldMountChat) {
        return props.children;
    }

    return (
        <Suspense fallback={props.children}>
            <ChatProvider>{props.children}</ChatProvider>
        </Suspense>
    );
}
