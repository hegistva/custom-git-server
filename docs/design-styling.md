# Design: Professional Frontend Styling with Tailwind CSS

## Goals

Transform the frontend from minimal, unstyled HTML into a professional, clean, modern, simple, uncluttered, high-contrast design system that:

- Provides a cohesive visual identity across all 8 pages and components
- Ensures WCAG AA accessibility compliance (4.5:1 text contrast, 3:1 interactive elements)
- Supports both light and dark modes with system preference detection and manual toggle
- Maintains fast load times and minimal CSS footprint via utility-first approach
- Preserves existing React component structure and logic (styling-only changes)
- Uses a blue-based, tech-forward color palette appropriate for a Git platform

---

## Design Principles

### Blue-Based Tech-Forward Palette

**Primary Colors:**

- **Blue**: #0066CC (primary brand), #0052A3 (hover), #004499 (active), #003366 (dark mode)
- **Gray**: #111111 (text), #666666 (secondary text), #999999 (tertiary), #CCCCCC (borders), #F5F5F5 (backgrounds)
- **White**: #FFFFFF (light mode backgrounds and text)

**Semantic Colors:**

- **Success**: #00AA44 (green)
- **Warning**: #FF9900 (orange)
- **Danger**: #CC0000 (red)
- **Info**: #0066CC (blue)

**Contrast Ratios:**

- Text on white: #111111 on #FFFFFF = 18:1 ✓
- Text on light gray: #111111 on #F5F5F5 = 16:1 ✓
- Links on white: #0066CC on #FFFFFF = 4.5:1 ✓
- Interactive elements (buttons): meet 3:1 minimum

### Dark Mode Strategy

- **Media Strategy**: Respect `prefers-color-scheme: dark` on first load
- **Manual Override**: User can toggle in navbar; preference persists in localStorage
- **Color Inversion**:
  - Light backgrounds (#FFFFFF, #F5F5F5) → Dark backgrounds (#1A1A1A, #2A2A2A)
  - Dark text (#111111) → Light text (#E8E8E8)
  - Borders lighten to improve contrast
  - Blue primary remains consistent for branding

### Typography

- **Font Family**: System fonts (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **Base Size**: 16px
- **Line Height**: 1.5
- **Scale**:
  - H1: 32px (2rem), font-weight 700
  - H2: 24px (1.5rem), font-weight 700
  - H3: 20px (1.25rem), font-weight 600
  - Body: 16px (1rem), font-weight 400
  - Small: 14px (0.875rem), font-weight 400

### Spacing & Layout

- **Base Unit**: 4px (0.25rem)
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Container Max-Width**: 1280px (desktop), full viewport (mobile with padding)
- **Breakpoints**:
  - Mobile: 320px–639px
  - Tablet: 640px–1023px
  - Desktop: 1024px+

### Component Design

- **Buttons**: Rounded corners (8px), padding 12px–16px (size variant), clear focus ring (2px offset)
- **Inputs**: Border 1px solid #CCCCCC, padding 12px, focus: border-blue (#0066CC), focus-ring visible
- **Cards**: White background, subtle border 1px #CCCCCC, shadow on hover or elevation
- **Navigation**: Top horizontal bar (56px), blue accent underline on active route, responsive hamburger on mobile
- **Forms**: Vertical flex layout, 16px gap between fields, error states in red (#CC0000)

---

## Technology Stack

### Styling Framework: Tailwind CSS

- **Why**: Utility-first approach, autoprefixer included, smaller final CSS bundle, rapid iteration
- **Version**: Latest stable (v4+)
- **Configuration**: `tailwind.config.ts` with custom color palette and dark mode support
- **Processing**: PostCSS pipeline with autoprefixer for cross-browser compatibility

### Dependencies to Add

```json
{
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## File Structure Changes

### New Files Created

```text
apps/frontend/
├── tailwind.config.ts          # Tailwind configuration with custom palette
├── postcss.config.js           # PostCSS pipeline setup
├── src/
│   ├── globals.css             # Tailwind directives + custom utilities
│   ├── hooks/
│   │   └── useDarkMode.ts       # Dark mode toggle logic and persistence
│   └── components/
│       ├── ui/                 # Reusable styled components
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   ├── Card.tsx
│       │   ├── Badge.tsx
│       │   ├── Modal.tsx
│       │   ├── Alert.tsx
│       │   ├── Link.tsx
│       │   └── FormGroup.tsx
│       └── layout/             # Layout components
│           ├── AppShell.tsx
│           └── Navbar.tsx
```

### Files Modified

- `apps/frontend/package.json` — add Tailwind dependencies
- `apps/frontend/vite.config.ts` — ensure CSS bundling
- `apps/frontend/src/main.tsx` — import `globals.css`
- `apps/frontend/src/App.tsx` — wrap with AppShell/Navbar
- All page components in `apps/frontend/src/pages/` — apply Tailwind classes
- All feature components in `apps/frontend/src/features/` — apply Tailwind classes

### Files Deleted

- `apps/frontend/src/index.css` (replaced by `globals.css` with Tailwind directives)
- `apps/frontend/src/App.css` (styles moved inline to components as Tailwind classes)

---

## Component Library

### Core UI Components (8 total)

1. **Button** (`src/components/ui/Button.tsx`)
   - Variants: `primary` (blue), `secondary` (gray), `danger` (red), `ghost` (transparent)
   - Sizes: `sm` (32px), `md` (40px), `lg` (48px)
   - States: default, hover, active, disabled, loading
   - Focus ring: `ring-2 ring-offset-2` on focus-visible

2. **Input** (`src/components/ui/Input.tsx`)
   - Types: text, email, password, number, url
   - States: default, focus, error, disabled
   - Error message display below input in red
   - Validation integration with React Hook Form

3. **Card** (`src/components/ui/Card.tsx`)
   - White background, subtle border, optional hover effect
   - Used for: repository cards, key info blocks, dashboard panels

4. **Badge/Tag** (`src/components/ui/Badge.tsx`)
   - Pill-shaped, colored background by type (success, warning, danger, info)
   - Used for: status indicators (Public/Private, Active/Inactive)

5. **Modal** (`src/components/ui/Modal.tsx`)
   - Overlay with centered dialog, close button (X), title, body, footer
   - Keyboard: ESC to close, Tab focus trap within modal

6. **Alert** (`src/components/ui/Alert.tsx`)
   - Variants: success, error, warning, info
   - Icon + message + optional dismiss button

7. **Link** (`src/components/ui/Link.tsx`)
   - Styled `<a>` tag with blue color, underline, dark mode support
   - Focus: ring-2 ring-offset-2

8. **FormGroup** (`src/components/ui/FormGroup.tsx`)
   - Wraps label + input + error message
   - Consistent spacing and layout

### Layout Components (2 total)

1. **AppShell** (`src/components/layout/AppShell.tsx`)
   - Root wrapper for all pages
   - Includes Navbar, main content area, optional footer
   - Manages dark mode context provider

2. **Navbar** (`src/components/layout/Navbar.tsx`)
   - 56px height, white (light) / gray-900 (dark) background
   - Logo/brand on left, nav links in center, user menu + theme toggle on right
   - Responsive: collapses to hamburger menu on mobile
   - Active route indicator (blue underline)

---

## Accessibility Requirements

### Contrast Compliance

- All text: 4.5:1 minimum (AA standard) or 7:1 (AAA enhanced)
- Interactive elements: 3:1 minimum
- Verified with WebAIM Contrast Checker or similar tool in each phase

### Focus Management

- All interactive elements (buttons, inputs, links) have visible focus rings
- Focus ring: 2px solid blue, 2px offset from element boundary
- Tab order: logical, follows DOM order, skip links for keyboard nav (stretch goal)
- No keyboard trap on modal close (ESC key support)

### Semantic HTML & ARIA

- Buttons use `<button>` tags, not `<div>` with click handlers
- Form inputs use `<label>` with `htmlFor` or wrap input
- Headings use semantic h1–h3 (no styled divs)
- ARIA labels for icon-only buttons: `aria-label="Copy to clipboard"`
- Role attributes for custom components: `role="alert"` for alerts, `role="dialog"` for modals

### Color Accessibility

- Never rely on color alone to convey information (use icons + color, e.g., error status)
- Support color-blind users: test with Coblis simulator or Daltonize

---

## Dark Mode Implementation

### Tailwind `dark:` Prefix Strategy

- All color-dependent classes use `dark:` variant: `bg-white dark:bg-gray-900`
- Borders: `border-gray-300 dark:border-gray-700`
- Text: `text-gray-900 dark:text-gray-100`
- Interactive: `hover:bg-blue-700 dark:hover:bg-blue-600`

### User Preference Persistence

- Hook: `useDarkMode()` manages `dark` class on `<html>` element
- Storage: localStorage key `theme-preference` with values `light`, `dark`, or `auto`
- On load: Check localStorage, fall back to `prefers-color-scheme`, default to `light`
- Toggle: Navbar button calls `toggleDarkMode()`, updates localStorage, applies class immediately

---

## Responsive Design

### Breakpoints (Tailwind Default)

| Breakpoint | Class Prefix | Size        |
| ---------- | ------------ | ----------- |
| Mobile     | (default)    | 320–639px   |
| Tablet     | `sm:`        | 640–1023px  |
| Desktop    | `md:`        | 1024–1535px |
| Large      | `lg:`        | 1536px+     |

### Mobile-First Approach

- Base styles for mobile (320px)
- `sm:` overrides for tablet and up
- `md:`/`lg:` overrides for desktop and up
- Forms: stack vertically on mobile, side-by-side on desktop
- Navigation: hamburger on mobile, horizontal on desktop
- Spacing: reduced on mobile (16px padding), normal on desktop (32px)

---

## Performance Considerations

### CSS Bundle

- **Tailwind PurgeCSS**: Automatically removes unused utility classes
- **Minification**: Post-processed via Vite build pipeline
- **Expected Size**: <50KB gzipped (vs. typical unstyled + custom CSS)

### Rendering

- No layout shift (CSS vars prevent FOUC)
- Font loading: system fonts only (no external requests)
- Transitions: GPU-accelerated where possible (`transform`, `opacity`)

---

## Quality Assurance

### Testing Strategy

- **Visual Regression**: Playwright snapshot tests for key pages (LandingPage, LoginPage, DashboardPage)
- **Accessibility**: Automated checks with `axe-core` or `jest-axe` in component tests
- **Contrast**: Verify 4.5:1 and 3:1 ratios programmatically in CI
- **Responsive**: Manual testing on mobile (375px), tablet (768px), desktop (1280px)
- **Dark Mode**: Toggle test in each page's E2E suite

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers: iOS Safari 14+, Chrome Mobile 90+

---

## Rollback Plan

If Tailwind CSS causes issues:

1. Revert `tailwind.config.ts`, `postcss.config.js`, `globals.css` deletions
2. Restore `src/index.css` and `src/App.css` from git history
3. Remove Tailwind classes from components (revert `git diff HEAD apps/frontend/src/`)
4. Remove Tailwind from `package.json`
5. Rebuild frontend

---

## Reference Images (Conceptual)

### Light Mode Navbar

```
[ Logo ] [ Home ] [ Docs ] ... [ User Menu ] [ 🌙 Dark Mode ]
```

### Dark Mode Navbar

```
[ Logo ] [ Home ] [ Docs ] ... [ User Menu ] [ ☀️ Light Mode ]
```

### Button Variants

```
Primary (Blue)  | Secondary (Gray) | Danger (Red) | Ghost (Transparent)
Hover: darker   | Hover: darker    | Hover: darker| Hover: bg-gray-100
Focus: ring     | Focus: ring      | Focus: ring  | Focus: ring
```

### Form Layout (Mobile → Desktop)

```
Mobile (stacked):        Desktop (inline):
[ Label ]                [ Label ]  [ Label ]
[ Input ]                [ Input ]  [ Input ]
[ Error ]

[ Label ]
[ Input ]
[ Error ]

[ Submit Btn ]           [ Cancel ] [ Submit Btn ]
```

---

## Constraints & Assumptions

1. **No Breaking Changes to React**: Component logic remains unchanged; only styling added
2. **No External API Changes**: Backend API responses unchanged
3. **No Component Refactoring**: Existing pages/features structure preserved
4. **Minimal Dependencies**: Only Tailwind CSS added to dev dependencies; no UI component library
5. **TypeScript Strict Mode**: All new components maintain `strict: true` compliance
6. **Accessibility by Default**: All new components built with WCAG AA in mind
