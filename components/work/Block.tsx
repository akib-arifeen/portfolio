import type { Block as BlockT } from "@/lib/work";
import { CodeBlock, DecisionsBlock, FactsBlock, MediaBlock, ProseBlock, StepsBlock } from "./blocks";

/** Dispatches one content block to its component by kind. */
export function Block({ block }: { block: BlockT }) {
  switch (block.kind) {
    case "prose":
      return <ProseBlock block={block} />;
    case "code":
      return <CodeBlock block={block} />;
    case "media":
      return <MediaBlock block={block} />;
    case "steps":
      return <StepsBlock block={block} />;
    case "decisions":
      return <DecisionsBlock block={block} />;
    case "facts":
      return <FactsBlock block={block} />;
  }
}
