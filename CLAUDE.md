
## Frontend Design Consistency

All frontend pages must follow one consistent design system.

### 1. Design system
- Use the existing project design as the single source of truth.
- Keep colors, typography, spacing, border radius, shadows, and component styles consistent.
- Use the Steply brand color `#E4F70A` as an accent, not as a full-page background.
- Keep the interface light-first, modern, clean, and responsive.

### 2. Shared components
- Reuse shared components instead of creating duplicates.
- Use the same header, navigation, buttons, inputs, cards, dialogs, tables, and page layouts across the application.
- Before creating a new component, check whether a reusable one already exists.
- Do not create a new visual style for an individual page without a clear requirement.

### 3. Page consistency
- Auth pages must share the same visual language.
- Exams, Practice, Speaking, Results, and Dashboard pages must use the same design tokens and component patterns.
- Keep consistent content widths, page padding, section spacing, headings, and responsive breakpoints.
- Loading, empty, error, and disabled states must follow shared patterns.

### 4. Before changing frontend code
1. Inspect the existing components and styles.
2. Identify reusable components and design tokens.
3. Reuse existing patterns wherever possible.
4. Avoid unnecessary redesigns and duplicate CSS.
5. Check responsive behavior and visual consistency after changes.

### 5. Completion criteria
- No conflicting colors, typography, spacing, or button styles.
- No unnecessary duplicate components.
- No broken responsive layouts.
- Existing functionality and API integrations remain intact.
- Report which files were changed and any remaining inconsistencies.