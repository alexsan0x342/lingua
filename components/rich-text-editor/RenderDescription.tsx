"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import { type JSONContent } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import parse from "html-react-parser";

export function RenderDescription({ json }: { json: JSONContent }) {
  const output = useMemo(() => {
    try {
      return generateHTML(json, [
        StarterKit,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Link.configure({
          HTMLAttributes: {
            class: 'text-primary hover:text-primary/80 underline cursor-pointer',
          },
        }),
      ]);
    } catch (error) {
      // Fallback to generating without Link extension if there's a schema error
      console.warn('Falling back to render without Link extension:', error);
      try {
        return generateHTML(json, [
          StarterKit,
          TextAlign.configure({
            types: ["heading", "paragraph"],
          }),
        ]);
      } catch (fallbackError) {
        console.error('Failed to render content:', fallbackError);
        // Last resort: return a safe fallback
        return '<p>Content could not be rendered</p>';
      }
    }
  }, [json]);

  return (
    <div className="prose dark:prose-invert prose-li:marker:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
      {parse(output)}
    </div>
  );
}
