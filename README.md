# Modulate Design System

CSS design tokens for Modulate.

## Table of contents

- [Architectural layers of the project](#architectural-layers-of-the-project)
- [Installation](#installation)
- [Usage](#usage)
- [Available modules](#available-modules)
- [Contributing](#contributing)
- [Developer reference](#developer-reference)

## Architectural layers of the project

The repository is organised into six layers.

| Layer                | Purpose                                                            |
|----------------------|--------------------------------------------------------------------|
| **Tokens**           | Design values as CSS custom properties.                            |
| **Components**       | Self-contained UI elements with a single, discrete function.       |
| **Widgets**          | Composite UI patterns, representing a reusable piece of interface. |
| **Page composition** | Page scaffolding, element structure, and responsiveness.           |
| **Service**          | Code and assets that support the design system itself.             |
| **Prototypes**       | Code used by prototypes.                                           |

## Installation

The package is published to GitHub Packages. GitHub Packages requires authentication even for public packages, so a one-time setup is needed.

### 1. Create an `.npmrc` file in your project root

```ini
@eugene-arutyunov:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### 2. Set up authentication

Create a GitHub Personal Access Token:

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

### 3. Install the package

```bash
npm install @eugene-arutyunov/modulate-design-system
```

## Usage

Import the full token set or individual modules:

```css
/* All tokens */
@import "@eugene-arutyunov/modulate-design-system";

/* Individual modules */
@import "@eugene-arutyunov/modulate-design-system/colors";
@import "@eugene-arutyunov/modulate-design-system/typography";
@import "@eugene-arutyunov/modulate-design-system/spacers";
@import "@eugene-arutyunov/modulate-design-system/layout";
@import "@eugene-arutyunov/modulate-design-system/ui-components";
@import "@eugene-arutyunov/modulate-design-system/animations";
```

## Available modules

| Module        | Import path                                              |
| ------------- | -------------------------------------------------------- |
| All tokens    | `@eugene-arutyunov/modulate-design-system`               |
| Colors        | `@eugene-arutyunov/modulate-design-system/colors`        |
| Typography    | `@eugene-arutyunov/modulate-design-system/typography`    |
| Spacers       | `@eugene-arutyunov/modulate-design-system/spacers`       |
| Layout        | `@eugene-arutyunov/modulate-design-system/layout`        |
| UI Components | `@eugene-arutyunov/modulate-design-system/ui-components` |
| Animations    | `@eugene-arutyunov/modulate-design-system/animations`    |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow: branching strategy, canary builds, and how to submit changes.

Canary builds (pre-release packages published per PR) are available to maintainers with write access only. External contributors can open PRs as usual — a maintainer can publish a canary build on their behalf if needed.

## Developer reference

Index of internal docs and process guides for contributors and agents working in this repo.

- `src/assets/service/SVG-ICON-SPRITE.md` — describes SVG icon sprite flow.
- `src/assets/service/REPOSITORY-REGISTRY.md` — index of notable functional blocks for developer navigation.

## License

MIT
