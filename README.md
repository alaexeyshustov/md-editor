# md-editor

Offline Markdown editor scaffold for Android built with NativeScript-Vue 3.

## Setup Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 22.12.0)
- [pnpm](https://pnpm.io/) (>= 10)
- [NativeScript CLI](https://docs.nativescript.org/setup/index.html) (`npm install -g nativescript`)
- [Android Setup](https://docs.nativescript.org/setup/android.html) (Android Studio, SDK, and Emulator/Device)

### Installation

```bash
pnpm install
```

### Local Testing

This project uses [Vitest](https://vitest.dev/) for unit testing.

To run tests once:
```bash
pnpm test:run
```

To run tests in watch mode:
```bash
pnpm test
```

To check code coverage:
```bash
pnpm test:coverage
```

### Android App Development

To prepare the project for Android:
```bash
pnpm prepare:android
```

To run the app on a connected Android device or emulator:
```bash
ns run android
```

To debug the app:
```bash
ns debug android
```

Check the environment status:
```bash
ns doctor android
```

## Stack

- NativeScript 9
- NativeScript-Vue 3
- Vite
- Pinia
- Vitest
- ESLint

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

`pnpm build` produces the Android-targeted NativeScript Vite bundle in `.ns-vite-build/`.

## Project structure

```text
app/
  __tests__/
  App.vue
  app.ts
  env.d.ts
  main.ts
App_Resources/
  Android/
nativescript.config.ts
vite.config.ts
vitest.config.ts
```

## Next steps

- Add file-system-backed vault services in `app/services/`
- Move app constants into `app/constants.ts`
- Add Pinia stores once note loading flows exist
