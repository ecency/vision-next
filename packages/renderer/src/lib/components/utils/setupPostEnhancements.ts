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

    applyTwitterEmbeds(container, options?.TwitterComponent ?? (() => `<div>Failed to render Twitter</div>`));
}
