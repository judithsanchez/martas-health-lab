#!/usr/bin/env bash

set -euo pipefail
umask 077

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

cleanup() {
  rm -f "${COMPOSE_FILE}"
  rm -f "${IMAGE_ARCHIVE}"
}
trap cleanup EXIT

exec 9>"${DEPLOY_LOCK}"
if ! flock --wait 1800 9; then
  echo "Timed out waiting for another production deployment to finish." >&2
  exit 1
fi

cd "${PROJECT_DIR}"

echo "Fetching production metadata for ${DEPLOY_REF}..."
git fetch origin main
DEPLOY_REF="$(git rev-parse --verify "${DEPLOY_REF}^{commit}")"
git show "${DEPLOY_REF}:docker-compose.yml" >"${COMPOSE_FILE}"

# Keep each policy file while images/backups may still need it. No cache/image pruning.
mkdir -p "${PROJECT_DIR}/.deployment/security"
POLICY_DIR="$(mktemp -d "${PROJECT_DIR}/.deployment/security/release.XXXXXX")"
export HEALTH_LAB_SECCOMP_PROFILE="${POLICY_DIR}/chromium-seccomp.json"
BOUNDARY_CHECK="${POLICY_DIR}/verify-production-boundary.py"
git show "${DEPLOY_REF}:security/chromium-seccomp.json" >"${HEALTH_LAB_SECCOMP_PROFILE}"
git show "${DEPLOY_REF}:scripts/verify-production-boundary.py" >"${BOUNDARY_CHECK}"

verify_boundary() {
  python3 "${BOUNDARY_CHECK}" --project "${PROJECT_DIR}" \
    --profile "${HEALTH_LAB_SECCOMP_PROFILE}" --compose-file "${COMPOSE_FILE}"
}

# This release path requires the already-reviewed production boundary. It refuses
# bootstrap or policy/configuration migrations, which need separate approval.
verify_boundary

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
if docker container inspect "${CONTAINER}" >/dev/null 2>&1; then
  previous_image="$(docker container inspect --format '{{.Image}}' "${CONTAINER}")"
fi
# Save the reviewed configuration and immutable recovery identity, not only a tag.
printf '%s\n' "${previous_image}" >"${POLICY_DIR}/previous-image.id"
printf '%s\n' "${DEPLOY_REF}" >"${POLICY_DIR}/release-commit.id"
compose config --format json >"${POLICY_DIR}/compose.json"

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
      .catch(() => { db.close(); console.error("Consistent database backup failed; inspect locally."); process.exit(1); });
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
if [[ "$(docker image inspect --format '{{.Architecture}}' "${IMAGE}:candidate")" != "arm64" ]]; then
  echo "Refusing a non-ARM64 production image." >&2
  exit 1
fi
printf '%s\n' "${candidate_image}" >"${POLICY_DIR}/candidate-image.id"
docker image tag "${candidate_image}" "${IMAGE}:latest"

echo "Starting the candidate and waiting for its health check..."
if ! { compose up -d --no-build --force-recreate --wait --wait-timeout 120 "${SERVICE}" && verify_boundary; }; then
  echo "Marta's Health Lab verification failed; restoring the previous image." >&2
  docker container inspect "${CONTAINER}" \
    --format 'candidate status={{.State.Status}} exit={{.State.ExitCode}}' >&2 || true
  echo "Inspect app logs locally if needed; private app logs are not copied to CI." >&2
  if [[ -n "${previous_image}" ]]; then
    docker image tag "${previous_image}" "${IMAGE}:latest"
    compose up -d --no-build --force-recreate --wait --wait-timeout 120 "${SERVICE}"
    verify_boundary
  fi
  docker image rm "${IMAGE}:candidate" >/dev/null 2>&1 || true
  exit 1
fi

docker image rm "${IMAGE}:candidate" >/dev/null 2>&1 || true
# Retain previous image layers and policy directories for reviewed recovery.

echo "Marta's Health Lab deployment complete from $(git rev-parse "${DEPLOY_REF}")."
df -h "${PROJECT_DIR}"
