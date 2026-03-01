# Contributing to ClawSight

First off, thanks for taking the time to contribute! 🎉

ClawSight is built by developers, for developers. We want to make agent monitoring simple, fast, and reliable.

## How to Contribute

### 1. Reporting Bugs
- **Search first:** Check if the issue already exists.
- **Reproduce:** Tell us how to break it. Include code snippets or screenshots.
- **Environment:** Node version? Browser? OS?

### 2. Suggesting Features
- We love new ideas! Open an issue with the tag `enhancement`.
- Explain **why** you need it. "I want Slack alerts because I don't look at the dashboard 24/7."

### 3. Pull Requests (PRs)
1.  **Fork** the repo.
2.  **Clone** it locally.
3.  **Branch** off `main` (`git checkout -b feature/my-cool-feature`).
4.  **Code** your changes.
5.  **Test** (if applicable).
6.  **Push** to your fork.
7.  **Open a PR** against `ClawSight/platform:main`.

## Development Setup

1.  Clone the repo:
    ```bash
    git clone https://github.com/your-username/platform.git
    cd platform
    ```

2.  Install dependencies:
    ```bash
    cd backend && npm install
    # Frontend has no build step (Vanilla JS)
    ```

3.  Run the backend:
    ```bash
    node backend/server.js
    ```
    
4.  Open `frontend/index.html` in your browser.

## Style Guide
- **Keep it simple.** No complex frameworks unless necessary.
- **Comment your code.** Explain *why*, not just *what*.
- **Be nice.** We are all here to build cool stuff.

Happy coding! 🦅
