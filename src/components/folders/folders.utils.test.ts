import { describe, expect, it } from "vitest";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "./folders.constants";
import { filterLabel, folderLabel } from "./folders.utils";

describe("folderLabel", () => {
  it("shows only the default folder for the default placement", () => {
    expect(folderLabel({ folder: DEFAULT_FOLDER, subfolder: DEFAULT_SUBFOLDER })).toBe(DEFAULT_FOLDER);
  });

  it("omits the default subfolder", () => {
    expect(folderLabel({ folder: "Maths", subfolder: DEFAULT_SUBFOLDER })).toBe("Maths");
  });

  it("joins folder and subfolder", () => {
    expect(folderLabel({ folder: "Maths", subfolder: "Algèbre" })).toBe("Maths / Algèbre");
  });
});

describe("filterLabel", () => {
  it("falls back to the « all » label", () => {
    expect(filterLabel(null, "Tous les fichiers")).toBe("Tous les fichiers");
  });

  it("describes a folder or a subfolder", () => {
    expect(filterLabel({ folder: "Maths" }, "Tous")).toBe("Maths");
    expect(filterLabel({ folder: "Maths", subfolder: "Algèbre" }, "Tous")).toBe("Maths / Algèbre");
  });
});
