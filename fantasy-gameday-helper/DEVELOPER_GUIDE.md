# Developer Guide

## Testing Commands

**IMPORTANT**: This project uses Vitest for testing. The npm scripts are already configured with the correct flags.

### Testing Commands

```bash
# Run tests in watch mode (default - good for development)
npm test

# Run tests once and exit (good for CI/build scripts)
npm run test:run

# Run specific test file in watch mode
npm test PlayerTable

# Run specific test file once
npm run test:run PlayerTable

# Run tests with additional flags
npm test -- --grep "sorts players"
npm run test:run -- --grep "sorts players"
```

### Script Configuration

The `package.json` defines:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest --run",
    "test:watch": "vitest"
  }
}
```

This approach is more intuitive:
- `npm test` = watch mode (good for development)
- `npm run test:run` = single run (good for CI/validation)

### Other Useful Commands

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Build project
npm run build

# Start development server
npm run dev

# Preview production build
npm run preview
```

### Testing Best Practices

1. **Always use npm scripts** instead of direct vitest commands
2. **Run tests before committing** to ensure code quality
3. **Use descriptive test names** that explain what is being tested
4. **Test both happy path and edge cases**
5. **Keep tests focused and isolated**

### Property-Based Testing

This project uses `fast-check` for property-based testing. When writing property tests:

```typescript
import fc from 'fast-check';

it('Property: description of what should always be true', () => {
  fc.assert(fc.property(
    fc.string(), // generator
    (input) => {
      // Test implementation
      const result = functionUnderTest(input);
      return result.someProperty === expectedValue;
    }
  ), { numRuns: 100 });
});
```

### File Structure

```
src/
├── components/
│   ├── forms/           # Form components
│   ├── tables/          # Table components  
│   └── ui/              # UI components
├── context/             # React context providers
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Component Patterns

- Each component should have its own directory with:
  - `Component.tsx` - Main component file
  - `Component.css` - Component styles
  - `Component.test.tsx` - Unit tests
  - `Component.example.tsx` - Usage examples (optional)
  - `index.ts` - Export file

### Styling Guidelines

- Use CSS modules or component-scoped CSS files
- Follow mobile-first responsive design
- Include accessibility features (ARIA attributes, keyboard navigation)
- Use consistent spacing and color schemes
- Support high contrast and reduced motion preferences

### Accessibility Requirements

- Include proper ARIA attributes
- Support keyboard navigation
- Provide focus indicators
- Use semantic HTML elements
- Test with screen readers when possible