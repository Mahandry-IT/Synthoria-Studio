"use client";

import { ButtonLink } from "@/components/ButtonLink";
import { PageHeader } from "@/components/PageHeader";
import { uploadKicker } from "@/features/ingestion/fileFolders";
import { useAllFiles } from "@/features/ingestion/hooks/useAllFiles";
import { useFileFolderTree } from "@/features/ingestion/hooks/useFileFolderTree";
import { UploadWorkspace } from "@/features/ingestion/components/UploadWorkspace";

export default function UploadPage() {
  const { data: files, isLoading, error } = useAllFiles();
  const { folders } = useFileFolderTree();
  // Jamais un faux « 0 » : le compteur n'apparaît qu'une fois la liste chargée
  const kicker = isLoading || error ? undefined : uploadKicker(files.length, folders.length);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={kicker}
        title="Ingestion de documents"
        description="Uploadez des fichiers PDF pour les utiliser comme contexte lors de la génération de cours."
        actions={
          <ButtonLink href="#import" variant="accent" className="w-full sm:w-auto">
            Importer un PDF
          </ButtonLink>
        }
      />

      <UploadWorkspace />
    </div>
  );
}
