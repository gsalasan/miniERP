# Development Configuration

This document describes the development setup and configuration for the miniERP project.

## Project Structure

The project is organized as a monorepo with the following structure:

```
miniERP/
├── frontend/
│   ├── apps/                    # Frontend applications
│   │   ├── main-frontend/       # Main portal application
│   │   ├── crm-frontend/        # CRM module
│   │   ├── hr-frontend/         # HR module
│   │   └── ...                  # Other modules
│   └── shared/                  # Shared packages
│       ├── eslint-config/       # Shared ESLint configuration
│       ├── prettier-config/     # Shared Prettier configuration
│       └── typescript-config/   # Shared TypeScript configuration
├── services/                    # Backend services
│   ├── identity-service/        # Authentication service
│   ├── crm-service/            # CRM backend
│   └── ...                     # Other services
└── prisma/                     # Database schema and migrations
```

## Development Tools Configuration

### ESLint

ESLint is configured with TypeScript support and Prettier integration:

- **Root configuration**: `.eslintrc.js` - Base configuration for the entire project
- **Frontend apps**: Use `@minierp/eslint-config/react` for React-specific rules
- **Backend services**: Use base configuration with Node.js environment

#### Key Rules:
- TypeScript strict mode enabled
- Prettier integration for code formatting
- React-specific rules for frontend apps
- Node.js environment for backend services
- Unused variables warning (ignoring `_` prefixed variables)

### Prettier

Prettier is configured for consistent code formatting:

- **Configuration**: `.prettierrc` and `.prettierignore`
- **Shared config**: `@minierp/prettier-config` package
- **Settings**:
  - Single quotes
  - Semicolons
  - 2-space indentation
  - 80 character line width
  - Trailing commas (ES5)

### TypeScript

TypeScript is configured with shared configurations:

- **Root config**: `tsconfig.json` - Base configuration for backend services
- **Frontend configs**: `@minierp/typescript-config/react` - React-specific settings
- **Backend configs**: `@minierp/typescript-config/node` - Node.js-specific settings

#### Key Features:
- Strict mode enabled
- Path mapping for clean imports
- Source maps for debugging
- Declaration files generation

## Available Scripts

### Root Level Scripts

```bash
# Development
npm run dev:identity          # Start identity service
npm run dev:frontend          # Start all frontend apps
npm run build:frontend        # Build all frontend apps
npm run build:services        # Build all backend services

# Code Quality
npm run lint                  # Lint all workspaces
npm run lint:fix              # Fix linting issues
npm run format                # Format all code
npm run format:check          # Check formatting
npm run type-check            # Type check all workspaces

# Installation
npm run install:all           # Install all dependencies
```

### Frontend App Scripts

Each frontend app has the following scripts:

```bash
npm run dev                   # Start development server
npm run build                 # Build for production
npm run preview               # Preview production build
npm run lint                  # Lint and fix code
npm run lint:check            # Check linting without fixing
npm run format                # Format code
npm run format:check          # Check formatting
npm run type-check            # Type check without emitting
```

### Backend Service Scripts

Each backend service has the following scripts:

```bash
npm run dev                   # Start development server with hot reload
npm run build                 # Build TypeScript to JavaScript
npm run start                 # Start production server
npm run lint                  # Lint and fix code
npm run lint:check            # Check linting without fixing
npm run format                # Format code
npm run format:check          # Check formatting
npm run type-check            # Type check without emitting
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start development**:
   ```bash
   # Start identity service
   npm run dev:identity
   
   # Start frontend apps (in another terminal)
   npm run dev:frontend
   ```

3. **Code quality checks**:
   ```bash
   # Check all code quality
   npm run lint
   npm run format:check
   npm run type-check
   ```

## IDE Configuration

### VS Code

Recommended VS Code extensions:
- ESLint
- Prettier
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer

### Settings

Add to your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Troubleshooting

### Common Issues

1. **ESLint not working**: Make sure to install dependencies with `npm run install:all`
2. **TypeScript errors**: Run `npm run type-check` to see detailed error messages
3. **Prettier conflicts**: Ensure `.prettierrc` files are properly configured
4. **Import errors**: Check path mappings in `tsconfig.json`

### Reset Configuration

To reset all configurations:

```bash
# Remove node_modules and reinstall
rm -rf node_modules frontend/node_modules services/*/node_modules
npm run install:all
```

## Contributing

When contributing to this project:

1. Run `npm run lint` before committing
2. Run `npm run format` to ensure consistent formatting
3. Run `npm run type-check` to catch TypeScript errors
4. Follow the established code style and patterns
