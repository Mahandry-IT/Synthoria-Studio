"use client";

import { useState } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import { Button } from "@/components/Button";
import { AddCourseContentModal } from "./AddCourseContentModal";
import type { AddCourseSectionsResponse } from "../../course.types";

interface AddCourseContentButtonProps {
  sessionId: string;
  hasNextSteps: boolean;
  onAdded: (result: AddCourseSectionsResponse) => void;
}

/** Ouvre le modal d'ajout de contenu (nouvelles sections) sur un cours déjà généré. */
export function AddCourseContentButton({ sessionId, hasNextSteps, onAdded }: AddCourseContentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
        Ajouter du contenu
      </Button>
      {open && (
        <AddCourseContentModal
          sessionId={sessionId}
          hasNextSteps={hasNextSteps}
          onAdded={onAdded}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
