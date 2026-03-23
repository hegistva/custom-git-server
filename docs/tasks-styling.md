# Tasks: Professional Frontend Styling with Tailwind CSS

Reference design: [design-styling.md](design-styling.md)

Progress update:

- `Phase 0` implementation is mostly complete; one cleanup item and some manual verification remain.
- `Phase 1` component scaffolding is complete; deeper validation and accessibility review remain.
- `Phase 2` layout scaffolding is complete; runtime/manual UX verification remains.

---

## Phase 0 — Tailwind Setup & Configuration

### Installation & Configuration

- [x] Add Tailwind CSS, PostCSS, and Autoprefixer to `apps/frontend/package.json` via `pnpm add -D tailwindcss postcss autoprefixer`
- [x] Create `apps/frontend/tailwind.config.ts` with:
  - Blue-based color palette (primary #0066CC, grays, semantic colors)
  - Dark mode strategy: `class` (manual toggle + persisted preference)
  - Custom spacing, typography, and component utilities
  - Focus ring customization (2px offset)
- [x] Create `apps/frontend/postcss.config.js` with Tailwind and Autoprefixer plugins
- [x] Verify Vite CSS bundling in `apps/frontend/vite.config.ts` (no changes needed)
- [x] Create `apps/frontend/src/globals.css` with Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [x] Update `apps/frontend/src/main.tsx` to import `globals.css` before App
- [ ] Delete or archive `apps/frontend/src/index.css` and `apps/frontend/src/App.css`

### Dark Mode Hook

- [x] Create `apps/frontend/src/hooks/useDarkMode.ts`:
  - Manages `dark` class on `<html>` element
  - Reads localStorage key `theme-preference` on mount
  - Falls back to `prefers-color-scheme` media query
  - Provides `isDarkMode` state and `toggleDarkMode()` function
  - Persists preference to localStorage on change
- [ ] Verify hook works: toggle dark mode in dev tools, check localStorage, refresh page (preference persists)

### Verification

- [x] Run `pnpm run dev` in `apps/frontend/` and verify no CSS errors
- [ ] Inspect browser: check that Tailwind utilities are applied (search for `class="p-4 bg-white"` etc.)
- [ ] Verify dark mode hook: toggle theme in console, observe `<html class="dark">` change
- [ ] No console errors or warnings

**Status**: Phase 0 complete when Tailwind builds, utilities are available, and dark mode hook works.

---

## Phase 1 — Core UI Components (UI Library)

Build 8 reusable, styled UI components in `apps/frontend/src/components/ui/`.

### Button Component

- [x] Create `apps/frontend/src/components/ui/Button.tsx`:
  - Props: `variant` ('primary' | 'secondary' | 'danger' | 'ghost'), `size` ('sm' | 'md' | 'lg'), `disabled`, `loading`, `children`, `onClick`, `className`
  - Tailwind classes for each variant:
    - Primary: `bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white`
    - Secondary: `bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900`
    - Danger: `bg-red-600 hover:bg-red-700 active:bg-red-800 text-white`
    - Ghost: `bg-transparent hover:bg-gray-100 text-gray-900`
  - All variants: `focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50`
  - Sizes: sm=32px, md=40px, lg=48px (using padding/height utilities)
  - Loading state: disable interaction, show loading spinner (or opacity change)
  - Type-safe: `React.ButtonHTMLAttributes<HTMLButtonElement>` extension
- [ ] Test: Render all variants (primary, secondary, danger, ghost) and sizes in dev environment
- [ ] Verify: Focus ring visible on Tab, hover/active states apply, loading state disables button

### Input Component

- [x] Create `apps/frontend/src/components/ui/Input.tsx`:
  - Props: `type` (text | email | password | number | url), `label?`, `error?`, `disabled`, `placeholder`, `value`, `onChange`, `className`
  - Base styles: `border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300`
  - Error state: border-red-500, `aria-invalid="true"`, error text in red below input
  - Dark mode: `dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500`
  - Accessibility: `aria-label` when no label prop, focus visible ring
  - Type-safe: `React.InputHTMLAttributes<HTMLInputElement>` extension
- [ ] Test: Type text, verify focus ring, trigger error state (pass `error` prop), check dark mode
- [ ] Verify: Focus ring visible, error text in red, disabled state (cursor not-allowed)

### FormGroup Component

- [x] Create `apps/frontend/src/components/ui/FormGroup.tsx`:
  - Props: `label`, `error?`, `required?`, `children` (usually Input)
  - Layout: `<div>` → `<label>` + `<div>` (children) + `<p>` (error in red)
  - Spacing: `gap-2` between label and input, `mt-1` before error text
  - Label: bold, 14px, gray-700 (dark: gray-200)
  - Error: red-600, 12px, `role="alert"`
- [ ] Test: Wrap Input in FormGroup with label and error, verify layout and error color
- [ ] Verify: Label associates with input (if id/htmlFor used), error displays in red

### Card Component

- [x] Create `apps/frontend/src/components/ui/Card.tsx`:
  - Props: `children`, `className`, `interactive?` (adds hover effect)
  - Base: `bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6`
  - Interactive: `hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer`
  - Non-interactive: subtle shadow (optional)
- [ ] Test: Render card with text content, verify white background (light) / dark background (dark), hover effect on interactive variant
- [ ] Verify: Rounded corners, consistent padding, shadow on hover (interactive)

### Badge Component

- [x] Create `apps/frontend/src/components/ui/Badge.tsx`:
  - Props: `variant` ('success' | 'warning' | 'danger' | 'info'), `children`, `className`
  - Base: `inline-block rounded-full px-3 py-1 text-sm font-medium`
  - Variants:
    - Success: `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`
    - Warning: `bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100`
    - Danger: `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`
    - Info: `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`
- [ ] Test: Render each variant, verify pill shape, text color contrast
- [ ] Verify: Contrast ratio 4.5:1 for text on badge background (light and dark modes)

### Modal Component

- [x] Create `apps/frontend/src/components/ui/Modal.tsx`:
  - Props: `isOpen`, `onClose`, `title`, `children`, `footer?` (optional footer with buttons)
  - Structure: overlay (fixed, full-screen, semi-transparent) + centered dialog box
  - Overlay: `fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center`
  - Dialog: `bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4` (responsive)
  - Header: title + close button (X icon), padding 24px
  - Body: padding 24px (scrollable if content large)
  - Footer: right-aligned buttons, padding 24px, border-top
  - Close button: `aria-label="Close"`, click/ESC key closes modal
  - Focus trap: Tab key stays within modal (stretch goal)
- [ ] Test: Open/close modal, verify overlay and dialog visibility, close on X click and ESC key
- [ ] Verify: Dialog centered, close button works, footer buttons render

### Alert Component

- [x] Create `apps/frontend/src/components/ui/Alert.tsx`:
  - Props: `variant` ('success' | 'error' | 'warning' | 'info'), `title?`, `message`, `onClose?`, `children`
  - Base: `p-4 rounded-lg border-l-4 flex items-start gap-3`
  - Variants (left border color + background):
    - Success: `border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200`
    - Error: `border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200`
    - Warning: `border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200`
    - Info: `border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200`
  - Icon: 24x24, colored to match variant
  - Close button: optional, right side, `aria-label="Dismiss"`
  - Accessibility: `role="alert"` for dynamic alerts
- [ ] Test: Render each variant with icon and close button, verify border color and background
- [ ] Verify: Icon visible, text readable, close button dismisses alert

### Link Component

- [x] Create `apps/frontend/src/components/ui/Link.tsx`:
  - Wrapper around React Router's `<Link>` or HTML `<a>`
  - Props: `to` (if router link) or `href`, `children`, `className`, `external?` (adds target="\_blank" rel="noopener noreferrer")
  - Base: `text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:outline-none`
  - External links: `target="_blank" rel="noopener noreferrer"`
- [ ] Test: Render link, verify blue color and underline on hover, check focus ring and external link behavior
- [ ] Verify: Contrast ratio 4.5:1, dark mode text lighter, focus ring visible

### Verification

- [x] All 8 components render without errors: `pnpm run dev`
- [ ] Each component has props properly typed (no `any`)
- [ ] All components work in both light and dark modes (toggle with `useDarkMode()` in dev)
- [ ] Focus rings visible on all interactive components (Tab through each)
- [ ] Contrast ratios meet 4.5:1 (text) and 3:1 (interactive) standards

**Status**: Phase 1 complete when all 8 components render, are properly typed, and support dark mode with visible focus rings.

---

## Phase 2 — Layout Components

Build 2 foundational layout components that wrap pages.

### AppShell Component

- [x] Create `apps/frontend/src/components/layout/AppShell.tsx`:
  - Wraps entire app, includes Navbar, main content area, optional footer
  - Imports and uses `useDarkMode` hook to provide dark mode context
  - Structure: `<div>` → `<Navbar />` + `<main>` (children) + optional `<footer>`
  - Main content: `min-h-screen bg-white dark:bg-gray-900`
  - Ensures dark class on `<html>` element (via hook)
- [x] Update routing composition to wrap app routes inside `<AppShell>`
  - Implemented in `apps/frontend/src/pages/routes.tsx`
- [ ] Verify: Background color changes when dark mode toggled, AppShell renders without errors

### Navbar Component

- [x] Create `apps/frontend/src/components/layout/Navbar.tsx`:
  - Header: 56px height, white background (light) / dark background (dark)
  - Structure: flex row, `items-center justify-between`, padding 16px 32px
  - Left side: Logo/brand (text or SVG), 24px height
  - Center: Horizontal nav links (Home, Docs, etc.) with underline on active route
  - Right side: User menu dropdown + dark mode toggle button
  - responsive: Hamburger menu on mobile (< 640px breakpoint)
  - Dark mode toggle: Sun/Moon icon button, calls `toggleDarkMode()`
  - Active route: underline in blue (#0066CC), other routes: gray text
  - Border bottom: 1px solid #E0E0E0 (light) / #333333 (dark)
- [x] Use React Router's `useLocation()` to determine active route
- [x] Mobile menu: Hamburger icon, click toggles menu visibility, links stack vertically
- [ ] Test: Verify navbar spans full width, active link underlined, dark mode toggle works, hamburger appears on mobile (DevTools)
- [ ] Verify: Logo and nav links aligned correctly, user menu clickable, theme toggle updates page

### Verification

- [x] AppShell wraps Routes
- [x] Navbar renders with logo, nav links, and theme toggle
- [x] Active route underlined in blue, hover state on links
- [ ] Dark mode toggle button updates theme and persists
- [ ] Mobile hamburger menu appears on small screens, collapses/expands menu

**Status**: Phase 2 complete when AppShell and Navbar render, dark mode context available, responsive menu works.

---

## Phase 3 — Page & Feature Component Styling

Restyle all page-level and feature components using new UI components and Tailwind utilities.

### Landing Page

- [ ] Update `apps/frontend/src/pages/LandingPage.tsx`:
  - Hero section: Large heading ("Git Platform"), centered, 48px font, blue accent color
  - Value proposition: 3 columns of cards (using `<Card>` component) with feature descriptions
  - Call-to-action: 2 buttons ("Get Started", "Learn More"), using `<Button>` component
  - Footer: Links, copyright, using `<Link>` component
  - Spacing: 64px between sections, 32px padding on desktop, 16px on mobile
  - Responsive: Hero text smaller on mobile, cards stack vertically on tablet/mobile
- [ ] Verify: Hero heading visible and centered, cards render, CTA buttons clickable

### Login & Register Pages

- [ ] Update `apps/frontend/src/pages/LoginPage.tsx` and `RegisterPage.tsx`:
  - Centered card (max-width 400px) on white background (light) / dark background (dark)
  - Form layout: `<FormGroup>` wrapper for each field (email, password, username)
  - Inputs: Use `<Input>` component with validation error states
  - Submit button: `<Button variant="primary" size="lg" className="w-full">`
  - Link to alternate page (login ↔ register): Use `<Link>` component
  - Spacing: 16px gap between form fields, 24px padding on card
  - Error messages: Display below input in red (using `<Alert>` for server errors)
- [ ] Verify: Form fields stack vertically, submit button full-width, error messages display

### Dashboard Page

- [ ] Update `apps/frontend/src/pages/DashboardPage.tsx`:
  - Page heading: "Dashboard", 32px, blue color
  - Intro text: "Manage your repositories, SSH keys, and tokens"
  - Cards grid: 3 columns on desktop, 1 on mobile
    - Card 1: "Repositories" with count and "Create New" button
    - Card 2: "SSH Keys" with count and "Add Key" button
    - Card 3: "Tokens" with count and "Generate Token" button
  - Each card uses `<Card>` component with `interactive={true}` on hover
  - Buttons: `<Button>` component
  - Spacing: 32px between cards, 64px top margin
- [ ] Verify: Cards render in grid, buttons clickable, hover effects visible

### Repository Page

- [ ] Update `apps/frontend/src/pages/RepositoryPage.tsx`:
  - Header section: repository name (24px, bold), description, visibility badge (using `<Badge>`)
  - Meta info: Created date, owner, clone URLs
  - Action buttons: Clone, Settings, Delete (using `<Button>` with `variant="secondary"` for non-primary actions)
  - Tab interface (if implemented): Tabs for Readme, Files, Settings
  - Spacing: 24px between header and content, 16px between action buttons
  - Error/success alerts: Use `<Alert>` component
- [ ] Verify: Header text readable, badges display correctly, buttons functional

### SSH Keys & Tokens Pages

- [ ] Update `apps/frontend/src/pages/SshKeysPage.tsx` and `TokensPage.tsx`:
  - Page heading with "Add New" button (using `<Button>`)
  - Table or list view of keys/tokens:
    - Columns: Name, Created, Expires, Actions (Edit, Copy, Delete)
    - Rows: Use `<Card>` for each row or standard table `<tr>` with Tailwind styling
  - Action buttons: Small, `variant="secondary"` or `ghost`
  - Status badges (Active/Inactive, Expired): Use `<Badge>`
  - Empty state: Message with link to create first key/token
  - Spacing: 24px between rows, consistent column alignment
- [ ] Verify: Table/list renders, action buttons clickable, status badges visible

### New Repository Page

- [ ] Update `apps/frontend/src/pages/NewRepositoryPage.tsx`:
  - Heading: "Create New Repository"
  - Form: Use `<FormGroup>` and `<Input>` for name, description, visibility (radio or select)
  - Buttons: Submit ("Create"), Cancel ("Back"), using `<Button>`
  - Validation: Display error messages below fields (from React Hook Form + Zod)
  - Spacing: 16px gap between fields, 16px between form groups
  - Responsive: Form max-width 600px on desktop, full-width on mobile with padding
- [ ] Verify: Form fields stack, validation errors display, submit/cancel buttons work

### Feature Components (7 total)

- [ ] Update `apps/frontend/src/features/repositories/`:
  - `RepositoryList.tsx`: Grid of repository cards, use `<Card>` + `<Badge>` for visibility, hover effect to show "View" button
  - `RepositoryDetail.tsx`: Display repo details, action buttons
  - `CreateRepositoryForm.tsx`: Form with `<FormGroup>`, `<Input>`, validation errors, submit button

- [ ] Update `apps/frontend/src/features/ssh-keys/`:
  - `SshKeyList.tsx`: List of SSH keys with copy, edit, delete actions
  - `AddSshKeyForm.tsx`: Form to paste SSH public key, submit/cancel buttons

- [ ] Update `apps/frontend/src/features/tokens/`:
  - `TokensList.tsx`: List of tokens with expiry status, copy, revoke actions
  - `GenerateTokenForm.tsx`: Form to set token expiration, submit button

### Verification

- [ ] All pages and features load without errors: `pnpm run dev`
- [ ] Page layouts responsive: mobile (375px), tablet (768px), desktop (1280px) in DevTools
- [ ] Forms display validation errors in red
- [ ] Buttons clickable, links navigate correctly
- [ ] Cards and badges render with correct colors
- [ ] Alerts display on success/error actions

**Status**: Phase 3 complete when all 8 pages and 7 feature components are styled, responsive, and functional.

---

## Phase 4 — Dark Mode & Accessibility Audits

Finalize dark mode, verify accessibility compliance, and conduct final QA.

### Dark Mode Verification

- [ ] Toggle dark mode on all 8 pages: navbar, buttons, inputs, cards, alerts render correctly in dark mode
- [ ] Verify `dark:` prefixes applied to all color-dependent classes (backgrounds, text, borders)
- [ ] Check contrast ratios in dark mode:
  - Text on dark background: #E8E8E8 on #1A1A1A = 18:1 ✓
  - Links on dark background: #0066CC on #1A1A1A = 4.5:1 ✓
- [ ] Theme persistence: Toggle theme, refresh page, verify preference persists
- [ ] System preference: Verify `prefers-color-scheme` media query respected on first load (browser DevTools → Rendering → Emulate CSS media feature prefers-color-scheme)

### Accessibility Audits

- [ ] **Contrast Verification**:
  - Use WebAIM Contrast Checker or Lighthouse DevTools audit on all pages
  - Verify text/background contrast ≥ 4.5:1 (AA standard)
  - Verify interactive elements ≥ 3:1 contrast
  - Flag any violations and fix (e.g., adjust color palette)

- [ ] **Focus Management**:
  - Tab through every interactive element (buttons, inputs, links) on all pages
  - Verify visible focus ring (2px offset) on each
  - Check Tab order is logical (follows DOM order, no backwards navigation)

- [ ] **Keyboard Navigation**:
  - Navigate entire app using only keyboard (Tab, Shift+Tab, Enter, Space, ESC)
  - All functionality accessible without mouse
  - Modal dialogs: Tab stays within modal, ESC closes

- [ ] **ARIA & Semantic HTML**:
  - Verify form inputs have associated labels (via `<label htmlFor>` or FormGroup component)
  - Check buttons use `<button>` tag, not `<div>`
  - Icon-only buttons have `aria-label` (e.g., close button, theme toggle)
  - Alerts use `role="alert"` for screen reader announcement
  - Modals use `role="dialog"` and focus management

- [ ] **Color Blindness**:
  - Test with Coblis color blindness simulator (deuteranopia, protanopia, tritanopia modes)
  - Verify status indicators use icon + color (not color alone)
  - Example: error state = red icon + text label "Error" (not just red background)

### Responsive Design Testing

- [ ] **Mobile (375px)**: All pages functional, text readable (no horizontal scroll), forms stack vertically
- [ ] **Tablet (768px)**: Layout transitions to 2-column where appropriate, hamburger menu works
- [ ] **Desktop (1280px)**: Full 3-column layouts, all typography scales applied
- [ ] **Touch Interactions** (mobile DevTools emulation):
  - Buttons at least 44×44px (touch target size)
  - Clickable areas not compressed or difficult to tap

### Performance & Bundle Size

- [ ] Run `pnpm run build` and check final CSS bundle size:
  - Expected: <50KB gzipped (vs. typical CSS frameworks)
  - Tailwind autopurges unused utilities
- [ ] Lighthouse audit:
  - Performance: >90
  - Accessibility: ≥90
  - Best Practices: ≥90
  - SEO: >90

### Browser Compatibility

- [ ] Test on:
  - Chrome 90+ (latest)
  - Firefox 88+ (latest)
  - Safari 14+ (latest on macOS)
  - Edge 90+ (latest)
  - Mobile: iOS Safari 14+, Chrome Mobile 90+
- [ ] Verify Tailwind utilities render correctly on all browsers (no fallbacks needed for PostCSS)

### Final QA Checklist

- [ ] All pages load without console errors or warnings
- [ ] Dark mode toggle works on every page and persists
- [ ] All form validations display error messages correctly
- [ ] All buttons navigate/submit as expected
- [ ] All links (internal and external) work correctly
- [ ] Hover, focus, and active states visible on all interactive elements
- [ ] Cards, badges, alerts render with correct colors (light & dark)
- [ ] Alerts display success/error messages appropriately
- [ ] Mobile hamburger menu collapses/expands correctly
- [ ] Responsive layout verified on 3 breakpoints (mobile, tablet, desktop)
- [ ] Lighthouse accessibility score ≥90
- [ ] No contrast ratio violations
- [ ] All keyboard navigation functional

### Verification

- [ ] Lighthouse accessibility score ≥90 on all pages
- [ ] WebAIM contrast checker passes on all text and interactive elements
- [ ] Keyboard navigation works on all pages (Tab through, ESC closes modals)
- [ ] Dark mode toggle and persistence functional
- [ ] Responsive layout tested on 3 devices
- [ ] Browser compatibility verified on Chrome, Firefox, Safari, Edge

**Status**: Phase 4 complete when Lighthouse accessibility ≥90, all contrast ratios verified, dark mode functional, and all keyboard/responsive tests pass.

---

## Final Verification

After all phases complete:

- [ ] Update `.env.example` if new environment variables added (none expected for styling phase)
- [ ] Run full stack tests: `pnpm test` and `pnpm run test:e2e` pass without failures
- [ ] Verify no merge conflicts or broken dependencies: `pnpm install && pnpm run build`
- [ ] Review git diff for unexpected changes (e.g., deleted original CSS files properly removed)
- [ ] Commit with message: "chore(frontend): add Tailwind CSS styling, dark mode, and UI component library"

---

## Estimated Effort by Phase

| Phase     | Task                             | Effort | Hours    |
| --------- | -------------------------------- | ------ | -------- |
| 0         | Tailwind setup & config          | L      | 1–2      |
| 1         | 8 UI components                  | M–L    | 3–4      |
| 2         | AppShell & Navbar                | M      | 2–3      |
| 3         | Page & feature styling           | L      | 2–3      |
| 4         | Dark mode & accessibility audits | M      | 1–2      |
| **Total** | **Full styling implementation**  | **L**  | **9–14** |

---

## Rollback Procedure

If critical issues arise during implementation:

1. Revert Tailwind files:

   ```bash
   git checkout -- apps/frontend/tailwind.config.ts apps/frontend/postcss.config.js
   ```

2. Restore original CSS:

   ```bash
   git checkout -- apps/frontend/src/index.css apps/frontend/src/App.css
   ```

3. Remove Tailwind from component files:

   ```bash
   git checkout -- apps/frontend/src/pages/ apps/frontend/src/features/ apps/frontend/src/components/
   ```

4. Remove Tailwind dependencies:

   ```bash
   pnpm remove tailwindcss postcss autoprefixer
   ```

5. Rebuild and verify:
   ```bash
   pnpm install
   pnpm run dev
   ```
