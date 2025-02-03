"use client";

import { Editor } from "@tiptap/core";
import { Button } from "@ui/button";
import {
  UilArrow,
  UilBold,
  UilBorderHorizontal,
  UilDocumentLayoutRight,
  UilEllipsisH,
  UilImage,
  UilImages,
  UilItalic,
  UilLink,
  UilListOl,
  UilListUiAlt,
  UilListUl,
  UilParagraph,
  UilSmile,
  UilSubject,
  UilTable,
  UilTextSize,
  UilTextStrikeThrough,
  UilUpload
} from "@tooni/iconscout-unicons-react";
import {
  Dropdown,
  DropdownItem,
  DropdownItemWithIcon,
  DropdownMenu,
  DropdownToggle
} from "@ui/dropdown";
import { FragmentsDialog } from "@/features/shared/fragments";
import { EcencyConfigManager } from "@/config";
import React, { useRef, useState } from "react";
import { GalleryDialog } from "@/features/shared";
import { PublishEditorToolbarAddLinkDialog } from "@/app/publish/_components/publish-editor-toolbar-add-link-dialog";
import { EmojiPicker } from "@/features/ui";
import { PublishGifPickerDialog } from "@/app/publish/_components/publish-gif-picker-dialog";

interface Props {
  editor: Editor;
}

const headings = [1, 2, 3, 4, 5, 6];

export function PublishEditorToolbar({ editor }: Props) {
  const emojiPickerAnchorRef = useRef<HTMLDivElement>(null);

  const [showFragments, setShowFragments] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  return (
    <div className="w-full items-center px-2 flex flex-wrap">
      <Button
        appearance={editor.isActive("bold") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        icon={<UilBold />}
      />
      <Button
        appearance={editor.isActive("italic") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        icon={<UilItalic />}
      />
      <Button
        appearance={editor.isActive("strike") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        icon={<UilTextStrikeThrough />}
      />
      <Button
        appearance={editor.isActive("code") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        icon={<UilArrow />}
      />
      <div className="border-r border-[--border-color] h-10 w-[1px]" />
      <Button
        appearance={editor.isActive("paragraph") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().setParagraph().run()}
        icon={<UilParagraph />}
      />
      <Dropdown>
        <DropdownToggle>
          <Button appearance="gray-link" size="sm" icon={<UilTextSize />} />
          <DropdownMenu>
            {headings.map((heading) => (
              <DropdownItem
                key={heading}
                selected={editor.isActive("heading", { level: heading })}
                onClick={() => editor.chain().focus().toggleHeading({ level: heading }).run()}
              >
                Heading {heading}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </DropdownToggle>
      </Dropdown>
      <Dropdown>
        <DropdownToggle>
          <Button appearance="gray-link" size="sm" icon={<UilListUiAlt />} />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItemWithIcon
            selected={editor.isActive("bulletList")}
            icon={<UilListUl />}
            label="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <DropdownItemWithIcon
            selected={editor.isActive("orderedList")}
            icon={<UilListOl />}
            label="Ordered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </DropdownMenu>
      </Dropdown>
      <Dropdown>
        <DropdownToggle>
          <Button icon={<UilEllipsisH />} size="sm" appearance="gray-link" />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItemWithIcon
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            selected={editor.isActive("codeBlock")}
            icon={<UilArrow />}
            label="Code block"
          />
          <DropdownItemWithIcon
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            selected={editor.isActive("blockquote")}
            icon={<UilDocumentLayoutRight />}
            label="Quote"
          />
          <DropdownItemWithIcon
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            icon={<UilTable />}
            label="Table"
          />
          <DropdownItemWithIcon
            icon={<UilBorderHorizontal />}
            label="Horizontal line"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
        </DropdownMenu>
      </Dropdown>
      <div className="border-r border-[--border-color] h-10 w-[1px]" />
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
      >
        <Button
          appearance="gray-link"
          size="sm"
          onClick={() => setShowFragments(true)}
          icon={<UilSubject />}
        />
      </EcencyConfigManager.Conditional>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
      >
        <Dropdown>
          <DropdownToggle>
            <Button appearance="gray-link" size="sm" icon={<UilImage />} />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItemWithIcon icon={<UilUpload />} label="Upload and paste" />
            <DropdownItemWithIcon
              icon={<UilImages />}
              label="From gallery"
              onClick={() => setShowGallery(true)}
            />
          </DropdownMenu>
        </Dropdown>
      </EcencyConfigManager.Conditional>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => setShowAddLink(true)}
        icon={<UilLink />}
      />
      <div className="relative" ref={emojiPickerAnchorRef}>
        <Button appearance="gray-link" size="sm" icon={<UilSmile />} />
        <EmojiPicker
          anchor={emojiPickerAnchorRef.current}
          onSelect={(e) => editor.chain().focus().insertContent(e).run()}
        />
      </div>
      <Button appearance="gray-link" size="sm" onClick={() => setShowGifPicker(true)}>
        GIF
      </Button>

      {/*Dialogs*/}
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
      >
        <FragmentsDialog
          show={showFragments}
          setShow={setShowFragments}
          onPick={(e) => {
            editor.chain().focus().insertContent(e).run();
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
            editor.chain().focus().insertContent(`![](${e})`).run();
            setShowGallery(false);
          }}
        />
      </EcencyConfigManager.Conditional>
      <PublishEditorToolbarAddLinkDialog
        show={showAddLink}
        setShow={setShowAddLink}
        onSubmit={(text, link) => {
          editor.chain().focus().insertContent(`[${text}](${link})`).run();
          setShowAddLink(false);
        }}
      />
      <PublishGifPickerDialog
        show={showGifPicker}
        setShow={setShowGifPicker}
        onPick={(url, alt) => {
          editor.chain().focus().insertContent(`![${alt}](${url})`).run();
          setShowGifPicker(false);
        }}
      />
    </div>
  );
}
