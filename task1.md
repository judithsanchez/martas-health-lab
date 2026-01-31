# Marta's Lab: Project Specification & Setup Guide

## 1. Project Overview
**Name:** Marta's Lab  
**Goal:** Create a "Local-First, SaaS-Ready" web application for a personal trainer to manage client data, visualize progress, and generate premium PDF reports. The app replaces a legacy desktop tool with a 4-client limit.
**Philosophy:** 
- **Local-First:** Runs on a private Windows machine in the cousin's house. Data stays local for privacy and speed.
- **SaaS-Ready:** Architected to move to the cloud (Vercel + Turso) easily in the future.
- **Support Strategy:** "Hybrid" support via Tailscale & SSH from Amsterdam.

## 2. System Architecture

### 2.1 The "Private Cloud" (Production - Cousin's House)
- **Host Machine:** Windows (10/11) PC.
- **Network:** Tailscale (Mesh VPN).
    - **MagicDNS:** Allows access via `http://trainer-pc:3000` from mobile devices on the same Tailnet.
    - **OpenSSH Server:** Enabled on Windows to allow remote management from Amsterdam.
- **Containerization:** Docker Desktop (utilizing WSL2 backend).
- **Orchestration:** Docker Compose.
- **Data Persistence:** 
    - SQLite database file stored on the Host Machine at `C:/martas-lab/data/prod.db`.
    - **Backups:** "Sidecar" container (Litestream or Rclone) streams database backups to S3/Google Drive.

### 2.2 The Development Environment (Amsterdam)
- **Repo:** GitHub (Monorepo).
- **Registry:** GitHub Packages (ghcr.io) for storing private Docker images.
- **CI/CD:** GitHub Actions builds images on push to `main` and publishes to the registry.

## 3. Technology Stack & Quality Control
*Guarantees code quality from Day 1.*

- **Framework:** Next.js (App Router).
- **Language:** TypeScript (Strict Mode).
- **Database:** SQLite (Local) / Turso (Future Cloud).
- **ORM:** Drizzle ORM.
- **Styling:** Tailwind CSS.
- **Quality Tools:**
    - **ESLint:** Catches bugs (e.g., unused variables).
    - **Prettier:** Enforces consistent formatting (indentation, quotes).
    - **Husky & lint-staged:** "The Bouncer". Runs `eslint` and `prettier` automatically before you can `git commit`. If the code is messy, the commit fails.

## 4. Environment Variables Configuration
*We treat Dev and Prod differently to prevent accidents.*

### 4.1 Development (Your Laptop & Cousin's Dev Mode)
**File Location:** `apps/web/.env.local`
**Contents:**
```properties
# Tells the app to use a local file in the project folder
DATABASE_URL="file:../../data/dev.db"

# Secret for authentication (even if disabled, NextAuth needs it)
NEXTAUTH_SECRET="dev-secret-key-123"

# Public URL (Localhost)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4.2 Production (The "Sealed Box" on Windows)
**File Location:** None (Injected via `docker-compose.yml`)
**Contents:**
```yaml
environment:
  # The path INSIDE the container that links to the Windows hard drive
  - DATABASE_URL="file:/app/data/prod.db"
  - NEXTAUTH_SECRET="[GENERATED_SECURE_KEY]"
  - NEXT_PUBLIC_APP_URL="http://trainer-pc:3000"
```

## 5. GitHub Credentials Guide (Important!)

### 5.1 Who needs what?
1.  **You (Judith):** 
    *   **Need:** Full Access. 
    *   **Where:** Your Terminals.
2.  **The Husband:** 
    *   **Need:** Read Access (to pull the "Separated Box"). 
    *   **Where:** His Windows machine (Docker) + His Git Bash (Code).
3.  **The Windows Machine (Docker):**
    *   **Need:** A "Machine User" identity (We use the Husband's account for this).

### 5.2 How to Generate the Secret Token (PAT)
**Ideally, do this WITH the husband:**
1.  Log in to **his** GitHub account.
2.  Go to **Settings** (Top right profile icon).
3.  Scroll down to **Developer settings** (Left sidebar, very bottom).
4.  Click **Personal access tokens** -> **Tokens (classic)**.
5.  Click **Generate new token (classic)**.
6.  **Note:** "Marta's Docker Access".
7.  **Expiration:** "No expiration" (Recommended for this specific use case so the app doesn't break in 30 days).
8.  **Scopes (Permissions):**
    *   Check `read:packages` (CRITICAL: Allows downloading the Docker image).
    *   Check `repo` (Allows cloning the code).
9.  Click **Generate token**.
10. **COPY IT IMMEDIATELY.** You won't see it again. Save it in a password manager.

### 5.3 Where to Input Credentials
*   **For Docker (The App):** Open Git Bash and run `docker login ghcr.io -u [HIS_USERNAME] -p [THE_TOKEN_YOU_JUST_COPIED]`.
*   **For Git (The Code):** When he tries `git pull` or `git push` for the first time, Windows will pop up a login box. He should choose "Token" or "Sign in with Browser".

## 6. Detailed Setup Guide (Step-by-Step)

### 6.1 Prerequisites (The Windows Checklist)
*Ensure the cousin's husband installs/configures these:*

1.  **Docker Desktop:**
    *   Install from docker.com.
    *   **Check "Use WSL2 based engine" during install.**
2.  **Git for Windows:**
    *   Install to get **Git Bash**.
3.  **Tailscale:**
    *   Install and log in.
    *   **Enable Tailscale SSH:** In Tailscale capabilities/settings.
    *   **Enable MagicDNS:** To use hostname access.
4.  **OpenSSH Server (Windows Feature):**
    *   Settings > System > Optional Features > Search "OpenSSH Server" > Install/Enable.
5.  **GitHub Access:**
    *   Husband creates a GitHub account.
    *   Add him as a **Collaborator** to the repo.
    *   **CRITICAL:** Grant his account **Read Access** to the *GitHub Package* in Package Settings (Note: This option appears only AFTER the first package push).
    *   **PAT:** Generate a Personal Access Token (PAT) for him using the guide above.

### 6.2 Monorepo Structure
*We use pnpm workspaces.*

```text
/martas-health-lab
  ├── /apps
  │    └── /web          # Next.js App
  ├── /packages
  │    ├── /db           # Drizzle Schema
  │    ├── /ui           # Shared Components
  │    └── /config       # Shared ESLint/Prettier configs
  ├── /data              # Local dev data (Ignored by Git)
  └── docker-compose.yml # Production orchestration
```

### 6.3 Production Deployment Setup (The "Dummy" Guide)
*Exact steps for the husband on the Windows machine.*

**Step A: Create the "Home Base"**
1. Open **Git Bash**.
2. Run: `mkdir -p C:/martas-lab/data`
   *   *Result:* A folder `C:\martas-lab` is created. Inside it, a `data` folder waiting for the database.

**Step B: The "Magic" Update Script**
1. Right-click on the **Desktop** -> New -> Text Document.
2. Rename it to `update_marta.bat` (Confirm "Yes" to change extension).
3. Right-click `update_marta.bat` -> Edit.
4. Paste this EXACT text:
   ```batch
   @echo off
   echo Updating Marta's Lab...
   cd C:\martas-lab
   
   :: Pull the latest "Sealed Box" from GitHub
   docker compose pull
   
   :: Restart the app with the new code
   docker compose up -d
   
   echo Update Complete!
   timeout /t 5
   ```
5. Save and Close.

**Step C: The "Brain" (docker-compose.yml)**
1. You (Judith) will create this file in the repo.
2. The husband (or you via SSH) must copy this file to `C:\martas-lab\docker-compose.yml`.
   *   *Note:* Since this file rarely changes, copying it manually once is fine. Or he can `git clone` the repo to `C:\martas-lab\repo` and copy it over.

**Step D: Login (One-Time)**
1. Open Git Bash.
2. Run: `docker login ghcr.io -u [HIS_USERNAME]`
3. Paste his PAT when asked for the password.

**Step E: The "Wake Up" Task**
1. Press `Win + R`, type `taskschd.msc`, press Enter.
2. Right-click "Task Scheduler Library" -> "Create Basic Task".
3. **Name:** "MartaUpdate".
4. **Trigger:** "When the computer starts".
5. **Action:** "Start a Program".
6. **Program/Script:** Browse -> Select `update_marta.bat` on the Desktop.
7. Finish.

## 7. Developer Guide (For Your Cousin's Husband)

### 7.1 His Dev Workflow
1.  **Clone:** `git clone https://github.com/judithsanchez/martas-health-lab.git`
2.  **Install:** `pnpm install`
3.  **Start:** `pnpm dev` (Runs on `localhost:3000`)
4.  **Linting:**
    *   If he tries `git commit` with bad code, **Husky** will yell at him and block the commit.
    *   He must fix the errors (or run `pnpm format`) before he can push.

## 8. Development vs. Production Logic Table

| Feature | Development (His Terminal) | Production (Background Docker) |
| :--- | :--- | :--- |
| **Command** | `pnpm dev` | `docker compose up -d` |
| **Database** | `file:./dev.db` (In project root) | `file:/app/data/prod.db` (In C:\martas-lab\data) |
| **Env Vars** | Loaded from `.env.local` | Injected by `docker-compose.yml` |
| **Updates** | Immediate (Hot Reload) | Automated on Boot (via .bat script) |