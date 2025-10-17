import {
    applyImageZoom,
    applyHivePostLinks,
    applyAuthorLinks,
    applyHiveOperations,
    applyTagLinks,
    applyYoutubeVideos,
    applyThreeSpeakVideos,
    applyWaveLikePosts,
    applyTwitterEmbeds
} from "../utils";
import { findPostLinkElements } from "../functions";
import React from "react";

// Proper React fallback component for Twitter embeds when Tweet component fails to load
const TwitterFallback: React.FC<{ id: string }> = ({ id }) => {
    return React.createElement('div', {
        style: {
            padding: '16px',
            border: '1px solid #e1e8ed',
            borderRadius: '8px',
            backgroundColor: '#f7f9fa',
            color: '#657786',
            textAlign: 'center' as const,
        }
    }, `Failed to load tweet. View on Twitter: https://twitter.com/i/status/${id}`);
};

export function setupPostEnhancements(container: HTMLElement, options?: {
    onHiveOperationClick?: (op: string) => void,
    TwitterComponent?: any
}) {
    applyImageZoom(container);
    const postLinkElements = findPostLinkElements(container);

    applyHivePostLinks(container, postLinkElements);
    applyAuthorLinks(container);
    applyHiveOperations(container, options?.onHiveOperationClick);
    applyTagLinks(container);
    applyYoutubeVideos(container);
    applyThreeSpeakVideos(container);
    applyWaveLikePosts(container, postLinkElements);

    applyTwitterEmbeds(container, options?.TwitterComponent ?? TwitterFallback);
}
