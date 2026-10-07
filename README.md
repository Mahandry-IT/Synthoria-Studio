# Synthoria

Application Next.js pour la génération de cours structurés par IA.

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production

```bash
npm run build
npm start
```

## Pages

| Route | Rôle |
| --- | --- |
| `/dashboard` | Tableau de bord : les 3 derniers podcasts (une carte, lecture inline) et les plans de cours en cours, avec compte à rebours d'expiration et bouton « Reprendre » |
| `/` | Upload et ingestion de PDF |
| `/ask` | Question → plan (relu/édité) → cours → podcast |
| `/history` | Historique des cours ; le détail propose le podcast du cours |
| `/chat` | Chat avec le tuteur d'un cours : choix du cours (`?course=<id>`), puis conversation |

## Format du cours et apprentissage actif

Le cours est rendu **par blocs typés** (`subsections[].blocks[]`, `src/features/course/components/blocks/`) : tableaux, listes, formules, code, exemples pas à pas, encadrés, schémas **Mermaid** (chargés à la demande, mode strict, SVG nettoyé) et graphiques SVG (barres, courbes, secteurs). Un type de bloc inconnu est ignoré ; les sessions historiques gardent le rendu `quoi/pourquoi/comment`.

**Niveau de détail.** Le formulaire de `/ask` propose un `select` « Niveau de détail » : **Express** (5 à 8 sections courtes), **Standard** (9 à 11 sections) ou **Approfondi** (défaut, 12 sections minimum, davantage selon le sujet et le document). Le champ `depth` est envoyé à `POST /courses/plan` (et à la génération directe), puis relu depuis `GET /courses/plans/{plan_id}` : la reprise du plan et « Régénérer le plan » gardent le mode. Un plan ou un cours sans `depth` est traité en `approfondi`.

**Lecteur une section à la fois.** Les sections s'affichent une par une (`SectionsList` → `SectionNav` + `SectionReader`) : liste des sections avec leur état (faite / en cours / à faire), accès direct, boutons Précédent / Suivant ; sur mobile, la liste se replie derrière un bouton. La section courante, les étapes dévoilées et l'avancement de l'exemple à trous sont gardés en `sessionStorage` (logique pure testée dans `sectionProgress.ts`).

Chaque section suit le cycle **Défi → Pourquoi → Quoi → Comment → À toi → Vérifie → Explique avec tes mots** (`components/learning/`), dévoilé progressivement :
- le défi s'affiche seul ; « Valider ma réponse » envoie la réponse (≤ 1000 caractères) à `POST /courses/{session_id}/sections/{section_id}/challenge` (via le rewrite `/api`) : l'IA renvoie un verdict (`on_track` / `partial` / `off_track`), un retour et une piste, sans révéler l'explication. La réponse est analysée à la volée, non enregistrée ;
- **« Je ne sais pas » déverrouille la suite sans aucun appel ni envoi** ; en cas d'erreur (429, 502…), un toast s'affiche et « Continuer sans analyse » reste possible ;
- chaque étape suivante se déplie via « Continuer » (focus déplacé sur l'étape révélée) ; les étapes déjà vues restent repliables. Pourquoi / Quoi / Comment sont lus dans `subsections` ; une sous-section au titre non standard devient une étape générique, dans l'ordre reçu ;
- l'exemple à trous révèle ses étapes une à une (annonce `aria-live`) ;
- « Vérifie » donne un retour immédiat option par option ;
- « Explique avec tes mots » envoie la reformulation (≤ 1000 caractères) à `POST /courses/{session_id}/sections/{section_id}/recall`, la section et les points attendus étant lus côté serveur.

Replis : une section sans défi ni sous-sections (sessions historiques) s'affiche en entier comme avant ; un cours sans `session_id` (non persisté) n'envoie jamais la réponse au défi (pas d'analyse ni de reformulation évaluée).

À l'étape du plan, un **pré-test** facultatif marque les sections déjà maîtrisées (`mastery: "known"`) : le cours en génère une version condensée. La page **/review** et la carte « À réviser aujourd'hui » du dashboard proposent les flashcards issues des questions « Vérifie » (répétition espacée Leitner : J+1, J+3, J+7, J+21).

### Chat du cours

Chaque cours persisté (avec `session_id`) a un **tuteur** qui ne répond qu'aux questions sur sa leçon (`src/features/chat/`) :
- **accès** : bouton flottant (bulle) juste au-dessus du bouton « remonter », qui ouvre un panneau latéral (plein écran sur mobile ; Échap ou ✕ pour fermer) ; ou la page **/chat** (entrée « Chat » de la barre latérale), où l'on choisit d'abord un cours. Le bouton est masqué pendant le quiz ;
- **API** (via le rewrite `/api`) : `GET /courses/{session_id}/chat` (messages non supprimés + quota) ; `POST /courses/{session_id}/chat` `{ message, section_id?, parent_id? }` (timeout 60 s, sans retry pour ne pas consommer deux fois le quota) ; `DELETE /courses/{session_id}/chat/messages/{message_id}` (une question, sa réponse et leur suite) et `DELETE /courses/{session_id}/chat` (tout le chat), tous deux en 204. Le cours est lu côté serveur : seul le message est envoyé ;
- **versions en arbre** : chaque message porte `parent_id` (réponse précédente pour une question, `null` à la racine ; question pour une réponse). Une nouvelle question a pour parent la dernière réponse du fil affiché ; **modifier** une question renvoie le `parent_id` de la question éditée, ce qui crée une version sœur (1 message du quota). Le fil affiché suit, à chaque niveau, la version choisie (par défaut la plus récente) ; la bulle d'une question propose Modifier (édition en ligne), Supprimer (avec confirmation) et, s'il y a plusieurs versions, la navigation `< i/X >`. Supprimer une version affiche sa voisine ; sans version restante, la branche disparaît. Un bouton de l'en-tête (tiroir et page /chat) supprime toute la conversation. Supprimer ne rend pas de quota. Logique pure dans `chat.logic.ts` (`resolveThread`, `selectionAfterDelete`, `removeMessageBranch`) ; un historique sans `parent_id` est lu comme une chaîne chronologique ;
- **limites** (alignées sur le backend) : 1000 caractères par message (`CHAT_MESSAGE_MAX_LENGTH`), **15 messages par jour et par cours** (remis à zéro à minuit UTC). Le compteur « N messages restants aujourd'hui » vient du serveur ; le champ est désactivé une fois la limite atteinte. Un 429 affiche le message du backend tel quel ;
- **historique** : le fil affiché est groupé par jour en accordéons (jour le plus récent ouvert), réponses rendues en texte riche avec leurs sources (liens http(s) uniquement) ; une question hors sujet reçoit un refus marqué d'un badge « Hors sujet ».

## Podcast

Après la génération d'un cours, le backend crée un job de podcast (ou le front le demande via
`POST /podcasts/generate/{session_id}` si `podcast_job_id` est absent). Le front :

1. enchaîne un **modal de progression circulaire** (plan → cours → podcast) qui interroge
   `GET /podcasts/jobs/{job_id}` toutes les 2 s, et s'arrête net à l'état terminal ;
2. permet de **continuer en arrière-plan** (le modal devient un badge flottant) : le cours reste lisible ;
3. affiche le lecteur audio (bloc « Écouter ce cours ») dès que le job est terminé.

Un échec du podcast n'invalide jamais le cours affiché. L'audio est lu via `/api/podcasts/{job_id}/audio`
(rewrite Next vers le backend) : le seek du lecteur exige que le rewrite relaie l'en-tête `Range`
(`206 Partial Content`).

Endpoints backend utilisés par le dashboard : `GET /podcasts?limit=3`, `GET /courses/plans` et
`GET /courses/plans/{plan_id}`.

## Docker

### Quick Start

```bash
# Build and run with Docker Compose
cp .env.example .env
docker compose up -d --build

# Or build and run with Docker
docker build -t synthoria .
docker run -p 3000:3000 synthoria
```

### Development with Docker

```bash
# Run development server with hot reload
docker compose --profile dev up dev
```

### Build Arguments

- `NODE_ENV`: Set to `production` (default) or `development`

### Environment Variables

- `PORT`: Server port (default: 3000)
- `HOSTNAME`: Server hostname (default: "0.0.0.0")

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
