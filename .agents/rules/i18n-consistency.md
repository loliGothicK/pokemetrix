---
description: "Rules for ensuring translation keys are consistent across localization files"
---
# i18n Translation Consistency

When adding new user-facing features, components, or widgets, you MUST ensure that all new translation keys are added to ALL localization files (e.g., public/locales/ja/translation.json and public/locales/en/translation.json). Never leave raw i18n keys exposed in the UI.

**No Fallback Strings in Code**: Do NOT use i18n fallback strings in your `t()` calls (e.g., `t("quiz.result.share", "結果をXでシェア")`). All translation strings must be defined exclusively inside the localization JSON files. The `t()` function must only take the translation key as its primary string argument.
