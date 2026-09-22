import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CourseVideo } from "../course.types";
import { VideoCards } from "./VideoCards";

const video = (overrides: Partial<CourseVideo> = {}): CourseVideo => ({
  video_id: "dQw4w9WgXcQ",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  title: "Titre",
  ...overrides,
});

const html = (videos: CourseVideo[]) => renderToStaticMarkup(createElement(VideoCards, { videos }));

describe("VideoCards", () => {
  it("n'affiche rien sans vidéo", () => {
    expect(html([])).toBe("");
  });

  it("affiche le badge de durée quand elle est connue", () => {
    expect(html([video({ duration_seconds: 754 })])).toContain("12:34");
  });

  it("n'affiche aucun badge sans durée connue", () => {
    const out = html([video({ duration_seconds: null })]);
    expect(out).not.toMatch(/\d+:\d{2}/);
  });

  it("affiche titre et chaîne", () => {
    const out = html([video({ title: "Cours complet", channel: "Ma Chaîne" })]);
    expect(out).toContain("Cours complet");
    expect(out).toContain("Ma Chaîne");
  });
});
