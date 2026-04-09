# Contributing to Agent Skills Manager

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

### Requirements

- Node.js 18+
- A C/C++ toolchain for `node-pty` (see [README](README.md#prerequisites))

## How to Contribute

### Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Your OS and Node.js version

### Suggesting Features

Open an issue describing the feature, the use case, and any ideas for implementation.

### Submitting Changes

1. Create a branch from `main`
2. Make your changes
3. Test locally — make sure the app runs without errors
4. Commit with a clear message describing what and why
5. Open a pull request against `main`

## Code Guidelines

- **Language**: TypeScript — no `any` types unless absolutely necessary
- **Comments**: English only
- **Formatting**: Follow the existing code style (Tailwind for styling, functional React components)
- **Components**: Keep components focused — one responsibility per file
- **API routes**: Validate inputs and return proper error responses

## Skill Format

If you're adding features related to skill parsing, the expected format is:

```
skills/
  skill-name/
    SKILL.md          # Active skill
    SKILL.md.disabled # Disabled skill
```

`SKILL.md` files use YAML frontmatter with `name` and `description` fields.

## Questions?

Open an issue — happy to help.
