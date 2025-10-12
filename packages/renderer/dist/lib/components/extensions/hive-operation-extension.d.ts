import { RefObject } from 'react';
interface Props {
    op: string;
}
export declare function HiveOperationRenderer({ op }: Props): import("react/jsx-runtime").JSX.Element;
export declare function HiveOperationExtension({ containerRef, onClick, }: {
    containerRef: RefObject<HTMLElement | null>;
    onClick?: (op: string) => void;
}): null;
export {};
