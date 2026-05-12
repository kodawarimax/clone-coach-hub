# Clone & Coach Hub

AI Clone management and Coach management dashboard — a focused, standalone Next.js frontend for managing [AI Clone Platform](https://github.com/kodawarimax) clones and coaching data.

## Features

### AI Clone Management
- **Clone list** — view all clones with live status (online/offline)
- **Clone detail** — edit description, specialties, system prompt
- **New clone wizard** — 4-step creation: profile → knowledge → voice → confirm
- **Voice cloning** — YouTube URL → Fish Audio voice clone
- **Restart** — restart clone process on VPS (with confirmation)
- **Deploy** — push code to production (reason required)
- **Logs** — view recent VPS logs

### Coach Management
- 3 built-in coaches: 北原COO (business), 桜田部長 (finance), のがちゃん (fitness)
- **Content** — set today's learning content (YouTube URL + coaching instructions)
- **Weekly plan** — edit weekly goals (markdown editor)
- **Profile** — edit description and specialties
- **Knowledge** — browse knowledge base files

## Quick Start

```bash
git clone https://github.com/kodawarimax/clone-coach-hub.git
cd clone-coach-hub
cp .env.example .env.local
# Edit .env.local with your settings
npm install
npm run dev
# → http://localhost:3200
```

## Configuration

Copy `.env.example` to `.env.local` and set:

| Variable | Description | Default |
|---|---|---|
| `CLONE_CLIENTS_DIR` | Path to AI Clone clients directory | `~/Claude/Service/Clone/clients` |
| `CLONE_VPS_HOST` | VPS hostname for SSH | `72.61.119.101` |
| `CLONE_SERVER_URL` | Clone server base URL | `https://clone.kingjungobot.cloud` |
| `CLONE_ADMIN_API_KEY` | Admin API key for clone ops | — |
| `PORT` | Dev server port | `3200` |

## Stack

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** — gold/navy brand theme
- **lucide-react** — icons

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── clones/               # Clone management pages
│   ├── coach/                # Coach management page
│   └── api/
│       ├── clones/           # Clone CRUD + restart/deploy/logs
│       └── coach-data/       # Coach data read/write
└── components/
    ├── Sidebar.tsx
    ├── clones/               # CloneGrid, CloneDetail, NewCloneWizard
    └── coach/                # CoachPanel
```

## License

MIT
