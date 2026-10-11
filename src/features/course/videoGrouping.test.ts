import { describe, expect, it } from "vitest";
import type { CourseVideo } from "./course.types";
import { groupByCategory, splitVideosBySection } from "./videoGrouping";

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

describe("splitVideosBySection", () => {
  const ids = (videos: CourseVideo[] | undefined) => (videos ?? []).map((v) => v.video_id);

  it("rattache chaque vidéo à sa section et laisse les autres au niveau du cours, dans l'ordre reçu", () => {
    const videos = [
      video({ video_id: "a", section_id: "s2" }),
      video({ video_id: "b" }),
      video({ video_id: "c", section_id: "s1" }),
      video({ video_id: "d", section_id: null }),
      video({ video_id: "e", section_id: "s2" }),
    ];

    const { general, bySection } = splitVideosBySection(videos, ["s1", "s2"]);

    expect(ids(general)).toEqual(["b", "d"]);
    expect(ids(bySection.get("s1"))).toEqual(["c"]);
    expect(ids(bySection.get("s2"))).toEqual(["a", "e"]);
  });

  it("garde en vidéo générale celle dont la section est inconnue", () => {
    const { general, bySection } = splitVideosBySection([video({ section_id: "supprimée" })], ["s1"]);

    expect(general).toHaveLength(1);
    expect(bySection.size).toBe(0);
  });

  it("plafonne à 2 vidéos par section, le surplus restant au niveau du cours", () => {
    const videos = ["a", "b", "c"].map((video_id) => video({ video_id, section_id: "s1" }));

    const { general, bySection } = splitVideosBySection(videos, ["s1"]);

    expect(ids(bySection.get("s1"))).toEqual(["a", "b"]);
    expect(ids(general)).toEqual(["c"]);
  });

  it("ne change rien pour un cours sans rattachement ni section", () => {
    const videos = [video({ video_id: "a" }), video({ video_id: "b", section_id: "s1" })];

    expect(splitVideosBySection(videos, []).general).toEqual(videos);
    expect(splitVideosBySection([], ["s1"])).toEqual({ general: [], bySection: new Map() });
  });
});
