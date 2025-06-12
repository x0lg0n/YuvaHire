# Contributing to YuvaHire

First off, thank you for considering contributing to YuvaHire! It's people like you that make YuvaHire such a great tool for the student community.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct.

## Development Process

We use GitHub to host code, track issues and feature requests, as well as accept pull requests.

### Pull Request Process

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Update the documentation.
5. Issue the pull request!

### Commit Messages

Good commit messages serve at least three important purposes:

- To help code reviewers understand proposed changes
- To help future maintainers understand why a change was made
- To help generate meaningful changelogs

Structure your commit message like this:

```
feat(scope): add hat wobble
^--^^-----^  ^------------^
|   |        |
|   |        +-> Summary in present tense
|   +-> Scope: client, server, common, etc.
+-> Type: feat, fix, docs, refactor, test, etc.
```

### Development Setup

1. **Prerequisites**
   - Node.js (v18.0 or higher)
   - MongoDB (v5.0 or higher)
   - pnpm package manager

2. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/YuvaHire.git
   cd YuvaHire
   ```

3. **Install Dependencies**
   ```bash
   # Frontend
   cd client
   pnpm install

   # Backend
   cd ../server
   pnpm install
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env` in both client and server directories
   - Update the environment variables as needed

5. **Start Development Servers**
   ```bash
   # Frontend (in client directory)
   pnpm dev

   # Backend (in server directory)
   pnpm dev
   ```

### Code Style

We use ESLint and Prettier to maintain code quality. Please ensure your code:

- Follows the existing style
- Has meaningful variable names
- Is well-documented with JSDoc comments where appropriate
- Passes all linting checks

```bash
# Run linting
pnpm lint

# Run formatting
pnpm format
```

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Follow existing test patterns

```bash
# Run tests
pnpm test
```

## Feature Requests

We love features that:

- Help students find better job opportunities
- Make college administrators' jobs easier
- Improve the overall user experience
- Enhance security and performance

Open an issue on GitHub and label it as 'enhancement' to propose new features.

## Bug Reports

A good bug report should contain:

- A clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment details

Use the bug report template when creating an issue.

## Questions or Need Help?

- Check the documentation first
- Search existing issues
- Open a new issue with the 'question' label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
