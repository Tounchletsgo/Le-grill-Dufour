"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback } from "react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "adm-rte-content",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="adm-rte">
      <div className="adm-rte-toolbar">
        <button
          type="button"
          className={editor.isActive("bold") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
        >
          <strong>G</strong>
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
        >
          <em>I</em>
        </button>
        <span className="adm-rte-sep" />
        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Titre"
        >
          H2
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 3 }) ? "active" : ""}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Sous-titre"
        >
          H3
        </button>
        <span className="adm-rte-sep" />
        <button
          type="button"
          className={editor.isActive("bulletList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          &bull;
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        >
          1.
        </button>
        <span className="adm-rte-sep" />
        <button
          type="button"
          className={editor.isActive("link") ? "active" : ""}
          onClick={setLink}
          title="Lien"
        >
          🔗
        </button>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !content && (
        <span className="adm-rte-placeholder">{placeholder}</span>
      )}
    </div>
  );
}
