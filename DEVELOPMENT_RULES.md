# Development Rules for look-at-me-2 Chrome Extension

## Product Overview
**Task Manager Chrome Extension** that replaces the Chrome New Tab page with a task management interface where tasks replace default shortcuts. Each task opens in a tab group when started and can be manually marked complete, showing a congratulatory toast message.

## Project Architecture Overview
- **Framework**: React 18 with TypeScript and Vite
- **Chrome Extension**: Manifest V3 with New Tab override
- **Styling**: TailwindCSS with Chrome-like aesthetic
- **Storage**: Chrome storage.local for task persistence
- **Build System**: Vite with TypeScript compilation and CRXJS integration

## File Organization Rules

### Core Architecture
```
src/
├── types/                    # TypeScript type definitions
│   ├── Task.ts              # Task interface and enums
│   └── index.ts             # Re-export all types
├── hooks/                    # Custom React hooks
│   ├── useTasks.ts          # Task management hook
│   ├── useTabGroups.ts      # Tab group management hook
│   └── useStorage.ts        # Chrome storage hook
├── utils/                    # Utility functions
│   ├── constants.ts         # App constants
│   ├── validation.ts        # URL validation, etc.
│   └── chrome-apis.ts       # Chrome API wrappers
├── components/               # Reusable UI components
│   ├── TaskCard.tsx         # Individual task component
│   ├── TaskList.tsx         # Task list with pagination
│   ├── TaskForm.tsx         # Add/edit task form
│   ├── Toast.tsx            # Completion toast component
│   └── Onboarding.tsx       # First-time user flow
├── newtab/                   # New Tab page (main interface)
│   ├── index.tsx            # Main NewTab component
│   └── NewTab.tsx           # Named export
├── background/               # Service worker
│   └── index.ts             # Background script
└── manifest.ts              # Chrome extension manifest
```

### Single Responsibility Principle (SRP)
- **One module = one responsibility**
- Each file should have a single, well-defined purpose
- Separate concerns: UI, business logic, data management, utilities

## Chrome Extension Specific Rules

### Manifest V3 Compliance
- Use service workers, not background pages
- Follow Chrome's security requirements
- Implement proper CSP (Content Security Policy)
- Target New Tab page override specifically

### New Tab Override
- Replace Chrome's default New Tab page completely
- Implement graceful fallback to default Chrome New Tab if override fails
- Ensure extension works even if other parts break
- Maintain Chrome-like aesthetic and behavior

### Permissions Management
- **Required permissions**: `storage`, `tabs`, `tabGroups`
- Follow principle of least privilege
- Document why each permission is needed
- No unnecessary permissions (no sidePanel, devtools, etc.)

### Storage Rules
- Use `chrome.storage.local` for all task data (not sync)
- Store tasks, user preferences, and app state locally
- Always handle storage operations with error callbacks
- Implement proper data validation before storage
- Never use localStorage for extension data

### Tab Group Management
- Use `chrome.tabGroups` API for creating and managing tab groups
- Create tab groups when tasks are started
- Close tab groups when tasks are completed
- Handle tab group creation errors gracefully
- Implement proper cleanup for abandoned tab groups

### Background Script Rules
- Handle tab group creation and management
- Manage task completion flows
- Handle Chrome API events
- Keep service worker lightweight and event-driven
- Implement proper error handling for Chrome APIs

### URL Validation
- Reject invalid URLs (chrome://, file://, etc.) at task creation
- Validate URLs before saving to storage
- Provide clear error messages for invalid URLs
- Support both HTTP and HTTPS URLs
- Handle URL parsing errors gracefully

## React Component Rules

### Component Structure
- Use functional components with React hooks exclusively
- Export both named component and default export
- Keep components small and focused on single responsibility
- **Maximum 150 lines of code per component** - break into smaller ones
- Use composition over prop drilling

### State Management
- **Centralize state in custom hooks** (e.g., `useTasks`, `useTabGroups`)
- Use local state with hooks (useState, useEffect) for UI state
- Use Chrome storage for persistence across extension contexts
- Avoid prop drilling - use context when needed
- Memoize expensive calculations with useMemo

### Custom Hooks
- **useTasks**: Manage task CRUD operations, state transitions
- **useTabGroups**: Handle tab group creation, management, cleanup
- **useStorage**: Abstract Chrome storage operations
- Keep business logic separate from UI components
- Return consistent interfaces from hooks

### Event Handlers
- Define as arrow functions or regular functions within components
- Use useCallback for handlers passed to child components
- Clean up event listeners in useEffect cleanup
- Handle async operations with proper error handling

### Hooks Usage
- Use useEffect for side effects and Chrome API calls
- Always clean up intervals, timeouts, and event listeners
- Use dependency arrays correctly
- Handle async operations properly
- Implement proper loading and error states

## TypeScript Rules

### Configuration
- Strict mode enabled with strict type checking
- Use ESNext modules with Node resolution
- Use react-jsx transform (no need to import React)

### Type Definitions
- **Define all types in `/types` directory**
- Use @types/chrome for Chrome API type definitions
- Use @types/react and @types/react-dom for React types
- Define interfaces for Chrome storage data
- Use proper typing for Chrome API callbacks

### Task-Specific Types
- **Task interface**: name, description, websites, state, schedule
- **Task states**: pending, in-progress, completed, recurring
- **Use enums or union types for task states**
- **Define shared types in `/types` directory**
- **All props/interfaces typed explicitly**

### Code Quality
- Always annotate function return types explicitly
- Use type guards instead of type assertions
- Prefer interfaces over type aliases for object shapes
- Use unknown instead of any when unsure about types
- Define proper error types for different failure scenarios

## Vite Configuration Rules

### Build Configuration
- Use `build/` directory for output
- Use `assets/chunk-[hash].js` pattern for chunk naming
- Always empty build directory before building
- Enable code splitting and tree shaking

### Plugin Integration
- Use CRXJS Vite plugin for Chrome extension building
- Use official Vite React plugin
- Configure proper asset handling
- Enable HMR for development

### Development
- Use Vite dev server for development
- Leverage hot module replacement
- Configure proper proxy if needed
- Use environment variables through import.meta.env

## Styling Rules (TailwindCSS)

### TailwindCSS Configuration
- Use TailwindCSS for all styling
- Maintain **Chrome-like aesthetic** - clean, minimal, familiar
- Use Tailwind's utility classes for consistent spacing and colors
- Configure custom colors to match Chrome's design language

### Design System
- **Primary colors**: Chrome blue (#1a73e8), Chrome gray (#5f6368)
- **Background**: Chrome new tab white (#ffffff)
- **Text**: Chrome dark gray (#202124)
- **Borders**: Chrome light gray (#dadce0)
- **Hover states**: Subtle Chrome-style hover effects

### Layout Principles
- **Grid-based layout** for task cards (similar to Chrome shortcuts)
- **Responsive design** - works on different screen sizes
- **Consistent spacing** using Tailwind's spacing scale
- **Card-based design** for individual tasks

### Component Styling
- **TaskCard**: Chrome shortcut-like appearance
- **TaskForm**: Clean, minimal form design
- **Toast**: Subtle notification with Chrome styling
- **Onboarding**: Step-by-step flow with clear visual hierarchy

### Accessibility
- **Color contrast**: Meet WCAG AA standards
- **Focus states**: Clear focus indicators
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Proper ARIA labels and roles

## Feature Implementation Rules

### Task Management Features
- **Task Lifecycle**: pending → in-progress → completed → recurring
- **Task Properties**: name, description, websites (array of URLs)
- **Task Limits**: Maximum 12 tasks per day, 8 visible at once
- **Task Navigation**: Arrow buttons to navigate through task pages
- **Task States**: Use enum/union types for state management

### Task Operations
- **Create Task**: Form validation, URL validation, save to storage
- **Edit Task**: Only before task is started (pending state)
- **Delete Task**: Only before task is started (pending state)
- **Start Task**: Create tab group, open all websites, change to in-progress
- **Complete Task**: Manual completion only, close tab group, show toast
- **Recurring Tasks**: Handle daily reset and recurring logic

### Tab Group Management
- **Create Tab Groups**: Use Chrome tabGroups API when task starts
- **Group Websites**: Open all task websites in the same tab group
- **Close Groups**: Close tab group when task is completed
- **Error Handling**: Handle tab group creation failures gracefully
- **Cleanup**: Clean up abandoned or failed tab groups

### Toast Notifications
- **Completion Toast**: Show congratulatory message in new tab
- **Toast Design**: Chrome-style notification with task completion message
- **Toast Timing**: Display for appropriate duration
- **Toast Content**: Include task name and completion message

### Drag and Drop
- **Task Reordering**: Implement drag-and-drop for task list
- **Visual Feedback**: Show drag state and drop zones
- **Persistence**: Save new order to Chrome storage
- **Accessibility**: Provide keyboard alternatives for reordering

### Onboarding Flow
- **First-time Users**: Guide users through initial setup
- **Step-by-step**: Clear instructions for creating first task
- **Skip Option**: Allow users to skip onboarding
- **Progress Indication**: Show onboarding progress

### URL Validation
- **Invalid URLs**: Reject chrome://, file://, and other invalid protocols
- **Validation Timing**: Validate at task creation, not just save
- **Error Messages**: Clear feedback for invalid URLs
- **URL Parsing**: Handle malformed URLs gracefully

## Development Workflow Rules

### Scripts Usage
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run fmt` - Format code with Prettier
- `npm run zip` - Create extension package

### Code Quality
- Run TypeScript compilation before Vite build
- Use Prettier for consistent code formatting
- Follow ESLint rules if configured
- Write meaningful commit messages

### Testing Requirements
- Test New Tab override functionality
- Test task CRUD operations
- Test tab group creation and management
- Test URL validation
- Test Chrome storage operations
- Test drag-and-drop functionality
- Test onboarding flow
- Test error handling and fallbacks

## Coding Guidelines

### General Principles
- **Single Responsibility Principle (SRP)**: One module = one responsibility
- **Avoid hardcoding** - constants in `/utils/constants.ts`
- **Keep logic separate from UI** - no API calls directly inside components
- **Use async/await**, not promise chains
- **Always handle error states** (invalid URLs, storage failures)

### Constants Management
- **App Constants**: Store in `/utils/constants.ts`
- **Task Limits**: MAX_TASKS_PER_DAY = 12, VISIBLE_TASKS = 8
- **Chrome API Constants**: Tab group colors, storage keys
- **UI Constants**: Animation durations, toast display times
- **URL Validation**: Invalid protocols, allowed domains

### Error Handling
- **Chrome API Errors**: Wrap all Chrome API calls in try-catch
- **Storage Errors**: Handle quota exceeded, permission denied
- **URL Validation Errors**: Clear error messages for invalid URLs
- **Tab Group Errors**: Handle creation failures, cleanup abandoned groups
- **Network Errors**: Handle website loading failures

### Async Operations
- **Use async/await** for all asynchronous operations
- **Handle promise rejections** with proper error boundaries
- **Implement loading states** for async operations
- **Use proper cleanup** for intervals and timeouts

## Security Rules

### Content Security Policy
- Follow Chrome extension CSP requirements
- Avoid inline scripts and styles
- Use nonce or hash for required inline content
- Restrict external resource loading

### External Resources
- Only load resources from trusted sources
- Use HTTPS for all external requests
- Validate external data before use
- Implement proper error handling

### Data Handling
- Sanitize user input
- Validate data from Chrome storage
- Use proper encoding for data transmission
- Implement secure communication patterns

## Performance Rules

### Code Optimization
- Use Vite's automatic code splitting
- Implement lazy loading for large components
- Minimize bundle size
- Use proper tree shaking

### Task Management Performance
- **Pagination**: Only render 8 visible tasks at once
- **Virtual Scrolling**: For large task lists (if needed)
- **Memoization**: Use React.memo for TaskCard components
- **Debouncing**: Debounce search and filter operations
- **Lazy Loading**: Load task data on demand

### Chrome API Performance
- **Batch Operations**: Batch Chrome storage operations
- **Tab Group Management**: Efficient tab group creation/cleanup
- **Event Handling**: Debounce frequent events
- **Memory Management**: Clean up event listeners and intervals

### Asset Optimization
- Optimize images and other assets
- Use appropriate image formats
- Implement proper caching strategies
- Minimize HTTP requests

### Runtime Performance
- Keep service worker lightweight and event-driven
- Minimize DOM manipulation
- Use requestAnimationFrame for animations
- Implement proper cleanup and memory management

## Error Handling Rules

### Chrome APIs
- Always handle Chrome API errors with try-catch
- Implement proper fallback mechanisms
- Log errors appropriately
- Provide user-friendly error messages

### Storage Operations
- Handle storage get/set operations with error callbacks
- Implement retry logic for failed operations
- Validate data before storage operations
- Handle quota exceeded errors

### Message Passing
- Handle message passing errors gracefully
- Implement timeout mechanisms
- Validate message types and content
- Provide proper error responses

### Async Operations
- Use proper async/await patterns for Chrome APIs
- Handle promise rejections
- Implement proper loading states
- Use try-catch for async operations

## Accessibility Rules

### HTML Structure
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure proper heading hierarchy
- Use descriptive alt text for images

### Task Manager Accessibility
- **Task Cards**: Proper ARIA roles and labels
- **Drag and Drop**: Keyboard alternatives for reordering
- **Form Elements**: Clear labels and error messages
- **Navigation**: Arrow buttons with proper ARIA labels
- **Toast Notifications**: ARIA live regions for announcements

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Implement proper tab order
- Provide keyboard shortcuts where appropriate
- Handle focus management properly
- **Task Operations**: Keyboard shortcuts for common actions

### Screen Readers
- Provide proper labels for form elements
- Use ARIA live regions for dynamic content
- Ensure proper color contrast
- Test with screen readers
- **Task States**: Announce task state changes
- **Toast Messages**: Proper announcement of completions

## Documentation Rules

### Code Documentation
- Document complex Chrome API usage
- Explain non-obvious business logic
- Document component props and interfaces
- Maintain up-to-date README

### API Documentation
- Document Chrome storage data structures
- Document message passing protocols
- Document component interfaces
- Document build and deployment processes

## Maintenance Rules

### Dependency Management
- Keep dependencies up to date
- Use exact versions for critical dependencies
- Regularly audit dependencies for security issues
- Document dependency choices

### Code Maintenance
- Refactor code regularly
- Remove unused code and dependencies
- Keep code DRY (Don't Repeat Yourself)
- Follow consistent coding patterns

### Testing Maintenance
- Keep tests up to date with code changes
- Test all Chrome extension contexts
- Test cross-browser compatibility
- Test different Chrome versions

## Deployment Rules

### Build Process
- Ensure clean build directory
- Verify all assets are included
- Test built extension before deployment
- Use proper versioning

### Packaging
- Use npm run zip for extension packaging
- Verify manifest.json is valid
- Test packaged extension
- Document deployment process

### Version Management
- Use semantic versioning
- Update version in package.json and manifest
- Document changes in CHANGELOG.md
- Tag releases properly
