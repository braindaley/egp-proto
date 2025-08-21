# Testing Guide

## Overview
This project uses Jest and React Testing Library for testing the recent updates made in the past 7 days. The test suite covers:

- Watch Button functionality and authentication flows
- Following Page with bill filtering and group watching
- Advocacy Message workflow (complete end-to-end flow)
- API endpoints for AI message generation and census data
- Custom hooks for watched groups management
- User verification modal component

## Test Structure

```
__tests__/
├── components/                    # Component tests
│   ├── WatchButton.test.tsx      # Watch/unwatch functionality
│   └── user-verification-modal.test.tsx  # User verification flow
├── hooks/                        # Custom hook tests
│   └── use-watched-groups.test.tsx    # Group watching logic
├── api/                          # API endpoint tests
│   ├── advocacy-message.test.ts   # AI message generation API
│   └── census-data.test.ts       # Census data API endpoints
├── integration/                  # Integration tests
│   └── advocacy-flow.test.tsx    # Full advocacy message workflow
├── FollowingPage.test.tsx        # Following page component
└── AdvocacyMessage.test.tsx      # Advocacy message page
```

## Key Features Tested

### 1. Watch Button Component (`WatchButton.test.tsx`)
- **Authentication flows**: Redirects to login for unauthenticated users
- **Watch/unwatch functionality**: Toggle states and persistence
- **Visual states**: Styling changes based on watch status
- **Accessibility**: Event handling and styling

### 2. Following Page (`FollowingPage.test.tsx`)
- **Authentication redirects**: Proper handling of unauthenticated users  
- **Loading states**: Authentication and data loading indicators
- **Error handling**: API failures and retry mechanisms
- **Content filtering**: Bills from watched groups and individual watches
- **Empty states**: When no content is being followed
- **Additional bill fetching**: Bills from watched groups not in main feed

### 3. Advocacy Message Flow (`AdvocacyMessage.test.tsx`)
- **Multi-step workflow**: Navigation between compose, select, and review steps
- **User verification**: Handling of verified user information
- **AI message generation**: Template creation and error handling
- **Personal data selection**: Privacy controls and field validation
- **Form validation**: Required field enforcement
- **Member selection**: Congressional representative selection

### 4. API Endpoints
#### AI Message Generation (`api/advocacy-message.test.ts`)
- **Request validation**: Required fields and data types
- **AI service integration**: Mock responses and error handling
- **Stance and tone options**: Support/oppose positions and formal/casual tones
- **Personal data handling**: Privacy preferences in message generation

#### Census Data (`api/census-data.test.ts`)
- **District-level data**: Congressional district demographics and economics
- **State-level data**: Statewide statistics and demographics
- **Parameter validation**: Required query parameters and error responses
- **Data consistency**: Format consistency between endpoints

### 5. Custom Hooks
#### useWatchedGroups (`hooks/use-watched-groups.test.tsx`)
- **Authentication dependency**: Different behavior for authenticated vs anonymous users
- **Local storage persistence**: Data saving and retrieval
- **Watch state management**: Adding and removing watched groups
- **User changes**: Data reloading when authentication state changes

### 6. User Verification Modal (`components/user-verification-modal.test.tsx`)
- **Form validation**: Address validation and ZIP code formats
- **Submission handling**: Success and error states
- **Representative display**: Showing user's representatives
- **Accessibility**: Modal focus management and keyboard navigation

### 7. Integration Tests (`integration/advocacy-flow.test.tsx`)
- **Complete user journeys**: End-to-end advocacy message creation
- **Different user types**: Anonymous, verified, and authenticated flows
- **Error scenarios**: Graceful degradation when services fail
- **Validation flows**: Progressive form validation

## Running Tests

### Install dependencies
```bash
npm install
```

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests for CI
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration with `next/jest`
- TypeScript and JSX support
- Module path mapping for `@/` aliases
- Coverage reporting configuration
- Test environment setup for jsdom

### Test Setup (`jest.setup.js`)
- React Testing Library DOM assertions
- Next.js router mocking
- Firebase service mocking
- Global browser API mocks (IntersectionObserver, matchMedia, etc.)
- Local/session storage mocks

## Recent Updates Covered

Based on the git history from the past 7 days, the tests cover:

1. **Watch Button Updates** (`7454a5b`, `a6074ee`)
   - New watch/unwatch functionality
   - Authentication-based behavior
   - Visual state improvements

2. **Following Page Implementation** (`c1aac74`)
   - New following page with bill filtering
   - Integration with watched groups
   - Loading and error states

3. **Advocacy Message Flow** (`47d27dc`, `5c83ef5`, `bb19be5`)
   - Complete redesign of advocacy message workflow
   - Multi-step wizard interface
   - User verification integration

4. **User Verification Modal** (`254102d`)
   - Identity verification for message sending
   - Address validation and representative matching

5. **Group Management** (`63f04e6`)
   - Admin group management functionality
   - Group-bill association features

6. **Census Data Integration** (`95d5a1a`)
   - Congressional district demographics
   - State-level census data APIs

7. **Build Fixes and Deployment** (`354dd45`, `dec4a63`, `993e77d`)
   - Build error resolution
   - Cache improvements
   - Deployment optimization

## Coverage Goals

The test suite aims for:
- **Component Coverage**: All new/modified components
- **Integration Coverage**: Complete user workflows
- **API Coverage**: All new endpoints and data flows
- **Hook Coverage**: Custom hooks with complex logic
- **Error Coverage**: Graceful failure handling

## Best Practices

1. **Realistic Mocking**: Mock external dependencies while keeping business logic testable
2. **User-Centric Testing**: Test from user perspective rather than implementation details
3. **Integration Focus**: Emphasize integration tests for critical user flows
4. **Error Scenarios**: Test both happy path and error conditions
5. **Accessibility**: Include accessibility testing where relevant

## Maintenance

To keep tests current:
1. **Add tests for new features**: Any new component or API should include tests
2. **Update mocks**: Keep Firebase and API mocks aligned with actual implementations
3. **Review coverage**: Regularly check coverage reports and add tests for uncovered areas
4. **Refactor tests**: Keep test code clean and maintainable alongside production code