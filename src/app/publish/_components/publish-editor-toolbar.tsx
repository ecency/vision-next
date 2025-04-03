"use client";

import { PublishEditorToolbarAddLinkDialog } from "@/app/publish/_components/publish-editor-toolbar-add-link-dialog";
import { PublishGifPickerDialog } from "@/app/publish/_components/publish-gif-picker-dialog";
import { EcencyConfigManager } from "@/config";
import { EcencyImagesUploadDialog } from "@/features/ecency-images";
import { GalleryDialog } from "@/features/shared";
import { FragmentsDialog } from "@/features/shared/fragments";
import { VideoGallery } from "@/features/shared/video-gallery";
import { VideoUpload } from "@/features/shared/video-upload-threespeak";
import { EmojiPicker, StyledTooltip } from "@/features/ui";
import {
  UilArrow,
  UilBold,
  UilBorderHorizontal,
  UilDocumentLayoutRight,
  UilEllipsisH,
  UilImage,
  UilImages,
  UilImageShare,
  UilItalic,
  UilLink,
  UilListOl,
  UilListUiAlt,
  UilListUl,
  UilPanelAdd,
  UilParagraph,
  UilQuestion,
  UilSmile,
  UilSubject,
  UilTable,
  UilTextSize,
  UilTextStrikeThrough,
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
import i18next from "i18next";
import { useRef, useState } from "react";
import { PublishImageByLinkDialog } from "./publish-image-by-link-dialog";
import { PublishEditorVideoByLinkDialog } from "./publish-editor-video-by-link-dialog";
import { usePublishState } from "../_hooks";

interface Props {
  editor: any | null;
}

const headings = [1, 2, 3, 4, 5, 6];

export function PublishEditorToolbar({ editor }: Props) {
  const emojiPickerAnchorRef = useRef<HTMLDivElement>(null);
  const publishState = usePublishState();

  const [showFragments, setShowFragments] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showImageByLink, setShowImageByLink] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoGallery, setShowVideoGallery] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoLink, setShowVideoLink] = useState(false);

  return (
    <div className="w-full items-center p-2 sm:py-0 flex flex-wrap gap-1 sm:gap-0">
      <StyledTooltip content={i18next.t("publish.action-bar.bold")}>
        <Button
          appearance={editor?.isActive("bold") ? "link" : "gray-link"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          icon={<UilBold />}
        />
      </StyledTooltip>
      <StyledTooltip content={i18next.t("publish.action-bar.italic")}>
        <Button
          appearance={editor?.isActive("italic") ? "link" : "gray-link"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          icon={<UilItalic />}
        />
      </StyledTooltip>
      <StyledTooltip content={i18next.t("publish.action-bar.strikethrough")}>
        <Button
          appearance={editor?.isActive("strike") ? "link" : "gray-link"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={!editor?.can().chain().focus().toggleStrike().run()}
          icon={<UilTextStrikeThrough />}
        />
      </StyledTooltip>
      <StyledTooltip content={i18next.t("publish.action-bar.code")}>
        <Button
          appearance={editor?.isActive("code") ? "link" : "gray-link"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleCode().run()}
          disabled={!editor?.can().chain().focus().toggleCode().run()}
          icon={<UilArrow />}
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
                  onClick={() => editor?.chain().focus().toggleHeading({ level: heading }).run()}
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
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            />
            <DropdownItemWithIcon
              selected={editor?.isActive("orderedList")}
              icon={<UilListOl />}
              label={i18next.t("publish.ordered-list")}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
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
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            selected={editor?.isActive("codeBlock")}
            icon={<UilArrow />}
            label={i18next.t("publish.code-block")}
          />
          <DropdownItemWithIcon
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            selected={editor?.isActive("blockquote")}
            icon={<UilDocumentLayoutRight />}
            label={i18next.t("publish.quote")}
          />
          <DropdownItemWithIcon
            onClick={() =>
              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            icon={<UilTable />}
            label={i18next.t("publish.table")}
          />
          <DropdownItemWithIcon
            icon={<UilBorderHorizontal />}
            label={i18next.t("publish.horizontal-rule")}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          />
        </DropdownMenu>
      </Dropdown>
      <div className="border-r border-[--border-color] h-10 w-[1px] hidden sm:block" />
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
      >
        <StyledTooltip content={i18next.t("publish.action-bar.fragments")}>
          <Button
            appearance="gray-link"
            size="sm"
            onClick={() => setShowFragments(true)}
            icon={<UilSubject />}
          />
        </StyledTooltip>
      </EcencyConfigManager.Conditional>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
      >
        <StyledTooltip content={i18next.t("publish.action-bar.image")}>
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
        </StyledTooltip>
      </EcencyConfigManager.Conditional>
      <StyledTooltip content={i18next.t("publish.action-bar.link")}>
        <Button
          appearance="gray-link"
          size="sm"
          onClick={() => setShowAddLink(true)}
          icon={<UilLink />}
        />
      </StyledTooltip>
      <div className="relative" ref={emojiPickerAnchorRef}>
        <StyledTooltip content={i18next.t("publish.action-bar.emoji")}>
          <Button appearance="gray-link" size="sm" icon={<UilSmile />} />
        </StyledTooltip>
        <EmojiPicker
          anchor={emojiPickerAnchorRef.current}
          onSelect={(e) => editor?.chain().focus().insertContent(e).run()}
        />
      </div>
      <Button appearance="gray-link" size="sm" onClick={() => setShowGifPicker(true)}>
        GIF
      </Button>
      <StyledTooltip content={i18next.t("publish.action-bar.video")}>
        <Dropdown>
          <DropdownToggle>
            <Button icon={<UilVideo />} appearance="gray-link" size="sm" />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItemWithIcon
              icon={<UilUpload />}
              label={i18next.t("publish.three-speak-upload")}
              onClick={() => setShowVideoUpload(true)}
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

      {/*Dialogs*/}
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
      >
        <FragmentsDialog
          show={showFragments}
          setShow={setShowFragments}
          onPick={(e) => {
            editor?.chain().focus().insertContent(e).run();
            setShowFragments(false);
          }}
        />
      </EcencyConfigManager.Conditional>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
      >
        <GalleryDialog
          show={showGallery}
          setShow={setShowGallery}
          onPick={(e) => {
            editor?.chain().focus().insertContent(`![](${e})`).run();
            setShowGallery(false);
          }}
        />
      </EcencyConfigManager.Conditional>
      <PublishEditorToolbarAddLinkDialog
        show={showAddLink}
        setShow={setShowAddLink}
        onSubmit={(text, link) => {
          editor?.chain().focus().insertContent(`[${text}](${link})`).run();
          setShowAddLink(false);
        }}
      />
      <PublishGifPickerDialog
        show={showGifPicker}
        setShow={setShowGifPicker}
        onPick={(url, alt) => {
          editor?.chain().focus().insertContent(`![${alt}](${url})`).run();
          setShowGifPicker(false);
        }}
      />
      <PublishImageByLinkDialog
        show={showImageByLink}
        setShow={setShowImageByLink}
        onPick={(link, alt) => {
          editor?.chain().focus().insertContent(`![${alt}](${link})`).run();
          setShowImageByLink(false);
        }}
      />
      <EcencyImagesUploadDialog
        show={showImageUpload}
        setShow={setShowImageUpload}
        onPick={(e) => {
          editor?.chain().focus().insertContent(`![](${e})`).run();
          setShowImageUpload(false);
        }}
      />

      <VideoGallery
        showGallery={showVideoGallery}
        setShowGallery={(v) => setShowVideoGallery(v)}
        insertText={(t) => {}}
        setVideoEncoderBeneficiary={(e) => {
          console.log("ben", e);
        }}
        toggleNsfwC={() => {
          console.log("nsfw");
        }}
        setVideoMetadata={(e) => console.log("meta", e)}
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
          editor?.chain().focus().insertContent(`![](${e})`).run();
          setShowVideoLink(false);
        }}
      />
    </div>
  );
}
