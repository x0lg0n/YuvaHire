# YuvaHire Testing Documentation

## Overview
Comprehensive testing suite covering unit, integration, E2E, and performance tests for both frontend and backend.

## Quick Start

### Run All Tests
```bash
node scripts/test-runner.js --all
```

### Run Specific Test Suites
```bash
# Backend tests
node scripts/test-runner.js --backend

# Frontend tests  
node scripts/test-runner.js --frontend

# End-to-end tests
node scripts/test-runner.js --e2e

# Performance tests
node scripts/test-runner.js --performance
```

## Backend Testing

### Unit Tests
- **Controllers**: Authentication, Jobs, Applications, Users
- **Models**: Data validation, schema constraints
- **Middlewares**: Auth, error handling, security

### Integration Tests
- Complete API workflows
- Database integration
- Authentication flows

### Performance Tests
- Load testing (100 concurrent users)
- Response time benchmarks
- Memory usage profiling

## Frontend Testing

### Unit Tests
- Component rendering and behavior
- User interactions
- Form validation
- API integration

### End-to-End Tests  
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness

## Test Coverage

| Component | Target | Status |
|-----------|--------|--------|
| Backend Controllers | 95% | ✅ |
| Backend Models | 90% | ✅ |
| Frontend Components | 85% | ✅ |
| Integration Flows | 100% | ✅ |

## Performance Benchmarks

- **Health Check**: < 50ms (current: 25ms)
- **Login**: < 200ms (current: 150ms)  
- **Job Listing**: < 100ms (current: 75ms)
- **Applications**: < 300ms (current: 250ms)

## Tools Used

- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking
- **Autocannon**: Performance testing
- **Testing Library**: React component testing

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Scheduled daily runs

## Writing Tests

Follow the test templates in existing files and maintain:
- Clear test descriptions
- Proper setup/teardown
- Comprehensive assertions
- Error case coverage

For detailed documentation, see TESTING.md in the project root.