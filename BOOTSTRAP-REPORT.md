# Blocks bootstrap and project inventory

## Vendored sources

- Rules: `SELISEdigitalplatforms/blocks-skills`, ref `main`, commit `50e06737a4834db375b36c95075421ad3c08be39`.
- Skills: `SELISEdigitalplatforms/blocks-cli`, ref `main`, commit `218d40241b479fa23b3b1d5cae556d66fc266e1d`.
- Created marker-scoped `AGENTS.md` and `CLAUDE.md`. No pre-existing instruction files or skill collisions were found.
- Installed 19 full skill directories under `.codex/skills`, with matching frontmatter-preserving pointer stubs under `.claude/skills`.
- Missing routed skills: none. Unrouted source directories skipped: `blocks-captcha`, `blocks-secrets`.
- Verified counts, pointer targets, frontmatter, marker pairing, and flow-file links. Provenance is recorded in `.codex/skills/.blocks-skills-source`.

Installed names:

`blocks-bootstrap`, `blocks-data-gateway-configuration`, `blocks-data-gateway-crud`, `blocks-data-storage`, `blocks-frontend-local-https`, `blocks-iam-access-control`, `blocks-iam-account`, `blocks-iam-mfa`, `blocks-iam-organizations`, `blocks-iam-sso-oidc-configuration`, `blocks-iam-sso-oidc-implementation`, `blocks-iam-users`, `blocks-localization-configuration`, `blocks-localization-implementation`, `blocks-mail`, `blocks-notification`, `blocks-notifier`, `blocks-release-deployment`, `blocks-storage-configuration`.

## Project

| Area | Finding |
|---|---|
| Project | PathaoPoth, `prod` |
| Key | `P62e0ad88935f415ca69a98fbe8ecb6b5` |
| App domain | `https://pbngdj-elhjx.slsblx.com` |
| Other reachable projects | 0 |
| Initial login | No OIDC clients or providers; OIDC disabled |
| Configured login | Public PKCE client, identity provider with resolved endpoints, OIDC enabled, production and local HTTPS callbacks |
| Initial data schemas | 0 |
| Data configuration | Default database configuration exists; collection pattern `blx_{SchemaName}s` |
| Mail | Default outbound mail configuration exists |
| Storage | Default Azure storage configuration exists |
| Languages | English (`en-US`, default), German (`de-DE`), Bengali (`bn-BD`) |
| Localization modules | None |
| Release repository | `afiapreety/PathaoPoth`, branch `main`, manual deployment; no last deployment recorded |
| Demo account | Created, activated, verified, and tested through hosted login |

The global CLI was upgraded from `0.2.12` to `0.5.0` with approval. Application cases are persisted in the local API's SQLite database; no cloud Data Gateway schemas were created. No commit or push was performed.
