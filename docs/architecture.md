# Architecture

## Directory structure
```
app/
  __tests__/
    app.test.ts
  App.vue
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
  env.d.ts
  main.ts
  app.ts
App_Resources/
  Android/
nativescript.config.ts
```

## Architecture goal
`VaultService` must remain framework-agnostic (no Vue imports) so the Phase 2 Android background widget can import it directly without loading the Vue runtime.
