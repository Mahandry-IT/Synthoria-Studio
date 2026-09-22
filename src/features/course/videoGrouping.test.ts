import { describe, expect, it } from "vitest";
import type { CourseVideo } from "./course.types";
import { groupByCategory } from "./videoGrouping";

const video = (overrides: Partial<CourseVideo> = {}): CourseVideo => ({
  video_id: "dQw4w9WgXcQ",
  url: "u",
  embed_url: "e",
  thumbnail_url: "t",
  title: "T",
  ...overrides,
});

describe("groupByCategory", () => {
  it("renvoie un seul groupe non catégorisé sans classement V2", () => {
    const videos = [video({ video_id: "a1111111111" }), video({ video_id: "a2222222222" })];

    expect(groupByCategory(videos)).toEqual([{ category: null, videos }]);
  });

  it("renvoie un seul groupe non catégorisé avec une seule catégorie", () => {
    const videos = [
      video({ video_id: "a1111111111", category: "cours" }),
      video({ video_id: "a2222222222", category: "cours" }),
    ];

    const groups = groupByCategory(videos);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBeNull();
  });

  it("regroupe par catégorie dès que 2 catégories distinctes apparaissent, dans l'ordre de première apparition", () => {
    const videos = [
      video({ video_id: "a1111111111", category: "cours" }),
      video({ video_id: "a2222222222", category: "methode" }),
      video({ video_id: "a3333333333", category: "cours" }),
    ];

    const groups = groupByCategory(videos);

    expect(groups.map((g) => g.category)).toEqual(["cours", "methode"]);
    expect(groups[0].videos.map((v) => v.video_id)).toEqual(["a1111111111", "a3333333333"]);
    expect(groups[1].videos.map((v) => v.video_id)).toEqual(["a2222222222"]);
  });

  it("place les vidéos sans catégorie dans leur propre groupe si le classement est partiel", () => {
    const videos = [
      video({ video_id: "a1111111111", category: "cours" }),
      video({ video_id: "a2222222222", category: "methode" }),
      video({ video_id: "a3333333333" }),
    ];

    const groups = groupByCategory(videos);

    expect(groups.map((g) => g.category)).toEqual(["cours", "methode", null]);
  });

  it("renvoie un tableau vide sans vidéo", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
