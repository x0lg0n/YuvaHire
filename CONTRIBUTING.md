# Contributing to YuvaHire

Thank you for your interest in contributing to YuvaHire! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Reports**: Report bugs and issues
- **✨ Feature Requests**: Suggest new features
- **📝 Documentation**: Improve documentation
- **💻 Code Contributions**: Submit code changes
- **🎨 UI/UX Improvements**: Enhance user interface
- **🧪 Testing**: Add or improve tests
- **🔧 Infrastructure**: Improve build tools and CI/CD

### Before You Start

1. **Check existing issues**: Search for similar issues or feature requests
2. **Read the documentation**: Familiarize yourself with the project structure
3. **Set up development environment**: Follow the setup instructions in README.md

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- MongoDB 6+
- pnpm (recommended) or npm
- Git

### Local Development

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/yuva-hire.git
   cd yuva-hire
   ```

2. **Install dependencies**
   ```bash
   # Server dependencies
   cd server && pnpm install
   
   # Client dependencies
   cd ../client && pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Server
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   
   # Client
   cd ../client
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server && pnpm dev
   
   # Terminal 2 - Frontend
   cd client && pnpm dev
   ```

## 📝 Code Style Guidelines

### General Principles

- **Readability**: Write code that is easy to understand
- **Consistency**: Follow existing patterns and conventions
- **Documentation**: Comment complex logic and document APIs
- **Testing**: Write tests for new features and bug fixes

### JavaScript/TypeScript

- Use **ES6+** features
- Prefer **const** and **let** over **var**
- Use **arrow functions** for callbacks
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes and components

### React/Next.js

- Use **functional components** with hooks
- Follow **component naming conventions**
- Implement **proper prop validation**
- Use **TypeScript** for type safety

### Backend (Node.js/Express)

- Follow **RESTful API design principles**
- Use **async/await** for asynchronous operations
- Implement **proper error handling**
- Use **middleware** for cross-cutting concerns

### Database (MongoDB)

- Use **Mongoose schemas** for data validation
- Follow **naming conventions** for collections
- Implement **proper indexing** for performance
- Use **transactions** where appropriate

## 🧪 Testing Guidelines

### Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows
- **Visual Regression Tests**: Test UI consistency

### Running Tests

```bash
# Backend tests
cd server && pnpm test

# Frontend tests
cd client && pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Writing Tests

- Write **descriptive test names**
- Follow **AAA pattern** (Arrange, Act, Assert)
- Use **mocking** for external dependencies
- Test **edge cases** and error scenarios

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OAuth2 authentication
fix(api): resolve user registration bug
docs(readme): update installation instructions
```

### Pull Request Guidelines

1. **Title**: Use clear, descriptive title
2. **Description**: Explain what and why, not how
3. **Related Issues**: Link to relevant issues
4. **Screenshots**: Include screenshots for UI changes
5. **Testing**: Describe how you tested the changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** for similar problems
2. **Check documentation** for solutions
3. **Test with latest version** from main branch

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

## Additional Information
Screenshots, logs, etc.
```

## ✨ Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why this feature is needed

## Proposed Solution
How you think it should work

## Alternatives Considered
Other approaches you've considered

## Additional Information
Mockups, examples, etc.
```

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `invalid`: Something is wrong
- `question`: Further information is requested
- `wontfix`: This will not be worked on

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time chat and community support

### Code of Conduct

We are committed to providing a welcoming and inspiring community. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## 🙏 Recognition

Contributors will be recognized in:

- **README.md**: List of contributors
- **Release notes**: Credit for significant contributions
- **Documentation**: Attribution for documentation contributions

## 📄 License

By contributing to YuvaHire, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to YuvaHire! 🚀
