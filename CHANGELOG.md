# zod-request

## 1.0.1

### Patch Changes

- b852e8c: Widened Zod peer dependency range to fully support both Zod v3 and v4 simultaneously, utilizing backward-compatible object passthrough configuration in tests.

## 1.0.0

### Major Changes

- dca900a: **Test framework**: Migrated from Mocha + Chai to Vitest
- dca900a: **Node.js**: Updated minimum version, upgraded to Node 24 in CI
- dca900a: **Release workflow**: Switched from tag-based to branch-based releases using changesets
- dca900a: **Build config**: Simplified TypeScript config by extending @shahrad/tsconfig

### Minor Changes

- dca900a: Improved README with better examples, badges, and organized documentation
- dca900a: Enhanced ZodResponse class to extend native Response instead of composing it
- dca900a: Updated dependencies: Zod (3.23.6 → 4.4.3), various dev dependencies
- dca900a: Added .npmrc with hoisting flags for better dependency resolution
- dca900a: Added override keywords for TypeScript 5.9+ strict compliance

### Patch Changes

- dca900a: Removed .mocharc.json configuration
- dca900a: Removed Mocha setup files and updated test organization
- dca900a: Fixed Content-Type header detection to use Headers API properly
- dca900a: Fixed form data and search params type handling
- dca900a: Updated copyright year to 2026
