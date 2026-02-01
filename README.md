# Marta's Health Lab

A local-first web application for managing personal training clients and generating health reports.

## 🚀 Quick Start (Development)

**Prerequisites:**

- Node.js v20 (LTS) - _Strictly enforced_
- pnpm

### 1. Install Dependencies

```bash
# Ensure you are on Node v20
nvm use 20

# Install
pnpm install
```

### 2. Setup Database

This creates the SQLite database file at `data/dev.db`.

```bash
pnpm db:push
```

### 3. Run the App

Starts the Next.js development server at [http://localhost:3000](http://localhost:3000).

```bash
pnpm dev
```

---

## 🛠 verification

### Check if Database Exists

To verify that the database file was created correctly:

```bash
ls -l data/dev.db
```

You should see a file listing. If it says "No such file", run `pnpm db:push` again.

### View Database Content (Studio)

To browse the data in a visual UI:

```bash
pnpm db:studio
```

---

## ✅ Quality Control

Run these commands periodically to ensure code quality:

```bash
pnpm test          # Run all tests
pnpm type-check     # Run TypeScript validation
pnpm lint          # Run ESlint checks
```

---

## ⚖️ License

**All Rights Reserved.**

Copyright (c) 2026 Judith Sanchez.

Unauthorized copying of this code, via any medium, is strictly prohibited.
Proprietary and confidential.
