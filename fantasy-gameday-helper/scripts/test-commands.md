# Quick Test Command Reference

## Testing Commands

```bash
# Run tests in watch mode (default)
npm test

# Run tests once and exit
npm run test:run

# Run specific test file
npm test PlayerTable
npm run test:run PlayerTable

# Run tests with additional flags
npm test -- --grep "sorting"
npm run test:run -- --grep "sorting"
```

## When to Use Which

- **`npm test`** - Use during development (watch mode, reruns on file changes)
- **`npm run test:run`** - Use for validation/CI (runs once and exits)

## Other Useful Commands

```bash
npm run lint         # Check code quality
npm run build        # Build project
npm run dev          # Start dev server
```