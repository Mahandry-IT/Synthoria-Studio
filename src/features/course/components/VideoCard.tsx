"use client";

import { useState } from "react";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import type { CourseVideo } from "../course.types";
import { formatVideoDuration } from "../videoFormat";
import { CATEGORY_LABELS, LEVEL_LABELS } from "../videoGrouping";
import { VideoNoteButton } from "./learning/VideoNoteButton";

/** Carte vidéo : miniature cliquable, remplacée par le lecteur YouTube au clic (rien n'est chargé avant). */
export function VideoCard({
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
