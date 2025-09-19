"use client";

import { PublishGifPickerDialog } from "@/app/publish/_components/publish-gif-picker-dialog";
import { EcencyConfigManager } from "@/config";
import { EcencyImagesUploadDialog } from "@/features/ecency-images";
import { error, GalleryDialog, LoginRequired } from "@/features/shared";
import { VideoUpload } from "@/features/shared/video-upload-threespeak";
import { EmojiPicker, StyledTooltip } from "@/features/ui";
import { useEditorState } from "@tiptap/react";
import { YOUTUBE_REGEX } from "@/features/tiptap-editor";
import {
  UilAlignCenter,
  UilAlignJustify,
  UilAlignLeft,
  UilAlignRight,
  UilArrow,
  UilBorderHorizontal,
  UilDocumentLayoutRight,
  UilEllipsisH,
  UilImage,
  UilImages,
  UilImageShare,
  UilLink,
  UilListOl,
  UilListUiAlt,
  UilListUl,
  UilMap,
  UilMapPin,
  UilMapPinAlt,
  UilPalette,
  UilPanelAdd,
  UilParagraph,
  UilSmile,
  UilSubject,
  UilTable,
  UilTextSize,
  UilUpload,
  UilVideo
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownItemWithIcon,
  DropdownMenu,
  DropdownToggle
} from "@ui/dropdown";
import { DropdownContext } from "@ui/dropdown/dropdown-context";
import i18next from "i18next";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePublishState, usePublishVideoAttach } from "../_hooks";
import { PublishEditorTableToolbar } from "./publish-editor-table-toolbar";
import { PublishEditorVideoByLinkDialog } from "./publish-editor-video-by-link-dialog";
import { PublishEditorVideoGallery } from "./publish-editor-video-gallery";
import { PublishImageByLinkDialog } from "./publish-image-by-link-dialog";

import { PublishEditorToolbarFragments } from "./publish-editor-toolbar-fragments";
import { PublishEditorGeoTagDialog } from "./publish-editor-geo-tag/publish-editor-geo-tag-dialog";
import clsx from "clsx";

interface Props {
  editor: any | null;
  allowToUploadVideo?: boolean;
}

const headings = [1, 2, 3, 4, 5, 6];
const colorPalette = [
  "#000000",
  "#1F2937",
  "#4B5563",
  "#64748B",
  "#16A34A",
  "#22C55E",
  "#0EA5E9",
  "#2563EB",
  "#7C3AED",
  "#F97316",
  "#F59E0B",
  "#DC2626",
  "#EC4899"
];

function PublishEditorToolbarColorPalette({ editor }: { editor: any | null }) {
  const { setShow } = useContext(DropdownContext);
  const activeColor = editor?.getAttributes("textStyle")?.color as string | undefined;

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      <div className="grid grid-cols-7 gap-2">
        {colorPalette.map((color) => {
          const isActive = editor?.isActive("textStyle", { color });

          return (
            <button
              key={color}
              type="button"
              onClick={() => {
                editor?.chain().focus().setColor(color).run();
                setShow(false);
              }}
              className={clsx(
                "h-6 w-6 rounded-full border border-[--border-color] transition-all",
                isActive && "ring-2 ring-offset-2 ring-blue-dark-sky"
              )}
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">{color}</span>
            </button>
          );
        })}
      </div>
      <Button
        size="sm"
        appearance="gray-link"
        onClick={() => {
          editor?.chain().focus().unsetColor().run();
          setShow(false);
        }}
      >
        {i18next.t("publish.action-bar.clear-color", { defaultValue: "Clear color" })}
      </Button>
      {activeColor && (
        <div className="text-xs text-gray-500">
          {i18next.t("publish.action-bar.selected-color", {
            defaultValue: "Selected color: {{color}}",
            color: activeColor
          })}
        </div>
      )}
    </div>
  );
}

export function PublishEditorToolbar({ editor, allowToUploadVideo = true }: Props) {
  const emojiPickerAnchorRef = useRef<HTMLDivElement>(null);
  const publishState = usePublishState();
  const { canAlign } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canAlign:
        editor?.isActive("paragraph") ||
        editor?.isActive("image") ||
        editor?.isActive("heading") ||
        editor?.isActive("youtubeVideo")
    })
  });

  const [showFragments, setShowFragments] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showImageByLink, setShowImageByLink] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoGallery, setShowVideoGallery] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoLink, setShowVideoLink] = useState(false);
  const [showGeoTag, setShowGeoTag] = useState(false);
  const [isFocusingTable, setIsFocusingTable] = useState(false);

  const attachVideo = usePublishVideoAttach(editor);

  const activeTextColor = editor?.getAttributes("textStyle")?.color as string | undefined;

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleSelectionUpdate = ({ editor: currentEditor }: any) => {
      setIsFocusingTable(currentEditor.isActive("table"));
    };

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor]);

  const clearChain = useCallback(() => editor?.chain().focus().setTextAlign("left"), [editor]);

  return (
    <>
      <div className="w-full items-center p-2 sm:py-0 flex flex-wrap gap-1 sm:gap-0">
        <StyledTooltip content={!canAlign && i18next.t("publish.action-bar.align-hint")}>
          <Button
            appearance={editor?.isActive({ textAlign: "left" }) ? "link" : "gray-link"}
            size="sm"
            disabled={!canAlign}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            icon={<UilAlignLeft />}
          />
        </StyledTooltip>
        <StyledTooltip content={!canAlign && i18next.t("publish.action-bar.align-hint")}>
          <Button
            appearance={editor?.isActive({ textAlign: "center" }) ? "link" : "gray-link"}
            size="sm"
            disabled={!canAlign}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            icon={<UilAlignCenter />}
          />
        </StyledTooltip>
        <StyledTooltip content={!canAlign && i18next.t("publish.action-bar.align-hint")}>
          <Button
            appearance={editor?.isActive({ textAlign: "right" }) ? "link" : "gray-link"}
            size="sm"
            disabled={!canAlign}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            icon={<UilAlignRight />}
          />
        </StyledTooltip>
        <StyledTooltip content={!canAlign && i18next.t("publish.action-bar.align-hint")}>
          <Button
            appearance={editor?.isActive({ textAlign: "justify" }) ? "link" : "gray-link"}
            size="sm"
            disabled={!canAlign}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            icon={<UilAlignJustify />}
          />
        </StyledTooltip>
        <div className="border-r border-[--border-color] h-10 w-[1px] hidden sm:block" />
        <StyledTooltip content={i18next.t("publish.action-bar.paragraph")}>
          <Button
            appearance={editor?.isActive("paragraph") ? "link" : "gray-link"}
            size="sm"
            onClick={() => editor?.chain().focus().setParagraph().run()}
            icon={<UilParagraph />}
          />
        </StyledTooltip>

        <StyledTooltip content={i18next.t("publish.action-bar.heading")}>
          <Dropdown>
            <DropdownToggle>
              <Button appearance="gray-link" size="sm" icon={<UilTextSize />} />
              <DropdownMenu>
                {headings.map((heading) => (
                  <DropdownItem
                    key={heading}
                    selected={editor?.isActive("heading", { level: heading })}
                    onClick={() => clearChain().toggleHeading({ level: heading }).run()}
                  >
                    {i18next.t("publish.heading")} {heading}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </DropdownToggle>
          </Dropdown>
        </StyledTooltip>

        <StyledTooltip content={i18next.t("publish.action-bar.list")}>
          <Dropdown>
            <DropdownToggle>
              <Button appearance="gray-link" size="sm" icon={<UilListUiAlt />} />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItemWithIcon
                selected={editor?.isActive("bulletList")}
                icon={<UilListUl />}
                label={i18next.t("publish.bullet-list")}
                onClick={() => clearChain().toggleBulletList().run()}
              />
              <DropdownItemWithIcon
                selected={editor?.isActive("orderedList")}
                icon={<UilListOl />}
                label={i18next.t("publish.ordered-list")}
                onClick={() => clearChain().toggleOrderedList().run()}
              />
            </DropdownMenu>
          </Dropdown>
        </StyledTooltip>

        <Dropdown>
          <DropdownToggle>
            <Button icon={<UilEllipsisH />} size="sm" appearance="gray-link" />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItemWithIcon
              onClick={() => clearChain().toggleCodeBlock().run()}
              selected={editor?.isActive("codeBlock")}
              icon={<UilArrow />}
              label={i18next.t("publish.code-block")}
            />
            <DropdownItemWithIcon
              onClick={() => clearChain().toggleBlockquote().run()}
              selected={editor?.isActive("blockquote")}
              icon={<UilDocumentLayoutRight />}
              label={i18next.t("publish.quote")}
            />
            <DropdownItemWithIcon
              onClick={() =>
                clearChain().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()
              }
              icon={<UilTable />}
              label={i18next.t("publish.table")}
            />
            <DropdownItemWithIcon
              icon={<UilBorderHorizontal />}
              label={i18next.t("publish.horizontal-rule")}
              onClick={() => clearChain().setHorizontalRule().run()}
            />
          </DropdownMenu>
        </Dropdown>
        <div className="border-r border-[--border-color] h-10 w-[1px] hidden sm:block" />
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
        >
          <StyledTooltip content={i18next.t("publish.action-bar.fragments")}>
            <LoginRequired>
              <Button
                appearance="gray-link"
                size="sm"
                onClick={() => setShowFragments(true)}
                icon={<UilSubject />}
              />
            </LoginRequired>
          </StyledTooltip>
        </EcencyConfigManager.Conditional>

        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
        >
          <StyledTooltip content={i18next.t("publish.action-bar.image")}>
            <LoginRequired>
              <Dropdown>
                <DropdownToggle>
                  <Button appearance="gray-link" size="sm" icon={<UilImage />} />
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItemWithIcon
                    icon={<UilUpload />}
                    label={i18next.t("publish.upload")}
                    onClick={() => setShowImageUpload(true)}
                  />
                  <DropdownItemWithIcon
                    icon={<UilImages />}
                    label={i18next.t("publish.from-gallery")}
                    onClick={() => setShowGallery(true)}
                  />
                  <DropdownItemWithIcon
                    icon={<UilImageShare />}
                    label={i18next.t("publish.from-link")}
                    onClick={() => setShowImageByLink(true)}
                  />
                </DropdownMenu>
              </Dropdown>
            </LoginRequired>
          </StyledTooltip>
        </EcencyConfigManager.Conditional>

        <div className="relative" ref={emojiPickerAnchorRef}>
          <StyledTooltip content={i18next.t("publish.action-bar.emoji")}>
            <Button appearance="gray-link" size="sm" icon={<UilSmile />} />
          </StyledTooltip>
          <EmojiPicker
            anchor={emojiPickerAnchorRef.current}
            onSelect={(e) => editor?.chain().focus().insertContent(e).run()}
          />
        </div>

        <StyledTooltip
            content={i18next.t("publish.action-bar.color", { defaultValue: "Text color" })}
        >
          <Dropdown>
            <DropdownToggle>
              <Button
                  appearance={activeTextColor ? "link" : "gray-link"}
                  size="sm"
                  icon={
                    <span className="relative flex items-center justify-center">
                    <UilPalette />
                    <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white shadow"
                        style={{ backgroundColor: activeTextColor ?? "transparent" }}
                    />
                  </span>
                  }
              />
            </DropdownToggle>
            <DropdownMenu size="small" className="!min-w-[200px] gap-3">
              <PublishEditorToolbarColorPalette editor={editor} />
            </DropdownMenu>
          </Dropdown>
        </StyledTooltip>

        <StyledTooltip content={i18next.t("publish.action-bar.gif")}>
          <Button
            appearance="gray-link"
            size="sm"
            onClick={() => setShowGifPicker(true)}
          >
            {i18next.t("publish.action-bar.gif")}
          </Button>
        </StyledTooltip>

        <StyledTooltip content={i18next.t("publish.action-bar.video")}>
          <LoginRequired>
            <Dropdown>
              <DropdownToggle>
                <Button icon={<UilVideo />} appearance="gray-link" size="sm" />
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItemWithIcon
                  disabled={!allowToUploadVideo}
                  icon={<UilUpload />}
                  label={i18next.t("publish.three-speak-upload")}
                  onClick={() => {
                    if (allowToUploadVideo) {
                      setShowVideoUpload(true);
                    } else {
                      error(i18next.t("publish.upload-video-error-hint"));
                    }
                  }}
                />
                <DropdownItemWithIcon
                  icon={<UilVideo />}
                  label={i18next.t("publish.three-speak-gallery")}
                  onClick={() => setShowVideoGallery(true)}
                />
                <DropdownItemWithIcon
                  icon={<UilLink />}
                  label={i18next.t("publish.from-link")}
                  onClick={() => setShowVideoLink(true)}
                />
              </DropdownMenu>
            </Dropdown>
          </LoginRequired>
        </StyledTooltip>

        <StyledTooltip content={i18next.t("publish.action-bar.poll")}>
          <Button
            appearance="gray-link"
            size="sm"
            onClick={() => {
              publishState.createDefaultPoll();
              setTimeout(
                () =>
                  document
                    .getElementById("publish-active-poll")
                    ?.scrollIntoView({ behavior: "smooth" }),
                100
              );
            }}
            icon={<UilPanelAdd />}
          />
        </StyledTooltip>
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.publish.geoPicker.enabled}
        >
          <StyledTooltip content={i18next.t("publish.action-bar.geotag")}>
            <Button
              appearance="gray-link"
              size="sm"
              onClick={() => setShowGeoTag(true)}
              icon={<UilMap className={clsx(publishState.location && "text-green-hover")} />}
            />
          </StyledTooltip>
        </EcencyConfigManager.Conditional>

        {/*Dialogs*/}
        <PublishEditorToolbarFragments
          showFragments={showFragments}
          setShowFragments={setShowFragments}
          editor={editor}
        />
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
        >
          <GalleryDialog
            show={showGallery}
            setShow={setShowGallery}
            onPick={(e) => {
              editor
                ?.chain()
                .focus()
                .insertContent([
                  { type: "image", attrs: { src: e } },
                  { type: "paragraph" },
                  { type: "paragraph" }
                ])
                .run();
              setShowGallery(false);
            }}
          />
        </EcencyConfigManager.Conditional>
        <PublishGifPickerDialog
          show={showGifPicker}
          setShow={setShowGifPicker}
          onPick={(url, alt) => {
            editor
              ?.chain()
              .focus()
              .insertContent([
                { type: "image", attrs: { src: url, alt } },
                { type: "paragraph" },
                { type: "paragraph" }
              ])
              .run();
            setShowGifPicker(false);
          }}
        />
        <PublishImageByLinkDialog
          show={showImageByLink}
          setShow={setShowImageByLink}
          onPick={(link, alt) => {
            editor
              ?.chain()
              .focus()
              .insertContent([
                { type: "image", attrs: { src: link, alt } },
                { type: "paragraph" },
                { type: "paragraph" }
              ])
              .run();
            setShowImageByLink(false);
          }}
        />
        <EcencyImagesUploadDialog
          show={showImageUpload}
          setShow={setShowImageUpload}
          onPick={(e) => {
            editor
              ?.chain()
              .focus()
              .insertContent([
                { type: "image", attrs: { src: e } },
                { type: "paragraph" },
                { type: "paragraph" }
              ])
              .run();
          }}
        />

        <PublishEditorVideoGallery
          hasAlreadyPublishingVideo={!!publishState.publishingVideo}
          filterOnly={allowToUploadVideo ? undefined : "published"}
          show={showVideoGallery}
          setShow={setShowVideoGallery}
          onUpload={() => {
            setShowVideoGallery(false);
            setShowVideoUpload(true);
          }}
          onAdd={(video, isNsfw) => {
            attachVideo(video, isNsfw);
            setShowVideoGallery(false);
          }}
        />

        <VideoUpload
          show={showVideoUpload}
          setShow={setShowVideoUpload}
          setShowGallery={setShowVideoGallery}
        />

        <PublishEditorVideoByLinkDialog
          show={showVideoLink}
          setShow={setShowVideoLink}
          onAdd={(e) => {
            const match = e.match(YOUTUBE_REGEX);
            if (match) {
              clearChain()
                .setYoutubeVideo({
                  src: e,
                  thumbnail: `https://img.youtube.com/vi/${match[1]}/0.jpg`
                })
                .run();
            } else {
              clearChain().insertContent(`![](${e})`).run();
            }
            setShowVideoLink(false);
          }}
        />
        {showGeoTag && (
          <PublishEditorGeoTagDialog
            show={showGeoTag}
            setShow={setShowGeoTag}
            initialLocation={publishState.location}
            onPick={(location) => {
              publishState.setLocation(location);
              setShowGeoTag(false);
            }}
            onClear={() => {
              publishState.clearLocation();
              setShowGeoTag(false);
            }}
          />
        )}
      </div>
      {isFocusingTable && <PublishEditorTableToolbar editor={editor} />}
    </>
  );
}
