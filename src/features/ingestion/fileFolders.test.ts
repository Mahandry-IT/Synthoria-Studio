import { describe, expect, it } from "vitest";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "@/components/folders/folders.constants";
import { buildFolderTree, filterFilesByFolder, sortFilesByName, uploadTarget, visibleFiles } from "./fileFolders";
import type { FileInfo } from "./ingestion.types";

let nextId = 1;
function file(filename: string, folder = DEFAULT_FOLDER, subfolder = DEFAULT_SUBFOLDER): FileInfo {
  return { id: nextId++, filename, folder, subfolder };
}

const files: FileInfo[] = [
  file("b.pdf", "Maths", "Algèbre"),
  file("a.pdf", "Maths"),
  file("c.pdf", "Maths", "Algèbre"),
  file("d.pdf"),
  file("e.pdf", "économie"),
  file("f.pdf", "Biologie", "Zoologie"),
  file("g.pdf", "Biologie", "anatomie"),
];

describe("buildFolderTree", () => {
  it("returns an empty tree for no files", () => {
    expect(buildFolderTree([])).toEqual([]);
  });

  it("puts the default folder first, then sorts ignoring case and accents", () => {
    expect(buildFolderTree(files).map((f) => f.name)).toEqual([DEFAULT_FOLDER, "Biologie", "économie", "Maths"]);
  });

  it("counts files per folder and per subfolder, default subfolder first", () => {
    const maths = buildFolderTree(files).find((f) => f.name === "Maths");
    expect(maths).toEqual({
      name: "Maths",
      count: 3,
      subfolders: [
        { name: DEFAULT_SUBFOLDER, count: 1 },
        { name: "Algèbre", count: 2 },
      ],
    });
  });

  it("sorts subfolders alphabetically ignoring case", () => {
    const bio = buildFolderTree(files).find((f) => f.name === "Biologie");
    expect(bio?.subfolders.map((s) => s.name)).toEqual(["anatomie", "Zoologie"]);
  });
});

describe("filterFilesByFolder", () => {
  it("returns every file without a filter", () => {
    expect(filterFilesByFolder(files, null)).toHaveLength(files.length);
  });

  it("keeps a whole folder, all subfolders included", () => {
    expect(filterFilesByFolder(files, { folder: "Maths" }).map((f) => f.filename)).toEqual(["b.pdf", "a.pdf", "c.pdf"]);
  });

  it("keeps a single subfolder", () => {
    expect(filterFilesByFolder(files, { folder: "Maths", subfolder: "Algèbre" }).map((f) => f.filename)).toEqual([
      "b.pdf",
      "c.pdf",
    ]);
  });
});

describe("sortFilesByName / visibleFiles", () => {
  it("sorts by name ignoring case and accents, numbers in natural order", () => {
    const sorted = sortFilesByName([file("B.pdf"), file("é.pdf"), file("a10.pdf"), file("a2.pdf")]);
    expect(sorted.map((f) => f.filename)).toEqual(["a2.pdf", "a10.pdf", "B.pdf", "é.pdf"]);
  });

  it("filters by folder then by search, sorted by name", () => {
    expect(visibleFiles(files, { folder: "Maths" }, " C ").map((f) => f.filename)).toEqual(["c.pdf"]);
    expect(visibleFiles(files, { folder: "Maths" }, "").map((f) => f.filename)).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
  });
});

describe("uploadTarget", () => {
  it("lets the backend use the default folder for « all files »", () => {
    expect(uploadTarget(null)).toBeUndefined();
  });

  it("targets the selected folder or subfolder", () => {
    expect(uploadTarget({ folder: "Maths" })).toEqual({ folder: "Maths" });
    expect(uploadTarget({ folder: "Maths", subfolder: "Algèbre" })).toEqual({ folder: "Maths", subfolder: "Algèbre" });
  });
});
