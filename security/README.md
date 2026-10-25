# Chromium namespace sandbox policy

`chromium-seccomp.json` derives from Moby v28.3.0 `profiles/seccomp/default.json`, Git blob `dafe5cf6a6a3e7f4766037ed0366631b06968160`, under the included Apache 2.0 license (`LICENSE.moby`). Original source: https://github.com/moby/moby/blob/v28.3.0/profiles/seccomp/default.json

The only policy addition allows `clone`, `unshare` and `chroot` so Chromium can establish its own namespace sandbox while the app runs as UID/GID 1000:1000 with every capability dropped and no-new-privileges. These additional kernel calls are a deliberate tradeoff, not a claim of complete application isolation. The browser main process still has application-user access. Do not add SYS_ADMIN, privileged mode or an unconfined seccomp policy to bypass failures.

The deployment script extracts this file from the exact release commit into an owner-private persistent policy directory. The preflight rejects a production container or proposed compose file whose reviewed boundary differs. It intentionally refuses first-time bootstrap or a policy migration; those require a separate reviewed procedure.

Rollback retags the saved previous image and reuses configuration that passed the same boundary check before deployment. It does not overwrite the database. Recovery image IDs, rendered compose settings and policy files are retained under `.deployment/security/`; review their retention before cleanup. The CI deployment script has no independent timed rollback after host failure or session interruption. Do not claim a whole-system recovery guarantee.

Opening a pull request runs the existing quality checks. Merging to main can build and deploy the application; obtain production approval separately. Host-derived PDF port selection, parser limits and remaining dependency advisories are outside this reconciliation patch.
