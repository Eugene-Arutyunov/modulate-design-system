# Contributing to Modulate Design System

This guide covers the Git workflow, branching strategy, and CI setup for contributing to the design system. It does not cover local development, CSS architecture, or token authoring — see the main README for that.

## Table of contents

- [Repository structure](#repository-structure)
- [Branching strategy](#branching-strategy)
- [Workflow step by step](#workflow-step-by-step)
- [CI / CD](#ci--cd)
  - [Release workflow (upstream)](#release-workflow-upstream)
  - [Canary workflow (fork only)](#canary-workflow-fork-only)
  - [Setting up canary builds in your fork](#setting-up-canary-builds-in-your-fork)
  - [Using canary builds in a consuming project](#using-canary-builds-in-a-consuming-project)

## Repository structure

There are two repositories in play:

- **Upstream** — the main design system repo owned by the Modulate team. Stable releases are published from here.
- **Fork** — your personal (or team) fork on GitHub. Feature work and canary builds happen here.

## Branching strategy

### Upstream branches

- `main` — the stable branch. Only accepts PRs that have been reviewed and approved. Releases are tagged from `main`.

### Fork branches

- `main` — kept in sync with upstream `main`. Contains the canary CI workflow (which should **not** be pushed to upstream).
- `feature/*`, `fix/*` — short-lived branches created **from upstream `main`** for individual changes. These are the branches you open PRs from.

## Workflow step by step

### 1. Keep your fork in sync

Before starting any work, make sure your fork's `main` is up to date with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

If you haven't added the upstream remote yet:

```bash
git remote add upstream https://github.com/<upstream-org>/modulate-design-system.git
```

### 2. Create a feature branch from upstream/main

Always branch from `upstream/main`, not from your fork's `main`. This ensures your branch doesn't include the canary workflow or any other fork-only changes:

```bash
git fetch upstream
git checkout -b feature/my-change upstream/main
```

### 3. Do your work, push to your fork

```bash
# ... make changes, commit ...
git push origin feature/my-change
```

Once you push, the canary CI workflow in your fork will automatically build and publish a canary version of the package (see "Canary builds" below). You can install this version in any consuming project to test your changes before the PR is merged.

### 4. Open a PR to upstream

Go to the upstream repo on GitHub and open a Pull Request from `your-fork:feature/my-change` → `upstream:main`.

**Important:** Double-check that your PR does not include the canary workflow file (`.github/workflows/canary.yml`). Since you branched from `upstream/main`, it shouldn't — but verify in the file diff before requesting review.

### 5. After the PR is merged

Once your PR is accepted and merged into upstream, sync your fork:

```bash
git checkout main
git pull upstream main
git push origin main
```

You can delete your feature branch:

```bash
git branch -d feature/my-change
git push origin --delete feature/my-change
```

In your consuming project, switch back to the stable release:

```bash
pnpm add @<upstream-org>/design-system@latest
```

## CI / CD

### Release workflow (upstream)

The release workflow lives in upstream and publishes stable versions to GitHub Packages when a GitHub Release is created. It is triggered by `release: published` events.

The workflow file is located at `.github/workflows/release.yml`.

### Canary workflow (fork only)

The canary workflow lives **only in your fork's `main` branch**. It triggers on every push to any branch except `main` and publishes a pre-release version to GitHub Packages under the `canary` dist-tag.

Each push overwrites the `canary` tag with a new timestamped version. This means you don't need to update your consuming project's `package.json` every time — just run `pnpm update`.

#### Setting up canary builds in your fork

A template workflow is included in this repo at:

```
.github/workflows/canary.yml.template
```

To activate it in your fork:

1. Copy and rename the file, removing the `.template` suffix:

```bash
cp .github/workflows/canary.yml.template .github/workflows/canary.yml
```

2. Open the file and replace `<your-github-username>` with your actual GitHub username (lowercase). This sets the correct package scope for publishing.

3. Commit to your fork's `main` branch:

```bash
git checkout main
git add .github/workflows/canary.yml
git commit -m "ci: enable canary builds"
git push origin main
```

4. Make sure your fork's repository settings allow `GITHUB_TOKEN` to write packages: go to **Settings → Actions → General → Workflow permissions** and select **Read and write permissions**.

That's it. Any push to a non-`main` branch in your fork will now trigger a canary build.

**Do not include `canary.yml` in PRs to upstream.** Since you only commit it to your fork's `main` and create feature branches from `upstream/main`, this should happen naturally.

### Using canary builds in a consuming project

#### Initial setup

Add an `.npmrc` to your project so pnpm knows where to find the canary packages:

```ini
@<your-username>:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Set `NODE_AUTH_TOKEN` as an environment variable. Create a GitHub Personal Access Token:

1. Go to [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name (e.g. "packages read") and select only the `read:packages` scope
4. Click **Generate token** and copy it — it will only be shown once

Add the token to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxx
```

Restart your terminal or run `source ~/.zshrc` for the change to take effect.

If you deploy on Vercel or another platform, add `NODE_AUTH_TOKEN` to the project's environment variables as well.

#### Install the canary package

```bash
pnpm add @<upstream-org>/design-system@npm:@<your-username>/design-system@canary
```

This creates an alias in `package.json`:

```json
"@<upstream-org>/design-system": "npm:@<your-username>/design-system@canary"
```

All imports in your code use `@<upstream-org>/design-system` as usual — no code changes needed.

#### Pull the latest canary after pushing changes

After pushing new commits to your feature branch and the canary CI has finished:

```bash
pnpm update @<upstream-org>/design-system
```

This updates the lock file to the latest canary version. Your `package.json` stays the same.

#### Switch back to stable after your PR is merged

```bash
pnpm add @<upstream-org>/design-system@latest
```

This removes the alias and points the dependency back to the upstream package.
