---
description: "Strict constraints for modifying existing UI layouts and synchronizing component heights"
trigger: always_on
---
# UI Modification Constraints

When asked to fix UI alignment, layout issues, or mismatched heights, you MUST adhere to the following strict constraints:

## 1. Respect Existing Architecture
Assume the current UI architecture, component hierarchy, and CSS properties exist for a specific reason ("必要だから今のUIになっている"). 
- **DO NOT** arbitrarily rearrange the DOM structure or move components out of their parent containers just to fix alignment.
- **DO NOT** arbitrarily remove intentional CSS properties like text wrapping (`white-space: pre-wrap`, `overflow: wrap`) just to force heights to align.

## 2. Synchronizing Heights Across Components
When you need to synchronize the heights of two independent, side-by-side components (e.g., when text wraps differently in localized panes like `ja` and `en`), you must maintain the component hierarchy.
- **Preferred Approach**: Use JavaScript/React to dynamically measure and sync heights. For example, use a `ResizeObserver` to measure the content height (`scrollHeight`) of both components, calculate the maximum height, and apply it as a `minHeight` style to both containers.
- **Forbidden Approach**: Do not extract the inner content into a shared flex container at the bottom of the screen if it changes the intended component structure.

## 3. ABSOLUTE PROHIBITION on CSS Injection
- **Never Inject `<style>` Tags**: You are strictly forbidden from injecting inline `<style>` tags or blocks into React components or the DOM to apply CSS rules (e.g., `<style>{...}</style>`).
- **Use Established Mechanisms Only**: All styling must be applied exclusively through the project's established mechanisms: standard React inline styles (`style={{...}}`), existing utility classes, or safely appending to global stylesheet files (like `globals.css`) if absolutely necessary.
