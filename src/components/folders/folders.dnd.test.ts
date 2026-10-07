import { describe, expect, it } from "vitest";
import type { ClientRect, Collision } from "@dnd-kit/core";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "./folders.constants";
import { dropTargetPlacement, innermostPointerWithin, isSamePlacement } from "./folders.dnd";

function rect(left: number, top: number, width: number, height: number): ClientRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

describe("dropTargetPlacement", () => {
  it("maps the fallback zone to the default folder and subfolder", () => {
    expect(dropTargetPlacement({ kind: "default" })).toEqual({ folder: DEFAULT_FOLDER, subfolder: DEFAULT_SUBFOLDER });
  });

  it("maps a folder to its default subfolder", () => {
    expect(dropTargetPlacement({ kind: "folder", folder: "Maths" })).toEqual({
      folder: "Maths",
      subfolder: DEFAULT_SUBFOLDER,
    });
  });

  it("maps a subfolder to itself", () => {
    expect(dropTargetPlacement({ kind: "subfolder", folder: "Maths", subfolder: "Algèbre" })).toEqual({
      folder: "Maths",
      subfolder: "Algèbre",
    });
  });
});

describe("isSamePlacement", () => {
  it("compares folder and subfolder exactly", () => {
    expect(isSamePlacement({ folder: "A", subfolder: "B" }, { folder: "A", subfolder: "B" })).toBe(true);
    expect(isSamePlacement({ folder: "A", subfolder: "B" }, { folder: "a", subfolder: "B" })).toBe(false);
  });
});

describe("innermostPointerWithin", () => {
  it("keeps only the smallest of nested drop zones under the pointer", () => {
    const droppableRects = new Map([
      ["folder-nav-default", rect(0, 0, 200, 400)],
      ["folder-Maths", rect(0, 40, 200, 100)],
      ["subfolder-Maths-Algèbre", rect(20, 80, 180, 30)],
    ]);
    const droppableContainers = [...droppableRects.keys()].map((id) => ({ id }));
    const args = {
      active: { id: "file-1" },
      collisionRect: rect(50, 90, 10, 10),
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 50, y: 90 },
    } as unknown as Parameters<typeof innermostPointerWithin>[0];

    const result: Collision[] = innermostPointerWithin(args);
    expect(result.map((c) => c.id)).toEqual(["subfolder-Maths-Algèbre"]);
  });
});
