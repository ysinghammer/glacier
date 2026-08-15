# AGENTS Guidelines for This Repository

This repository is a monorepo that contains an application called `Glacier`. The application is designed to manage
information called `Fact Sheets` about all artifacts relevant in software development. This can include information
about the company that build the software (e.g., team structure, company guidelines, etc.), the software itself (e.g.,
architecture, design decisions, etc.), and the development process (e.g., CI/CD pipelines, testing strategies, etc.).
The goal of `Glacier` is to provide a centralized location for all relevant information about software artifacts, making
it easier for developers and agentic systems get an insight into their sofware landscape.

## Workspace Structure

The repository is organized into several directories, each serving a specific purpose:

```
|-- .husky/                 # Contains Husky configuration for Git hooks
|-- .idea/                  # Contains IDE-specific settings and configurations
|-- node_modules/           # Contains installed npm packages
|-- .commitlintrc.json      # Configuration file for commitlinting
|-- .gitignore              # Specifies files and directories to be ignored by Git
|-- .npmrc                  # Configuration file for npm package manager
|-- .oxfmtrc.json           # Configuration file for Oxfmt code formatting
|-- AGENTS.md               # Guidelines for agents interacting with this repository
|-- .oxlintrc.json          # Configuration file for Oxlint code linting
|-- glacier.iml             # IntelliJ IDEA project configuration file
|-- package.json            # Contains metadata and dependencies for the project
|-- pnpm-lock.yaml          # Lockfile for pnpm package manager
|-- pnpm-workspace.yaml     # Configuration file for pnpm workspace
```

## Workspace Tools

The workspace contains several tools that are used to maintain code quality, enforce coding standards, and manage
dependencies. These tools include:

### Oxlint

Check workspace code for potential errors and enforce coding standards.

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `pnpm run lint`     | Check workspace wide code style without auto fixing |
| `pnpm run lint:fix` | Check workspace wide code style with auto fixing    |

### Oxfmt

Oxfmt is used to format code according to a consistent style.

### Husky

Husky is used to manage Git hooks, which are scripts that run automatically at certain points in the Git workflow. The
repository uses Husky to enforce code quality checks before commits and pushes.

### Commitlint

Commitlint is used to enforce a consistent commit message format. The repository uses Commitlint to ensure that all
commit messages follow the Conventional Commits specification. They are automatically executed by `husky`.

### PNPM

PNPM is the primary package manager used in this repository. It is used to manage dependencies and scripts for the project.
