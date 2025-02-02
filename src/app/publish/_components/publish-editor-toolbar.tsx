"use client";

import { Editor } from "@tiptap/core";
import { Button } from "@ui/button";
import {
  UilArrow,
  UilBold,
  UilBorderHorizontal,
  UilDocumentLayoutRight,
  UilItalic,
  UilListOl,
  UilListUl,
  UilParagraph,
  UilSubject,
  UilTextSize,
  UilTextStrikeThrough
} from "@tooni/iconscout-unicons-react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { FragmentsDialog } from "@/features/shared/fragments";
import { EcencyConfigManager } from "@/config";
import { useState } from "react";
import { markdown2Html } from "@ecency/render-helper/lib/markdown-2-html";

interface Props {
  editor: Editor;
}

const headings = [1, 2, 3, 4, 5, 6];

export function PublishEditorToolbar({ editor }: Props) {
  const [showFragments, setShowFragments] = useState(false);

  return (
    <div className="w-full items-center px-2 md:px-4 flex flex-wrap">
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
      {/*<button onClick={() => editor.chain().focus().unsetAllMarks().run()}>Clear marks</button>*/}
      {/*<button onClick={() => editor.chain().focus().clearNodes().run()}>Clear nodes</button>*/}
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
      <Button
        appearance={editor.isActive("bulletList") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={<UilListUl />}
      />
      <Button
        appearance={editor.isActive("orderedList") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={<UilListOl />}
      />
      <Button
        appearance={editor.isActive("codeBlock") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        icon={<UilArrow />}
      />
      <Button
        appearance={editor.isActive("blockquote") ? "link" : "gray-link"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={<UilDocumentLayoutRight />}
      />
      <Button
        appearance="gray-link"
        size="sm"
        icon={<UilBorderHorizontal />}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <div className="border-r border-[--border-color] h-10 w-[1px]" />
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => setShowFragments(true)}
        icon={<UilSubject />}
      />

      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
      >
        <FragmentsDialog
          show={showFragments}
          setShow={setShowFragments}
          onPick={(e) => {
            editor.commands.insertContent(markdown2Html(e), {
              parseOptions: {
                preserveWhitespace: true
              }
            });
            setShowFragments(false);
          }}
        />
      </EcencyConfigManager.Conditional>
      {/*<Button*/}
      {/*  appearance="gray-link"*/}
      {/*  size="sm"*/}
      {/*  onClick={() => editor.chain().focus().undo().run()}*/}
      {/*  disabled={!editor.can().chain().focus().undo().run()}*/}
      {/*  icon={<UilCornerUpLeftAlt />}*/}
      {/*/>*/}
      {/*<Button*/}
      {/*  appearance="gray-link"*/}
      {/*  size="sm"*/}
      {/*  onClick={() => editor.chain().focus().redo().run()}*/}
      {/*  disabled={!editor.can().chain().focus().redo().run()}*/}
      {/*  icon={<UilCornerUpRightAlt />}*/}
      {/*/>*/}
    </div>
  );
}
