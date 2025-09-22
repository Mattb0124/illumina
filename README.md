# Illumina

Full-stack application with Next.js frontend and Node.js backend.

## Structure

```
illumina/
├── frontend/     # Next.js application
├── backend/      # Node.js application
├── shared/       # Shared code between frontend and backend
└── package.json  # Workspace configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
npm install
```

### Development
```bash
# Start both frontend and backend
npm run dev

# Start individually
npm run dev:frontend
npm run dev:backend
```

### Build
```bash
# Build both applications
npm run build
```

### Production
```bash
# Start both applications in production
npm start
```