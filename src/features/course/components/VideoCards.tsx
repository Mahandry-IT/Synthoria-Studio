"use client";

import { useState } from "react";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Card } from "@/components/Card";
import type { CourseVideo } from "../course.types";
import { formatVideoDuration } from "../videoFormat";

interface VideoCardsProps {
  videos: CourseVideo[];
}

/** Carte vidéo : miniature cliquable, remplacée par le lecteur YouTube au clic (rien n'est chargé avant). */
function VideoCard({ video }: { video: CourseVideo }) {
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
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
        >
          Ouvrir sur YouTube
        </a>
      </div>
    </Card>
  );
}

/** Vidéos YouTube expliquant le cours, affichées au-dessus du podcast. */
export function VideoCards({ videos }: VideoCardsProps) {
  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="videos-heading">
      <h2 id="videos-heading" className="mb-3 text-lg font-semibold text-gray-900">
        Vidéos pour aller plus loin
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.video_id} video={video} />
        ))}
      </div>
    </section>
  );
}
