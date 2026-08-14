---
description: "Rules for ensuring translation keys are consistent across localization files"
---
# i18n Translation Consistency

When adding new user-facing features, components, or widgets, you MUST ensure that all new translation keys are added to ALL localization files (e.g., public/locales/ja/translation.json and public/locales/en/translation.json). Never leave raw i18n keys exposed in the UI.

**No Fallback Strings in Code**: Do NOT use i18n fallback strings in your `t()` calls (e.g., `t("quiz.result.share", "結果をXでシェア")`). All translation strings must be defined exclusively inside the localization JSON files. The `t()` function must only take the translation key as its primary string argument.

## Validation & Dev Cache
- **Validation**: Always run pnpm --filter @pokemetrix/app run i18n:check to verify that all translation keys match exactly between locales before assuming there is a missing key.
- **Cache Awareness**: Next.js statically caches JSON imports during development. If the JSON files are structurally sound but the UI continues to render English fallback texts for modified keys, the Next.js Webpack cache is stale. Do not debug nonexistent typos; inform the user they must restart their dev server (
pm run dev) to clear the cache.
