import { useCallback, useState } from "react";
import type { CourseVideo } from "../course.types";

/**
 * Notes personnelles enregistrées pendant la consultation, appliquées par-dessus les vidéos reçues.
 * L'état vit au niveau du cours : une note saisie dans une section survit au changement de section.
 */
export function useVideoNotes() {
  const [notes, setNotes] = useState<ReadonlyMap<string, string>>(new Map());

  const saveNote = useCallback((videoId: string, note: string) => {
    setNotes((current) => new Map(current).set(videoId, note));
  }, []);

  const applyNotes = (videos: CourseVideo[]): CourseVideo[] =>
    videos.map((video) => (notes.has(video.video_id) ? { ...video, note: notes.get(video.video_id) } : video));

  return { applyNotes, saveNote };
}
