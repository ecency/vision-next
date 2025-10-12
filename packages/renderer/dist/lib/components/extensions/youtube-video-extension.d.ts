import { RefObject } from 'react';
export declare function YoutubeVideoRenderer({ embedSrc, container, }: {
    embedSrc: string;
    container: HTMLElement;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function YoutubeVideoExtension({ containerRef, }: {
    containerRef: RefObject<HTMLElement | null>;
}): import("react/jsx-runtime").JSX.Element;
