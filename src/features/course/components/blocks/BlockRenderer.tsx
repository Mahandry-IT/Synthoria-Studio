import type { ReactNode } from "react";
import type { CourseContentBlock } from "../../course.types";
import { ChartBlock } from "./ChartBlock";
import { DiagramBlock } from "./DiagramBlock";
import {
  Callout,
  CodeSnippetBlock,
  DefinitionCard,
  FormulaBlock,
  ListBlock,
  PitfallCard,
  TableBlock,
  TextBlock,
  WorkedExampleStepper,
} from "./SimpleBlocks";

/**
 * Rend un bloc selon son `type`. Un type inconnu, ou un bloc dont la donnée attendue manque,
 * ne rend rien : le reste de la section reste affiché.
 */
export function renderBlock(block: CourseContentBlock): ReactNode {
  switch (block.type) {
    case "text":
      return block.text ? <TextBlock text={block.text} /> : null;
    case "definition":
      return block.text ? <DefinitionCard text={block.text} /> : null;
    case "callout":
      return block.text ? <Callout text={block.text} variant={block.callout_variant} /> : null;
    case "list":
      return block.list_items?.length ? <ListBlock items={block.list_items} ordered={block.list_ordered} /> : null;
    case "table":
      return block.table ? <TableBlock table={block.table} /> : null;
    case "formula":
      return block.formula ? <FormulaBlock formula={block.formula} /> : null;
    case "code":
      return block.code ? <CodeSnippetBlock code={block.code} language={block.code_language} /> : null;
    case "worked_example":
      return block.worked_example?.steps?.length ? <WorkedExampleStepper example={block.worked_example} /> : null;
    case "pitfall":
      return block.pitfall ? <PitfallCard pitfall={block.pitfall} /> : null;
    case "diagram":
      return block.diagram ? <DiagramBlock diagram={block.diagram} /> : null;
    case "chart":
      return block.chart ? <ChartBlock chart={block.chart} /> : null;
    default:
      return null;
  }
}

export function BlockRenderer({ blocks }: { blocks: CourseContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const node = renderBlock(block);
        return node ? <div key={i}>{node}</div> : null;
      })}
    </>
  );
}
