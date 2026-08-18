---
description: "Rules for passing props to MUI Stack components"
trigger: always_on
---
# MUI Stack System Props

When writing or fixing MUI components—especially to resolve React DOM prop warnings like "React does not recognize the `alignItems` prop on a DOM element":
1. **Use `sx` for System Props**: Do NOT pass layout system props (e.g., `alignItems`, `justifyContent`) as direct props on `<Stack>`. Always pass them inside the `sx` prop instead (e.g., `<Stack direction="row" sx={{ alignItems: 'center' }}>`).
2. **Preserve Component Semantics**: Do NOT lazily replace `<Stack>` with `<Box sx={{ display: 'flex' }}>` just to bypass the warning. Maintain the user's semantic choices.
