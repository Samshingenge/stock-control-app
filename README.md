# Stock Control + Employee Credit Ledger

This monorepo provides a full-stack starter that tracks inventory, supplier purchases, sales, and employee credit balances with partial repayments. It ships with a FastAPI backend, React (Vite + Tailwind) frontend, PostgreSQL database, and Docker Compose workflow.

## Project Structure

```
stock-control/
├─ docker-compose.yml
├─ .env.example
├─ .env.backend.example
├─ .env.frontend.example
├─ Makefile
├─ README.md
├─ backend/
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ app/
│     ├─ __init__.py
│     ├─ main.py
│     ├─ config.py
│     ├─ db.py
│     ├─ models.py
│     ├─ schemas.py
│     ├─ deps.py
│     ├─ utils.py
│     ├─ services/
│     │  ├─ inventory.py
│     │  └─ credits.py
│     ├─ crud/
│     │  ├─ products.py
│     │  ├─ suppliers.py
│     │  ├─ employees.py
│     │  ├─ purchases.py
│     │  ├─ sales.py
│     │  └─ credits.py
│     ├─ routers/
│     │  ├─ health.py
│     │  ├─ products.py
│     │  ├─ suppliers.py
│     │  ├─ employees.py
│     │  ├─ purchases.py
│     │  ├─ sales.py
│     │  ├─ credits.py
│     │  └─ dashboard.py
│     └─ tests/
│        ├─ conftest.py
│        ├─ test_health.py
│        ├─ test_products.py
│        └─ test_credit_flow.py
└─ frontend/
   ├─ Dockerfile
   ├─ package.json
   ├─ tsconfig.json
   ├─ vite.config.ts
   ├─ index.html
   ├─ postcss.config.js
   ├─ tailwind.config.ts
   └─ src/
      ├─ main.tsx
      ├─ App.tsx
      ├─ lib/
      │  ├─ api.ts
      │  └─ types.ts
      ├─ components/
      │  ├─ Layout.tsx
      │  ├─ CardStat.tsx
      │  └─ DataTable.tsx
      └─ pages/
         ├─ Dashboard.tsx
         ├─ Inventory.tsx
         ├─ Purchases.tsx
         ├─ Sales.tsx
         ├─ Credit.tsx
         ├─ Employees.tsx
         ├─ Suppliers.tsx
         ├─ Reports.tsx
         └─ Settings.tsx
```

## Quick Start

1. Copy environment templates:
   ```bash
   cp .env.example .env
   cp .env.backend.example .env.backend
   cp .env.frontend.example .env.frontend
   ```
2. Start the stack:
   ```bash
   make up
   ```
3. Seed demo data (optional):
   ```bash
   make seed
   ```
4. Open the UI at http://localhost:5173 and API docs at http://localhost:8000/docs.

## Local Development Without Docker

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg://stock:stockpass@localhost:5432/stockdb"
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
docker run -e POSTGRES_PASSWORD=stockpass -e POSTGRES_USER=stock -e POSTGRES_DB=stockdb -p 5432:5432 -v pgdata:/var/lib/postgresql/data -d postgres:16-alpine
```

## Testing

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
docker compose logs -f backend
docker compose exec backend pytest -q
```

## Deployment Notes

- Keep production secrets in a secure `.env`.
- Use managed PostgreSQL where possible and enable backups.
- Consider adding Alembic for schema migrations as the data model evolves.
- For SSL and domain routing, place the stack behind a reverse proxy such as Caddy or Nginx.
