# CLAUDE.md

## Project
NativeScript-Vue 3 offline Markdown editor for Android. Reads/writes `.md` files directly to the Obsidian vault folder on the device. No backend.

**Package manager:** always use `pnpm`. Never use `npm` or `yarn`.
**Tech stack:** NativeScript-Vue 3, Pinia, `@nativescript/core/file-system`, `@nativescript/core/clipboard`


## TDD
**Always use TDD**

- Always run linter `pnpm run lint` after making changing a file to fix style issues
- Always run tests `pnpm run test` after making changing a file to run a single test file
- Always run type checks `pnpm run typecheck` after modifying type signatures to catch errors early

## Documentation

- [Architecture](docs/architecture.md)
- [Conventions](docs/conventions.md)
