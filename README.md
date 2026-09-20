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
