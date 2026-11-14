"use client";

import { useState, type ReactNode } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SearchIcon from "@mui/icons-material/Search";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Check, Option } from "@/components/Check";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState } from "@/components/ErrorState";
import { Input, Select, Textarea } from "@/components/Input";
import { LoadingModal } from "@/components/LoadingModal";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { ProgressBar } from "@/components/ProgressBar";
import { Skeleton } from "@/components/Skeleton";
import { Stepper } from "@/components/Stepper";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="kicker">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function Panel({ theme }: { theme: "light" | "dark" }) {
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState<"modal" | "confirm" | "loading" | null>(null);
  const close = () => setDialog(null);

  return (
    <div data-theme={theme} className="flex flex-col gap-8 bg-bg p-6 text-ink">
      <h2 className="text-lg font-semibold">Thème {theme === "dark" ? "sombre" : "clair"}</h2>

      <Section title="Button">
        <Button>Primaire</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button variant="outline">Outline (alias)</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Petit</Button>
        <Button loading>Chargement</Button>
        <Button disabled>Désactivé</Button>
        <Button size="icon" variant="secondary" aria-label="Rechercher">
          <SearchIcon fontSize="small" />
        </Button>
      </Section>

      <Section title="Badge">
        <Badge variant="ok">ok</Badge>
        <Badge variant="warn">warn</Badge>
        <Badge variant="err">err</Badge>
        <Badge variant="neutral">neutral</Badge>
        <Badge variant="info">info</Badge>
        <Badge variant="indigo">indigo</Badge>
        <Badge variant="green">green</Badge>
        <Badge variant="amber">amber</Badge>
        <Badge variant="gray">gray</Badge>
        <Badge variant="red">red</Badge>
      </Section>

      <Section title="Card">
        <Card className="w-56 p-4">Carte simple</Card>
        <Card hover className="w-56 p-4">Carte au survol</Card>
      </Section>

      <Section title="Input, Textarea, Select">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Input label="Titre" placeholder="Un titre" help="Aide au champ" />
          <Input label="E-mail" defaultValue="invalide" error="Adresse invalide" />
          <Textarea label="Note" placeholder="Votre note" />
          <Select label="Niveau" defaultValue="2">
            <option value="1">Débutant</option>
            <option value="2">Intermédiaire</option>
          </Select>
        </div>
      </Section>

      <Section title="Check, radio, Option">
        <Check label="Case à cocher" defaultChecked />
        <Check label="Case vide" />
        <Check type="radio" name={`r-${theme}`} label="Radio A" defaultChecked />
        <Check type="radio" name={`r-${theme}`} label="Radio B" />
        <div className="flex w-full flex-col gap-2">
          <Option name={`o-${theme}`} label="Option sélectionnée" defaultChecked />
          <Option name={`o-${theme}`} label="Autre option" />
        </div>
      </Section>

      <Section title="ProgressBar, Stepper, anneau">
        <div className="flex w-full flex-col gap-3">
          <ProgressBar value={60} label="Progression 60 %" />
          <ProgressBar label="Chargement" />
          <Stepper total={5} current={3} label="Parcours" />
        </div>
        <CircularProgressRing value={0.65} label="Progression 65 %">
          <span className="text-xs">65</span>
        </CircularProgressRing>
        <CircularProgressRing value={0.3} role="timer" label="Temps restant" color="var(--accent)">
          <span className="text-xs">12</span>
        </CircularProgressRing>
      </Section>

      <Section title="Skeleton, ErrorState">
        <Skeleton lines={3} className="w-64" />
        <div className="w-full">
          <ErrorState error={new Error("Le serveur ne répond pas.")} onRetry={() => undefined} />
        </div>
      </Section>

      <Section title="Pagination">
        <Pagination
          page={page}
          totalPages={12}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </Section>

      <Section title="Modal, ConfirmDialog, LoadingModal">
        <Button variant="secondary" onClick={() => setDialog("modal")}>Modal</Button>
        <Button variant="secondary" onClick={() => setDialog("confirm")}>ConfirmDialog</Button>
        <Button variant="secondary" onClick={() => setDialog("loading")}>LoadingModal</Button>
      </Section>

      {dialog === "modal" && (
        <Modal onClose={close} labelledBy={`design-modal-title-${theme}`}>
          <h2 id={`design-modal-title-${theme}`} className="text-base font-semibold">Titre du modal</h2>
          <p className="mt-1 text-sm text-ink-2">Contenu libre. Échap ou clic sur le voile pour fermer.</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={close}>Fermer</Button>
          </div>
        </Modal>
      )}
      {dialog === "confirm" && (
        <ConfirmDialog title="Supprimer ce cours ?" description="Action irréversible." onConfirm={close} onClose={close} />
      )}
      <LoadingModal open={dialog === "loading"} title="Génération en cours" message="Quelques secondes…" icon={<AutoAwesomeIcon />} />
      {dialog === "loading" && (
        <Button className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2" onClick={close}>
          Fermer le chargement
        </Button>
      )}
    </div>
  );
}

/** Tous les composants partagés, en thème clair puis sombre (le sombre via `data-theme` sur un conteneur). */
export function DesignShowcase() {
  return (
    <main className="min-h-dvh">
      <Panel theme="light" />
      <Panel theme="dark" />
    </main>
  );
}
