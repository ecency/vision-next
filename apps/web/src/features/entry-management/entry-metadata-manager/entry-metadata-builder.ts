import { postBodySummary, proxifyImageSrc } from "@ecency/render-helper";
import { PollSnapshot } from "../../polls";
import appPackage from "../../../../package.json";
import { getDimensionsFromDataUrl } from "./get-dimensions-from-data-url";
import { ensureValidPermlink, extractMetaData, makeApp } from "@/utils/posting";
import { makeEntryPath } from "@/utils/make-path";
import { Entry, MetaData } from "@/entities";
import { ThreeSpeakVideo } from "@/api/threespeak";

const DEFAULT_TAGS = ["ecency"];

const DEFAULT_METADATA = {
  app: makeApp(appPackage.version),
  tags: [...DEFAULT_TAGS],
  format: "markdown+html"
};

export class EntryMetadataBuilder {
  private temporaryMetadata: MetaData = {};

  public extend(entry?: Entry): this {
    this.temporaryMetadata = {
      ...entry?.json_metadata
    };
    return this;
  }

  public default(): this {
    this.temporaryMetadata = {
      ...DEFAULT_METADATA
    };
    return this;
  }

  public extractFromBody(body: string): this {
    const meta = extractMetaData(body);
    this.temporaryMetadata = {
      ...this.temporaryMetadata,
      ...meta
    };
    return this;
  }

  public withPinnedReply(reply: Entry, pinned: boolean): this {
    return this.withField("pinned_reply", pinned ? `${reply.author}/${reply.permlink}` : undefined);
  }

  public withSummary(bodyOrDescription: string): this {
    return this.withField("description", postBodySummary(bodyOrDescription, 200));
  }

  public withTags(tags?: string[]): this {
    const finalTags = tags && tags.length > 0 ? tags : DEFAULT_TAGS;
    return this.withField("tags", finalTags);
  }

  public withPostLinks(entries: Entry[] = []): this {
    return this.withField(
      "links",
      entries
        .filter((e) => !!e)
        .map(
          (entry) =>
            `https://ecency.com${makeEntryPath(entry.category, entry.author, entry.permlink)}`
        )
    ).withField(
      "links_meta",
      entries.reduce(
        (acc, entry) => {
          if (!entry) {
            return acc;
          }

          return {
            ...acc,
            [`https://ecency.com${makeEntryPath(entry.category, entry.author, entry.permlink)}`]: {
              title: entry.title,
              summary: entry.json_metadata?.description,
              image: entry.json_metadata?.image
            }
          };
        },
        {}
      )
    );
  }

  public async withSelectedThumbnail(
    selectedThumbnail: string | undefined,
    images?: string[]
  ): Promise<this> {
    const { image } = this.temporaryMetadata;

    let nextImages = [...(images ?? []), ...(image ?? [])];

    if (selectedThumbnail) {
      nextImages.unshift(selectedThumbnail);
      this.withField("thumbnails", [selectedThumbnail]);
    }

    nextImages = Array.from(new Set(nextImages)).splice(0, 9);

    this.withField("image", nextImages);
    this.withField(
      "image_ratios",
      await Promise.all(
        nextImages
          .slice(0, 5)
          .map((element: string) => getDimensionsFromDataUrl(proxifyImageSrc(element)))
      )
    );
    return this;
  }

  public withVideo(
    title: string,
    description: string | null,
    videoMetadata?: ThreeSpeakVideo
  ): this {
    if (videoMetadata) {
      const permlink = ensureValidPermlink(
        videoMetadata.permlink,
        title || videoMetadata.title
      );
      const sanitizedVideoMetadata = { ...videoMetadata, permlink };

      return this.withField("video", {
        info: {
          platform: "3speak",
          title: title || videoMetadata.title,
          author: sanitizedVideoMetadata.owner,
          permlink: sanitizedVideoMetadata.permlink,
          duration: sanitizedVideoMetadata.duration,
          filesize: sanitizedVideoMetadata.size,
          file: sanitizedVideoMetadata.filename,
          lang: sanitizedVideoMetadata.language,
          firstUpload: sanitizedVideoMetadata.firstUpload,
          ipfs: null,
          ipfsThumbnail: null,
          video_v2: sanitizedVideoMetadata.video_v2,
          sourceMap: [
            {
              type: "video",
              url: sanitizedVideoMetadata.video_v2,
              format: "m3u8"
            },
            {
              type: "thumbnail",
              url: sanitizedVideoMetadata.thumbUrl
            }
          ]
        },
        content: {
          description: description || sanitizedVideoMetadata.description,
          tags: sanitizedVideoMetadata.tags_v2
        }
      }).withField("type", "video");
    }
    return this;
  }

  public withPoll(poll?: PollSnapshot): this {
    this.temporaryMetadata = {
      ...this.temporaryMetadata,
      ...(poll
        ? {
            content_type: "poll",
            version: 1.1,
            question: poll.title,
            choices: poll.choices,
            preferred_interpretation: poll.interpretation,
            token: poll.interpretation === "tokens" ? "HIVE:HP" : null,
            hide_votes: poll.hideVotes,
            vote_change: poll.voteChange,
            max_choices_voted: poll.maxChoicesVoted || 1,
            filters: {
              account_age: poll.filters.accountAge
            },
            end_time: Math.round(
              poll.endTime instanceof Date ? poll.endTime.getTime() / 1000 : poll.endTime
            )
          }
        : {})
    } as MetaData;
    return this;
  }

  public withLocation(location?: { coordinates: { lat: number; lng: number }; address?: string }) {
    this.temporaryMetadata = {
      ...this.temporaryMetadata,
      ...(location && {
        location: {
          coordinates: {
            lat: +location.coordinates.lat.toFixed(3),
            lng: +location.coordinates.lng.toFixed(3)
          },
          address: location.address
        }
      })
    };

    return this;
  }

  public build(): MetaData {
    return { ...this.temporaryMetadata };
  }

  private withField(fieldName: keyof MetaData, value: MetaData[typeof fieldName]): this {
    this.temporaryMetadata[fieldName] = value;
    return this;
  }
}
