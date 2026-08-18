---
description: "Rules for responsive styling and snapshot testing MUI components"
trigger: always_on
---
# Responsive Styling & Snapshot Testing

1. **Mandatory Snapshot Testing**: If a requested style change is restricted to a specific viewport (e.g., mobile only or desktop only), **you MUST write and run a snapshot test for the component to lock in the baseline appearance of the unaffected viewport BEFORE making any changes to the source code.** You are forbidden from beginning the work until this snapshot test is established. Failure to do so will result in immediate denial of the task.
2. **Safe Mobile Overrides**: When applying mobile-specific overrides to an existing component's `sx` prop, **do NOT explicitly re-declare the desktop (`md`) value** unless you are completely altering the behavior. Use `{ xs: 'override' }` and omit `md`. This ensures the desktop view safely inherits the component's original defaults without accidentally stripping properties.
3. **Hidden Utility Padding**: When debugging stubborn margin/padding issues, check if custom styled wrappers or utility functions (like `rounded()`) are injecting silent `px` or `py` values. You must explicitly override these (e.g., `p: 0`) rather than just removing padding from parent containers.
