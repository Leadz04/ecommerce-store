Product comparison feature has been fully removed from the codebase.

Removed items:
- `/compare` page and all UI logic
- `comparisonStore` (Zustand store) and all usages
- Comparison buttons/icons from header, product cards, and product detail pages
- Testing and documentation references that instructed QA to test comparison flows

If you need to re-introduce product comparison in the future, consider:
- Implementing it behind a feature flag
- Adding proper analytics tracking before rolling out
- Keeping store and routing isolated in a dedicated feature module


