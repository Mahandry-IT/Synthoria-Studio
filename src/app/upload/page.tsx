import { UploadWorkspace } from "@/features/ingestion/components/UploadWorkspace";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ingestion de documents
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Uploadez des fichiers PDF pour les utiliser comme contexte lors de la
          génération de cours.
        </p>
      </div>

      <UploadWorkspace />
    </div>
  );
}
