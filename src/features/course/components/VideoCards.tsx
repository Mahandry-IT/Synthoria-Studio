"use client";

import { useState } from "react";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import type { CourseVideo } from "../course.types";
import { formatVideoDuration } from "../videoFormat";
import { CATEGORY_LABELS, groupByCategory, LEVEL_LABELS } from "../videoGrouping";
import { VideoNoteButton } from "./learning/VideoNoteButton";

interface VideoCardsProps {
  videos: CourseVideo[];
  /** Id de la session persistée : requis pour la note personnelle (absent → pas de bouton note). */
  sessionId?: string | null;
}

/** Carte vidéo : miniature cliquable, remplacée par le lecteur YouTube au clic (rien n'est chargé avant). */
function VideoCard({
  video,
  sessionId,
  onNoteSaved,
}: {
  video: CourseVideo;
  sessionId?: string | null;
  onNoteSaved: (videoId: string, note: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const duration = formatVideoDuration(video.duration_seconds);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.video_id)}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Lire la vidéo : ${video.title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- miniature YouTube externe */}
            <img src={video.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
              <PlayCircleIcon sx={{ fontSize: 56 }} className="text-white drop-shadow" />
            </span>
          </button>
        )}
        {duration && !playing && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-gray-900">{video.title}</p>
        {video.channel && <p className="mt-0.5 text-xs text-gray-500">{video.channel}</p>}
        {(video.category || video.level) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {video.category && <Badge variant="indigo">{CATEGORY_LABELS[video.category] ?? video.category}</Badge>}
            {video.level && <Badge variant="gray">{LEVEL_LABELS[video.level] ?? video.level}</Badge>}
          </div>
        )}
        {video.relevance_reason && <p className="mt-1.5 text-xs italic text-gray-500">{video.relevance_reason}</p>}
        <div className="mt-1 flex items-center justify-between gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-indigo-600 hover:underline"
          >
            Ouvrir sur YouTube
          </a>
          {sessionId && (
            <VideoNoteButton
              sessionId={sessionId}
              videoId={video.video_id}
              videoTitle={video.title}
              initialNote={video.note}
              onSaved={(note) => onNoteSaved(video.video_id, note)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Vidéos YouTube expliquant le cours, affichées au-dessus du podcast.
 * Regroupées par catégorie pédagogique (V2) dès que ≥ 2 catégories sont présentes.
 */
export function VideoCards({ videos, sessionId }: VideoCardsProps) {
  // Notes personnelles : appliquées en local par-dessus les vidéos reçues (comme SectionsList),
  // sans dépendre d'un état mutable détenu par le parent (page Ask ou historique).
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  if (videos.length === 0) return null;
  const groups = groupByCategory(videos);

  const handleNoteSaved = (videoId: string, note: string) => {
    setOverrides((current) => ({ ...current, [videoId]: note }));
  };

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
                <VideoCard
                  key={video.video_id}
                  video={
                    video.video_id in overrides ? { ...video, note: overrides[video.video_id] } : video
                  }
                  sessionId={sessionId}
                  onNoteSaved={handleNoteSaved}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
