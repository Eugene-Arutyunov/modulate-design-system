# Contributing to Modulate Design System

Git workflow, branching strategy, and CI setup. For local development, CSS architecture, or token authoring — see the README.

## Table of contents

- [Workflow step by step](#workflow-step-by-step)
- [CI / CD](#ci--cd)
  - [Release workflow](#release-workflow)
  - [Canary workflow](#canary-workflow)
  - [Using canary builds in a consuming project](#using-canary-builds-in-a-consuming-project)

## Workflow step by step

### 1. Keep your fork in sync

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 2. Create a branch

```bash
git checkout -b my-change
```

### 3. Push to your fork

```bash
git push origin my-change
```

### 4. Open a PR to upstream

Open a Pull Request from `your-fork:my-change` → `upstream:main`.

As soon as the PR is opened, a canary build is published automatically. Each subsequent push triggers a new build (see [Using canary builds](#using-canary-builds-in-a-consuming-project)).

### 5. After the PR is merged

```bash
git checkout main
git pull upstream main
git push origin main
git branch -d my-change
git push origin --delete my-change
```

## CI / CD

### Release workflow

Triggered by `release: published`. Publishes stable versions to GitHub Packages.

File: `.github/workflows/release.yml`.

### Canary workflow

Triggered on every push to an open PR targeting `main`. Publishes a pre-release to GitHub Packages.

Each PR gets its own dist-tag (`pr-42`), so builds from different PRs don't overwrite each other. Version format: `0.0.0-pr.{PR_NUMBER}.{SHORT_HASH}`.

File: `.github/workflows/canary.yml`.

### Using canary builds in a consuming project

#### Initial setup

Add `.npmrc` to your project root:

```ini
@eugene-arutyunov:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Create a GitHub Personal Access Token with `read:packages` scope:
[GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)

Add it to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxx
```

For Vercel and other platforms, add `NODE_AUTH_TOKEN` to the project's environment variables.

#### Install or update a canary build from a specific PR

```bash
npm install @eugene-arutyunov/modulate-design-system@pr-42
```

#### Switch back to stable after the PR is merged

```bash
npm install @eugene-arutyunov/modulate-design-system@latest
```
