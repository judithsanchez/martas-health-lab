#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-${PWD}}"
DEPLOY_REF="${DEPLOY_REF:-origin/main}"
IMAGE_ARCHIVE="${IMAGE_ARCHIVE:-/tmp/martas-health-lab-production-image.tar.gz}"
COMPOSE_PROJECT="martas-health-lab"
SERVICE="app"
CONTAINER="martas-lab"
IMAGE="martas-health-lab-app"
DATABASE_FILE="${PROJECT_DIR}/data/prod.db"
MINIMUM_FREE_KB=$((2 * 1024 * 1024))
COMPOSE_FILE="$(mktemp "${TMPDIR:-/tmp}/martas-health-lab-compose.XXXXXX.yml")"
DEPLOY_LOCK="${DEPLOY_LOCK:-/tmp/raspberry-pi-production-deploy.lock}"
LOCK_ACQUIRED=0

cleanup() {
  rm -f "${COMPOSE_FILE}"
  rm -f "${IMAGE_ARCHIVE}"
  if [[ "${LOCK_ACQUIRED}" == "1" ]]; then
    docker builder prune --all --force >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

exec 9>"${DEPLOY_LOCK}"
if ! flock --wait 1800 9; then
  echo "Timed out waiting for another production deployment to finish." >&2
  exit 1
fi
LOCK_ACQUIRED=1

cd "${PROJECT_DIR}"

echo "Fetching production metadata for ${DEPLOY_REF}..."
git fetch origin main
git cat-file -e "${DEPLOY_REF}^{commit}"
git show "${DEPLOY_REF}:docker-compose.yml" >"${COMPOSE_FILE}"

echo "Removing Docker build cache before the disk-space guard..."
docker builder prune --all --force

available_kb="$(df -Pk "${PROJECT_DIR}" | awk 'NR == 2 { print $4 }')"
if [[ -z "${available_kb}" || "${available_kb}" -lt "${MINIMUM_FREE_KB}" ]]; then
  echo "Refusing to load Marta's Health Lab with less than 2 GiB free." >&2
  df -h "${PROJECT_DIR}" >&2
  exit 1
fi

compose() {
  docker compose \
    --project-name "${COMPOSE_PROJECT}" \
    --project-directory "${PROJECT_DIR}" \
    -f "${COMPOSE_FILE}" \
    "$@"
}

previous_image=""
previous_rollback=""
if docker container inspect "${CONTAINER}" >/dev/null 2>&1; then
  previous_image="$(docker container inspect --format '{{.Image}}' "${CONTAINER}")"
fi
if docker image inspect "${IMAGE}:rollback" >/dev/null 2>&1; then
  previous_rollback="$(docker image inspect --format '{{.Id}}' "${IMAGE}:rollback")"
fi

backup_database() {
  [[ -f "${DATABASE_FILE}" ]] || return 0

  if [[ "$(docker container inspect --format '{{.State.Running}}' "${CONTAINER}" 2>/dev/null || true)" != "true" ]]; then
    echo "Refusing to deploy: the database exists but the running app is unavailable for a consistent backup." >&2
    return 1
  fi

  docker exec "${CONTAINER}" node -e '
    const Database = require("better-sqlite3");
    const fs = require("fs");
    const target = "/app/data/backups/pre-deploy.db";
    const temporary = `${target}.tmp`;
    fs.mkdirSync("/app/data/backups", { recursive: true });
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    const db = new Database("/app/data/prod.db", { readonly: true });
    db.backup(temporary)
      .then(() => { db.close(); fs.renameSync(temporary, target); })
      .catch((error) => { db.close(); console.error(error); process.exit(1); });
  '
  echo "Refreshed the bounded pre-deployment SQLite backup."
}

backup_database
if [[ -n "${previous_image}" ]]; then
  docker image tag "${previous_image}" "${IMAGE}:rollback"
fi

docker image rm "${IMAGE}:candidate" >/dev/null 2>&1 || true

if [[ ! -s "${IMAGE_ARCHIVE}" ]]; then
  echo "Marta's Health Lab image archive is missing or empty: ${IMAGE_ARCHIVE}" >&2
  exit 1
fi

echo "Loading the ARM64 image built by GitHub Actions..."
if ! gzip -dc "${IMAGE_ARCHIVE}" | docker image load; then
  echo "Marta's Health Lab image load failed; the running container was not replaced." >&2
  exit 1
fi

candidate_image="$(docker image inspect --format '{{.Id}}' "${IMAGE}:candidate")"
docker image tag "${candidate_image}" "${IMAGE}:latest"

echo "Starting the candidate and waiting for its health check..."
if ! compose up -d --no-build --force-recreate --wait --wait-timeout 120 "${SERVICE}"; then
  echo "Marta's Health Lab verification failed; restoring the previous image." >&2
  docker container inspect "${CONTAINER}" \
    --format 'candidate status={{.State.Status}} exit={{.State.ExitCode}} error={{.State.Error}}' >&2 || true
  docker logs --tail 100 "${CONTAINER}" >&2 || true
  if [[ -n "${previous_image}" ]]; then
    docker image tag "${previous_image}" "${IMAGE}:latest"
    compose up -d --no-build --force-recreate --wait --wait-timeout 120 "${SERVICE}"
  fi
  docker image rm "${IMAGE}:candidate" >/dev/null 2>&1 || true
  docker image rm "${candidate_image}" >/dev/null 2>&1 || true
  exit 1
fi

docker image rm "${IMAGE}:candidate" >/dev/null 2>&1 || true
if [[ -n "${previous_rollback}" && "${previous_rollback}" != "${previous_image}" ]]; then
  docker image rm "${previous_rollback}" >/dev/null 2>&1 || true
fi
docker image prune --force --filter "label=com.martas-health-lab.managed=true"

echo "Marta's Health Lab deployment complete from $(git rev-parse "${DEPLOY_REF}")."
df -h "${PROJECT_DIR}"
