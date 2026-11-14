import { describe, expect, it } from "vitest";
import { countLabel } from "./plural";

describe("countLabel", () => {
  it("singulier jusqu'à 1, pluriel au-delà", () => {
    expect(countLabel(0, "document")).toBe("0 document");
    expect(countLabel(1, "document")).toBe("1 document");
    expect(countLabel(24, "document")).toBe("24 documents");
  });

  it("pluriel explicite", () => {
    expect(countLabel(18, "cours", "cours")).toBe("18 cours");
  });
});
