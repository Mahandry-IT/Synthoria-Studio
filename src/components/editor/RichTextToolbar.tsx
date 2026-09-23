"use client";

import type { ComponentType } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import CodeIcon from "@mui/icons-material/Code";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import DataObjectIcon from "@mui/icons-material/DataObject";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { toggleTool, type RichTextTool } from "./richTextTools";

const TOOL_META: Record<RichTextTool, { label: string; Icon: ComponentType<SvgIconProps> }> = {
  bold: { label: "Gras (Ctrl+B)", Icon: FormatBoldIcon },
  italic: { label: "Italique (Ctrl+I)", Icon: FormatItalicIcon },
  strike: { label: "Barré (Ctrl+Maj+S)", Icon: StrikethroughSIcon },
  code: { label: "Code (Ctrl+E)", Icon: CodeIcon },
  bulletList: { label: "Liste à puces", Icon: FormatListBulletedIcon },
  orderedList: { label: "Liste numérotée", Icon: FormatListNumberedIcon },
  codeBlock: { label: "Bloc de code", Icon: DataObjectIcon },
};

interface RichTextToolbarProps {
  editor: Editor;
  tools: RichTextTool[];
  disabled?: boolean;
}

/** Barre d'outils de l'éditeur riche : un bouton bascule par mise en forme, état actif suivi. */
export function RichTextToolbar({ editor, tools, disabled = false }: RichTextToolbarProps) {
  // Ne re-rend la barre que quand l'état actif d'un outil change (pas à chaque frappe)
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => tools.map((tool) => current.isActive(tool)),
  });

  return (
    <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap gap-0.5 border-b border-gray-200 px-1.5 py-1">
      {tools.map((tool, i) => {
        const { label, Icon } = TOOL_META[tool];
        const isActive = active?.[i] ?? false;
        return (
          <button
            key={tool}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={isActive}
            disabled={disabled}
            // Garde la sélection de l'éditeur (le clic ne doit pas lui retirer le focus)
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleTool(editor, tool)}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
          >
            <Icon sx={{ fontSize: 18 }} />
          </button>
        );
      })}
    </div>
  );
}
