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
        className="mx-auto max-h-96 w-auto rounded-lg border border-gray-200 object-contain"
      />
      {(displayCaption || attribution?.author || attribution?.license) && (
        <figcaption className="mt-1.5 text-center text-xs text-gray-500">
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
                      className="underline hover:text-gray-700"
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
