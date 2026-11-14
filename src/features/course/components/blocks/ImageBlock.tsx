import type { CourseContentBlock } from "../../course.types";

/** Image ré-hébergée par le backend (jamais de hotlink) : toujours servie via `/api/media/{asset_id}`. */
export function ImageBlock({
  image,
  caption,
}: {
  image: NonNullable<CourseContentBlock["image"]>;
  caption?: string | null;
}) {
  const displayCaption = caption || image.caption;
  const attribution = image.attribution;

  return (
    <figure className="my-3">
      <img
        src={`/api/media/${image.asset_id}`}
        alt={image.alt || displayCaption || ""}
        width={image.width}
        height={image.height}
        loading="lazy"
        className="mx-auto max-h-96 w-auto rounded-card border border-line object-contain"
      />
      {(displayCaption || attribution?.author || attribution?.license) && (
        <figcaption className="mt-1.5 text-center text-xs text-ink-3">
          {displayCaption}
          {attribution?.author && (
            <span>
              {displayCaption ? " — " : ""}
              {attribution.author}
              {attribution.license && (
                <>
                  {", "}
                  {attribution.license_url ? (
                    <a
                      href={attribution.license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-ink"
                    >
                      {attribution.license}
                    </a>
                  ) : (
                    attribution.license
                  )}
                </>
              )}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
