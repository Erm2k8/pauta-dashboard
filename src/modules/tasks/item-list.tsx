import type { Context, Item } from "@/core/types";
import { ItemRow } from "./item-row";

export function ItemList({ items, contexts, now }: { items: Item[]; contexts: Map<string, Context>; now: number }) {
  return (
    <ul className="space-y-px">
      {items.map((item, i) => {
        const c = contexts.get(item.contextId);
        return <ItemRow key={item.uid} item={item} index={i} now={now} context={c && { id: c.id, name: c.name, color: c.color }} />;
      })}
    </ul>
  );
}
