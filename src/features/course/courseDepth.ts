/** Niveau de détail du cours (aligné sur le backend) : pilote le nombre de sections et le volume par section. */
export const COURSE_DEPTHS = ["express", "standard", "approfondi"] as const;

export type CourseDepth = (typeof COURSE_DEPTHS)[number];

/** Mode appliqué quand rien n'est choisi, et aux anciens plans/cours sans mode. */
export const DEFAULT_COURSE_DEPTH: CourseDepth = "approfondi";

export interface CourseDepthOption {
  value: CourseDepth;
  label: string;
  /** Une ligne d'aide : durée et volume indicatifs. */
  help: string;
}

export const COURSE_DEPTH_OPTIONS: readonly CourseDepthOption[] = [
  { value: "express", label: "Express", help: "L'essentiel en 5 à 8 sections courtes. Limité à ce plafond, même pour un sujet ou un document volumineux." },
  { value: "standard", label: "Standard", help: "9 à 11 sections équilibrées. Limité à ce plafond : pour un sujet ou un document volumineux, choisissez Approfondi." },
  {
    value: "approfondi",
    label: "Approfondi",
    help: "Toutes les notions détaillées, au moins 12 sections, davantage si le sujet ou le document le demande.",
  },
];

export function isCourseDepth(value: unknown): value is CourseDepth {
  return typeof value === "string" && (COURSE_DEPTHS as readonly string[]).includes(value);
}
