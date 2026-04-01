# Writers Block - UI/UX Audit Summary

**Document status:** refreshed March 31, 2026  
**Purpose:** point-in-time design and product audit  
**Scope:** UX findings, product priorities, and implementation notes that are still useful after the March 2026 platform updates

## Summary

This file is intentionally kept as an audit artifact rather than a live implementation spec. The README and `.env.example` should be treated as the source of truth for setup and architecture. This report captures the current UX direction, the improvements already shipped, and the highest-value product gaps that remain.

## Confirmed Strengths

- The cinematic visual language is consistent across the public site and the app.
- Pricing and upgrade messaging are clearer than earlier revisions.
- The editor workflow feels more production-oriented with streaming output, references, and export actions.
- Loading states and motion handling are materially better than the earlier baseline.
- Accessibility has improved through reduced-motion support, focus visibility, and stronger structure on interactive elements.

## Shipped Improvements

### Visual and Brand

- Pricing cards now communicate hierarchy more clearly.
- CTA sections use stronger visual emphasis without overwhelming the page.
- Footer and section spacing are more consistent with the rest of the site.

### Editor UX

- Reference scenes are easier to consume with thumbnail-based presentation.
- Core actions are available in the editor toolbar.
- Screenplay content supports PDF export and email delivery.
- The overall layout better supports longer writing sessions.

### Accessibility and Motion

- Reduced-motion preferences are respected in more flows.
- Focus states are visible enough for keyboard users.
- Touch targets and interactive affordances are more consistent.

### Performance UX

- Skeleton states reduce perceived latency in dashboard areas.
- Motion and animation choices are less likely to create jank on lower-end devices.
- API and UI feedback patterns are more consistent than before.

## Remaining Product Risks

### Mobile Editor Ergonomics

The editor is still the biggest UX risk on smaller screens. The current information density makes navigation and comparison harder than on desktop.

Recommended follow-up:

- Use tabbed or segmented navigation for setup, editor, and references.
- Default non-primary panels to collapsed on mobile.
- Keep primary writing actions fixed and easy to reach.

### Onboarding and First-Time Value

The app has strong features, but first-time users still need faster guidance from signup to first successful screenplay.

Recommended follow-up:

- Add a guided first-project flow.
- Add clearer empty states for projects and subscription surfaces.
- Highlight example prompts or starter templates.

### Conversion Opportunities

The pricing experience is improved, but there is still room to make plan value clearer for serious writers and teams.

Recommended follow-up:

- Clarify which features are free, Pro, and Premium in more product surfaces.
- Add stronger proof around outcomes, not just features.
- Test stronger upgrade prompts at moments of genuine user intent.

## Current UX Priorities

| Priority | Area | Why it matters |
|----------|------|----------------|
| P0 | Mobile editor flow | Largest usability gap in the core product |
| P0 | First-project onboarding | Improves activation and reduces drop-off |
| P1 | Pricing-to-checkout continuity | Helps users understand upgrade value |
| P1 | Editor recovery and autosave feedback | Increases trust during longer writing sessions |
| P2 | Advanced productivity tools | Useful after core usability issues are addressed |

## Notes For Future Audits

- Treat this report as a product lens, not as a code map.
- Re-audit after any major editor mobile redesign.
- Re-audit after onboarding or pricing changes, since those affect activation and conversion more than cosmetic tweaks.

## Related Docs

- `README.md` for architecture, setup, and current features
- `.env.example` for environment variable guidance
- `CLAUDE.md` for maintainer and agent workflow guidance
