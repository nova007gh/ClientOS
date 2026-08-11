---
name: ClientOS Alpha
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#8083ff'
  on-tertiary-container: '#0d0096'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  lead-score:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  card-gap: 12px
  sidebar-width: 240px
---

## Brand & Style
The design system embodies "Premium Professional" for high-velocity sales and intelligence. It draws heavily from **Minimalism** and **Modern Corporate** styles, focusing on high information density without sacrificing visual breathing room. 

The aesthetic is defined by precision: razor-sharp alignment, subtle micro-interactions, and a sophisticated use of depth. It targets power users who require a tool that feels like a high-performance instrument—intelligent, trustworthy, and capable of processing complex lead data with absolute clarity.

## Colors
This design system defaults to a sophisticated **dark mode**. The palette utilizes deep charcoals and rich blacks to create a focused environment. 

- **Primary (Action Blue):** Used for primary conversion paths, CTA buttons, and active navigation states.
- **Secondary (Success Green):** Reserved for "Won" statuses, positive lead score indicators, and growth metrics.
- **Surface Strategy:** Use a tiered elevation model. The background is the darkest layer (`#020617`). Sidebars are slightly elevated (`#090E1A`). Cards use `#111827`, and elements nested within cards use `#1F2937` to create a logical hierarchy of information.
- **Status Badges:** Use the defined status tokens with a 10% opacity background of the same color for a "tinted" effect, paired with full-saturation text for legibility.

## Typography
The system uses **Inter** for its neutral, highly legible character, essential for data-dense SaaS environments. **JetBrains Mono** is introduced sparingly for labels and metadata to provide a technical, precise "instrumental" feel.

- **Weight Usage:** Use `600` (Semi-bold) for section headers and `400` (Regular) for all long-form data.
- **Data Tables:** Use `body-sm` for table cells to maximize information density.
- **Lead Scores:** Always use the `lead-score` token to ensure the numerical value is bold and distinct within badges or circular indicators.

## Layout & Spacing
The layout follows a **fluid grid** model with fixed sidebar constraints. 

- **Grid:** A 12-column system is used for the main content area.
- **Rhythm:** All spacing is derived from a 4px base unit. 
- **Margins:** Desktop views use 24px outer margins. On mobile, margins shrink to 16px.
- **Density:** The system prioritizes "Compact" spacing for data tables (8px vertical padding) and "Comfortable" spacing for settings and profile pages (16px+ vertical padding).

## Elevation & Depth
Elevation is communicated through **Tonal Layers** rather than heavy shadows. This creates a modern, flat-depth look similar to high-end developer tools.

- **Level 0 (Base):** Background color.
- **Level 1 (Navigation/Sidebar):** 1px right-border or left-border using `border-subtle`. No shadow.
- **Level 2 (Cards):** 1px solid border using `border-subtle`. On hover, apply a very soft, diffused shadow: `0 8px 30px rgba(0,0,0,0.4)`.
- **Level 3 (Modals/Popovers):** 1px solid border using `border-strong` and a backdrop blur of 12px for a subtle glass effect.

## Shapes
The shape language is **Soft** (0.25rem / 4px). This minimal rounding maintains a professional, rigorous feel while avoiding the harshness of 0px corners.

- **Standard Elements:** Inputs, buttons, and small cards use `rounded` (4px).
- **Large Containers:** Main dashboard widgets use `rounded-lg` (8px).
- **Lead Score Badges:** Use `rounded-xl` (12px) or full circles to differentiate "score" data from "status" data.

## Components
- **Buttons:** Primary buttons use `primary_color_hex` with white text. Secondary buttons use a transparent background with a `border-subtle`.
- **Lead Score Indicators:** Represented as a 40px circular progress ring. The ring color transitions from `status-new` (low score) to `primary` (mid) to `secondary` (high score).
- **Status Badges:** Rectangular with `rounded` corners. Text is `label-caps`. 
- **Data Tables:** Headers use `label-caps` with a subtle bottom border. Rows have a subtle hover state (`#1F2937`) and no vertical borders between columns.
- **Inputs:** Dark background (`#020617`), 1px border. On focus, the border changes to `primary_color_hex` with a subtle 2px outer glow.
- **Cards:** Use `card` surface token. Nested sections within cards (e.g., Lead Activity) should use the `card-nested` surface to create visual containment.