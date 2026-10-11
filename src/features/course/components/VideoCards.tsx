import type { CourseVideo } from "../course.types";
import { CATEGORY_LABELS, groupByCategory } from "../videoGrouping";
import { VideoCard } from "./VideoCard";

interface VideoCardsProps {
  /** Vidéos générales du cours (celles rattachées à une section sont affichées dans la section). */
  videos: CourseVideo[];
  /** Id de la session persistée : requis pour la note personnelle (absent → pas de bouton note). */
  sessionId?: string | null;
  onNoteSaved: (videoId: string, note: string) => void;
}

/**
 * Vidéos YouTube expliquant le cours, affichées au-dessus du podcast.
 * Regroupées par catégorie pédagogique (V2) dès que ≥ 2 catégories sont présentes.
 */
export function VideoCards({ videos, sessionId, onNoteSaved }: VideoCardsProps) {
  if (videos.length === 0) return null;
  const groups = groupByCategory(videos);

  return (
    <section aria-labelledby="videos-heading">
      <h2 id="videos-heading" className="mb-3 text-lg font-semibold text-gray-900">
        Vidéos pour aller plus loin
      </h2>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.category ?? "_"}>
            {group.category && (
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {CATEGORY_LABELS[group.category] ?? group.category}
              </h3>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.videos.map((video) => (
                <VideoCard key={video.video_id} video={video} sessionId={sessionId} onNoteSaved={onNoteSaved} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
