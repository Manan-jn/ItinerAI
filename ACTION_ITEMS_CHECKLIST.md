# ItinerAI - Action Items Checklist

## 🔴 Critical Priority (Do First)

### 1. Remove Unused Code
- [ ] Delete `src/app/components/ItinerAIChatBoxDemo.tsx`
- [ ] Delete `src/app/components/GlowBorder.tsx`
- [ ] Delete `src/app/components/glow_border_effect/` folder (index.html + styles.css)
- [ ] Remove or move `src/app/utils/testPreFetchTrigger.ts` to dev dependencies
- [ ] Verify and potentially remove `FlashcardsWidget.tsx` (dark theme) if superseded

### 2. Split Large Files
- [ ] Split `FlightsPageAuthenticated.tsx` (5,260 lines)
  - [ ] Extract inline components (NavItem, TripTypeButton, etc.)
  - [ ] Create separate layout components
  - [ ] Separate business logic from UI
- [ ] Refactor `flights/page.tsx` (2,242 lines)
  - [ ] Extract dashboard section
  - [ ] Extract chat section
  - [ ] Extract flights section

### 3. Consolidate Loading Components
- [ ] Create unified `<LoadingSpinner theme="dark"|"light" variant="inline"|"modal" />`
- [ ] Replace `LoadingSpinner.tsx` usage
- [ ] Replace `LoadingSpinnerWhite.tsx` usage
- [ ] Replace `ModalLoader.tsx` usage
- [ ] Replace `ModalLoaderWhite.tsx` usage
- [ ] Delete original 4 files after migration

---

## 🟡 High Priority (Do Soon)

### 4. Security Improvements
- [ ] Implement CSRF protection in middleware
- [ ] Add rate limiting to API routes
  - [ ] `/api/chat` (most critical)
  - [ ] `/api/itinerary`
  - [ ] Other public endpoints
- [ ] Add input sanitization for user inputs
- [ ] Review and secure session storage (consider httpOnly cookies)

### 5. Performance Optimization
- [ ] Add `React.memo` to expensive components
  - [ ] `FlashcardsWidgetWhiteTheme`
  - [ ] `FlightsWidget`
  - [ ] `ItineraryWidget`
- [ ] Implement code splitting for large components
  - [ ] Dynamic import for `FlightsWidget`
  - [ ] Dynamic import for `ItineraryWidget`
- [ ] Add request caching (SWR or React Query)
  - [ ] Chat API responses
  - [ ] Itinerary data
  - [ ] Conveyance/stay data
- [ ] Run bundle analyzer and optimize

### 6. State Management Refactoring
- [ ] Choose state management solution (Zustand recommended)
- [ ] Create trip store
- [ ] Create UI state store
- [ ] Migrate from useState to store
- [ ] Reduce prop drilling

---

## 🟢 Medium Priority (Can Wait)

### 7. Testing Setup
- [ ] Install Jest and React Testing Library
- [ ] Configure test environment
- [ ] Write unit tests for utilities
  - [ ] `sessionManager.ts`
  - [ ] `memoryApi.ts`
  - [ ] `tripStorage.ts`
  - [ ] `itineraryStorage.ts`
- [ ] Write integration tests for API routes
  - [ ] `/api/chat`
  - [ ] `/api/itinerary`
- [ ] Set up E2E testing (Playwright)
- [ ] Add test coverage reporting

### 8. Documentation
- [ ] Create comprehensive README.md
  - [ ] Project overview
  - [ ] Setup instructions
  - [ ] Environment variables
  - [ ] Development workflow
- [ ] Create API.md
  - [ ] Document all API endpoints
  - [ ] Request/response examples
  - [ ] Error codes
- [ ] Create ARCHITECTURE.md
  - [ ] System design overview
  - [ ] Data flow diagrams
  - [ ] Component hierarchy
- [ ] Add JSDoc comments to complex functions
- [ ] Create CONTRIBUTING.md

### 9. File Structure Reorganization
- [ ] Create new folder structure
  ```
  components/
  ├── shared/
  ├── layouts/
  ├── features/
  │   ├── auth/
  │   ├── flights/
  │   ├── itinerary/
  │   └── chat/
  └── ui/
  ```
- [ ] Move components to appropriate folders
- [ ] Update imports across codebase
- [ ] Create barrel exports (index.ts files)

---

## ⚪ Low Priority (Nice to Have)

### 10. UI/UX Improvements
- [ ] Implement error boundaries
  - [ ] Root error boundary
  - [ ] Feature-specific error boundaries
- [ ] Add skeleton loaders instead of spinners
- [ ] Improve accessibility
  - [ ] Add ARIA labels
  - [ ] Keyboard navigation
  - [ ] Screen reader support
- [ ] Add loading states for all async operations
- [ ] Improve error messages (user-friendly)

### 11. Developer Experience
- [ ] Set up ESLint with strict rules
- [ ] Configure Prettier
- [ ] Add Husky for pre-commit hooks
  - [ ] Run linting
  - [ ] Run type checking
  - [ ] Run tests
- [ ] Set up Storybook for component development
- [ ] Add commit message linting (commitlint)
- [ ] Create VS Code workspace settings

### 12. Code Quality Improvements
- [ ] Replace `any` types with proper types
- [ ] Add missing TypeScript types
- [ ] Standardize naming conventions
- [ ] Add consistent error logging format
- [ ] Implement proper error boundaries
- [ ] Add input validation to all API routes

---

## 📊 Metrics to Track

### Before Refactoring
- [ ] Measure bundle size
- [ ] Measure initial load time
- [ ] Count total lines of code
- [ ] Run Lighthouse audit

### After Refactoring (Target Improvements)
- [ ] Bundle size reduced by 30%
- [ ] Initial load time < 3 seconds
- [ ] Code coverage > 70%
- [ ] Lighthouse score > 90

---

## 🎯 Sprint Planning Suggestion

### Sprint 1 (Week 1-2): Critical Cleanup
- Remove unused code
- Start splitting large files
- Consolidate loading components

### Sprint 2 (Week 3-4): Security & Performance
- Implement security measures
- Add performance optimizations
- Set up bundle analysis

### Sprint 3 (Week 5-6): State Management & Testing
- Migrate to Zustand
- Set up testing framework
- Write initial tests

### Sprint 4 (Week 7-8): Documentation & Polish
- Complete documentation
- File reorganization
- UI/UX improvements

---

## 📝 Progress Tracking

**Last Updated:** [Date]

**Completed Items:** 0 / 60+

**Current Sprint:** Not Started

**Blockers:** None

---

## 🤝 Team Assignments

### Developer 1 (Frontend Lead)
- [ ] Large file splitting
- [ ] Component consolidation
- [ ] State management migration

### Developer 2 (Backend/API)
- [ ] Security improvements
- [ ] API route optimization
- [ ] Caching strategy

### Developer 3 (Testing/QA)
- [ ] Testing setup
- [ ] Writing tests
- [ ] Performance benchmarking

### Developer 4 (Documentation)
- [ ] Documentation creation
- [ ] Code comments
- [ ] Architecture diagrams

---

## ✅ Quick Wins (Can Complete in < 1 Day)

1. [ ] Delete unused files (2 hours)
2. [ ] Add ESLint and Prettier (2 hours)
3. [ ] Create README.md (4 hours)
4. [ ] Run bundle analyzer (1 hour)
5. [ ] Add error boundaries (4 hours)
6. [ ] Standardize loading states (4 hours)

---

**Total Items:** 60+  
**Estimated Total Time:** 6-8 weeks  
**Team Size Recommendation:** 3-4 developers

