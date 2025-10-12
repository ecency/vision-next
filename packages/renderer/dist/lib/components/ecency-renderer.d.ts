import { HTMLProps } from 'react';
interface Props {
    value: string;
    pure?: boolean;
    onHiveOperationClick?: (op: string) => void;
    TwitterComponent?: any;
}
export declare function EcencyRenderer({ value, pure, onHiveOperationClick, TwitterComponent, ...other }: HTMLProps<HTMLDivElement> & Props): import("react/jsx-runtime").JSX.Element;
export {};
