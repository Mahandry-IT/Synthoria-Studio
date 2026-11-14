import type { ComponentType } from "react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import type { NavIconName } from "./navConfig";

const ICONS: Record<NavIconName, ComponentType<{ fontSize?: "small" | "medium" }>> = {
  home: HomeOutlinedIcon,
  dashboard: SpaceDashboardOutlinedIcon,
  pending: PendingActionsOutlinedIcon,
  folder: FolderOpenOutlinedIcon,
  file: DescriptionOutlinedIcon,
  upload: UploadFileOutlinedIcon,
  school: SchoolOutlinedIcon,
  newCourse: EditNoteOutlinedIcon,
  history: HistoryOutlinedIcon,
  review: StyleOutlinedIcon,
  repeat: EventRepeatOutlinedIcon,
  tutor: ForumOutlinedIcon,
};

/** Icône décorative (`aria-hidden` posé par MUI). */
export function NavIcon({ name, small = false }: { name: NavIconName; small?: boolean }) {
  const Icon = ICONS[name];
  return <Icon fontSize={small ? "small" : "medium"} />;
}

export function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />;
}
