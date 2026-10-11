import type { CourseVideo } from "../course.types";
import { VideoCard } from "./VideoCard";

interface SectionVideosProps {
  /** Vidéos rattachées à la section (au plus 2, cf. `splitVideosBySection`). */
  videos: CourseVideo[];
  /** Id de la session persistée : requis pour la note personnelle (absent → pas de bouton note). */
  sessionId?: string | null;
  onNoteSaved: (videoId: string, note: string) => void;
}

/** Vidéos qui illustrent une section, affichées dans la section elle-même. Rien sans vidéo. */
export function SectionVideos({ videos, sessionId, onNoteSaved }: SectionVideosProps) {
  if (videos.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="mb-2 text-sm font-semibold text-gray-700">
        {videos.length > 1 ? "Vidéos de cette section" : "Vidéo de cette section"}
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        {videos.map((video) => (
          <VideoCard key={video.video_id} video={video} sessionId={sessionId} onNoteSaved={onNoteSaved} />
        ))}
      </div>
    </div>
  );
}
