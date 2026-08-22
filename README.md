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
