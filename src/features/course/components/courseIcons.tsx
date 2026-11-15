import type { ComponentType } from "react";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import type { CourseSectionIconName } from "../courseSections";

const ICONS: Record<CourseSectionIconName, ComponentType<{ fontSize?: "small" | "medium" }>> = {
  question: QuestionAnswerOutlinedIcon,
  podcast: HeadphonesOutlinedIcon,
  course: MenuBookOutlinedIcon,
  pitfalls: WarningAmberOutlinedIcon,
  summary: SummarizeOutlinedIcon,
  nextSteps: AltRouteOutlinedIcon,
};

/** Icône décorative d'un bloc de cours (`aria-hidden` posé par MUI). */
export function CourseSectionIcon({ name }: { name: CourseSectionIconName }) {
  const Icon = ICONS[name];
  return <Icon fontSize="medium" />;
}
