# My Project Roadmap

<!-- 
  rhythm-plugin template — markdown edition
  ==========================================
  Rules:
  - ## Headings become the GitHub milestone for all tasks below them
  - - [ ] lines become issues (title = the task text)
  -   - Indented lines become the issue body
  - - [x] lines are skipped (already done)
  - ``` fenced code blocks below a task are included in the issue body
  - Tasks with no preceding heading have no milestone assigned
-->

## Sprint 1 — Authentication

- [ ] Set up user authentication
  - Implement login and registration flows using JWT tokens
  - POST /auth/login returns access + refresh token
  - POST /auth/register creates user and sends verification email

- [ ] Build password reset flow
  - Allow users to reset their password via a time-limited email link
  - Reset link must expire after 1 hour
  - Using the link should invalidate all existing sessions

- [ ] Add OAuth login (GitHub + Google)
  - Redirect to provider, exchange code, upsert user record
  - Link OAuth identity to existing account when email matches

- [x] Bootstrap project repository
  - Already done — skipped by the plugin

## Sprint 2 — Dashboard

- [ ] Design dashboard home screen
  - Widget grid with drag-and-drop reordering
  - Persistent layout saved per user in the database
  - Empty state shown when no widgets have been added yet

- [ ] Implement activity feed widget
  - Show a chronological list of recent events
  - New events should appear without a full page reload
  - User can mark individual events as read

- [ ] Write end-to-end tests for dashboard
  - Cover happy path: login → view dashboard → add widget
  - Cover error path: widget load failure shows inline error message

- [ ] Set up CI pipeline
  - Run tests on every push and pull request
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci
        - run: npm test
  ```

## Backlog

- [ ] Explore push notification support
  - Compare browser support matrix for Web Push API
  - Prototype the opt-in permission flow
  - Estimate backend changes required

- [ ] Audit accessibility (WCAG 2.1 AA)
  - Run axe-core on all pages
  - Fix any critical and serious violations before launch
