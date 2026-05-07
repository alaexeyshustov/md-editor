# CLAUDE.md

## Project
NativeScript-Vue 3 offline Markdown editor for Android. Reads/writes `.md` files directly to the Obsidian vault folder on the device. No backend.

**Package manager:** always use `pnpm`. Never use `npm` or `yarn`.

**Tech stack:** NativeScript-Vue 3, Pinia, `@nativescript/core/file-system`, `@nativescript/core/clipboard`

## Directory structure
```
app/
  assets/
    images/
    styles/
  components/          # Shared across pages
    Cart/
      Cart.vue
      __tests__/
        Cart.test.ts
  hooks/               # Composables — one folder per hook
    use-vault/
      use-vault.ts
      __tests__/
        use-vault.test.ts
  services/            # External/native API access
    vault-service/
      vault-service.ts
      __tests__/
        vault-service.test.ts
  helpers/             # Pure utility functions
    date/
      date.ts
  stores/              # Pinia stores
    vault.ts
  pages/               # Route-level components
    Dashboard/
      Dashboard.vue
      components/      # Local components live next to their parent
        NoteCard/
          NoteCard.vue
    Editor/
      Editor.vue
      components/
        MarkdownToolbar/
          MarkdownToolbar.vue
  constants.ts         # Vault path, date format, file naming rules
  main.ts
  app.ts
```

## Naming conventions
- Components and their folders: `StudlyCaps` (`NoteCard/NoteCard.vue`)
- Hooks: `use-kebab-case` (`use-vault.ts`)
- Services/helpers: `kebab-case` (`vault-service.ts`)
- Tests: same name as target with `.test` suffix, inside `__tests__/`

## Vue 3 Composition API rules

### No hook spread
Always assign hooks to a named variable. Never destructure unless one-off aliasing would be clean and unambiguous.

```ts
// Bad
const { init, isReady } = useVault();
const { init: initEditor } = useEditor(); // collision workaround = ugly

// Good
const vault = useVault();
const editor = useEditor();
vault.init();
editor.init();
```

Spread is acceptable only when there is a single property and no naming collision risk.

### Keep setup() thin
Components hold only: `defineProps`, `defineEmits`, hook calls, and glue functions that bridge exactly two hooks. No `ref()`, no `reactive()`, no business logic inside `.vue` files.

```ts
// Bad — refs and logic in component
const price = ref(0);
const isVisible = ref(false);

// Good — everything lives in hooks
const noteCard = useNoteCard(props);
const nav = useNav();

function openNote() {
  noteCard.select().then(() => nav.goEditor(noteCard.id));
}
```

Glue functions like `openNote` above are acceptable. If they grow, move them into a dedicated hook.

### No async setup
Use `undefined`-initialized refs + a `load()` method pattern instead of `await` in setup.

```ts
// Bad
const profile = await loadProfile(); // forces Suspense

// Good — in the hook
const profile = ref<Profile>();
async function load() {
  profile.value = await loadProfile();
}
return { profile, load };

// In component
const myProfile = useProfile();
myProfile.load(); // fire and forget; template guards with v-if="myProfile.profile"
```

## Services vs hooks vs helpers
- **service** — native API or external resource access (`VaultService`, `ClipboardService`)
- **hook** — composable that wraps refs, computeds, and service calls for a component
- **helper** — pure functions with no side effects (`formatDate`, `parsePreview`)
- **store** — Pinia; caches file list for fast grid load; delegates all I/O to services

## Constants
All vault path, date format, and file-naming rules live in `app/constants.ts`. Import from there; never hardcode paths or formats elsewhere.

## Architecture goal
`VaultService` must remain framework-agnostic (no Vue imports) so the Phase 2 Android background widget can import it directly without loading the Vue runtime.
