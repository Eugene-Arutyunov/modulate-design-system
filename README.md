# Modulate Design System

CSS design tokens for Modulate.

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Available modules](#available-modules)
- [Contributing](#contributing)

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
pnpm add @eugene-arutyunov/modulate-design-system
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow: branching strategy, how to set up canary builds, and how to submit changes.

## License

MIT
