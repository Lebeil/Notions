import "@blocknote/core/fonts/inter.css";
import "@blocknote/ariakit/style.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/ariakit";
import type { Block } from "@blocknote/core";
import type * as Y from "yjs";
import { useEffect, useRef } from "react";

const DEFAULT_CONTENT: Block<any, any, any>[] = [
  {
    type: "heading",
    props: { level: 1 },
    content: [],
  } as any,
];

interface BlockEditorProps {
  initialContent?: Block<any, any, any>[];
  onSave: (blocks: Block<any, any, any>[]) => void;
  collaboration?: {
    fragment: Y.XmlFragment;
    provider: any;
    user: { name: string; color: string };
  };
}

export function BlockEditor({
  initialContent,
  onSave,
  collaboration,
}: BlockEditorProps) {
  const hasInitialized = useRef(false);

  const editor = useCreateBlockNote(
    collaboration
      ? {
          collaboration: {
            fragment: collaboration.fragment,
            provider: collaboration.provider,
            user: collaboration.user,
          },
        }
      : { initialContent: initialContent ?? DEFAULT_CONTENT }
  );

  // When collaboration is active and the doc is empty, insert a H1
  useEffect(() => {
    if (!collaboration || hasInitialized.current) return;
    hasInitialized.current = true;

    // Check if the editor only has one empty paragraph (default state)
    const doc = editor.document;
    const isEmpty =
      doc.length === 1 &&
      doc[0].type === "paragraph" &&
      (!doc[0].content || (Array.isArray(doc[0].content) && doc[0].content.length === 0));

    if (isEmpty) {
      editor.replaceBlocks(editor.document, DEFAULT_CONTENT);
    }
  }, [editor, collaboration]);

  const handleChange = () => {
    onSave(editor.document);
  };

  return (
    <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
  );
}
