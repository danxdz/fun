# Contributing to AutoBot Manager 🤖

Thank you for your interest in contributing to AutoBot Manager! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/autobot-manager.git
   cd autobot-manager
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Install dependencies**
   ```bash
   npm install
   ```
5. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   npm run server:dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style

- **JavaScript/React**: Use ES6+ features, prefer functional components
- **CSS**: Use Tailwind CSS classes, avoid custom CSS when possible
- **Backend**: Use async/await, proper error handling
- **Database**: Use Sequelize models, follow naming conventions

### Commit Messages

Use conventional commit format:
```
type(scope): description

feat(auth): add OAuth2 authentication
fix(bots): resolve bot spawner memory leak
docs(readme): update deployment instructions
style(ui): improve button hover states
refactor(api): simplify user controller
test(bots): add bot spawner unit tests
```

### Pull Request Process

1. **Create a descriptive PR title**
2. **Add a detailed description** of your changes
3. **Include screenshots** for UI changes
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Ensure all tests pass**

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write tests for all new features
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details** (OS, Node.js version, etc.)
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Screenshots** (if applicable)
5. **Console logs** (if applicable)

## 💡 Feature Requests

When requesting features, please:

1. **Describe the problem** you're trying to solve
2. **Explain your proposed solution**
3. **Provide examples** of similar features
4. **Consider the impact** on existing functionality

## 🏗 Project Structure

```
├── src/                    # Frontend React app
│   ├── components/         # Reusable components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   └── utils/             # Frontend utilities
├── server/                # Backend Node.js app
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Backend utilities
├── docs/                  # Documentation
└── tests/                 # Test files
```

## 🔧 Development Tools

### Recommended Extensions (VS Code)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- React Developer Tools
- PostgreSQL

### Useful Commands
```bash
# Database
npm run db:migrate        # Run migrations
npm run db:seed           # Seed database
npm run db:reset          # Reset database

# Development
npm run dev               # Start frontend
npm run server:dev        # Start backend
npm run build             # Build for production

# Testing
npm test                  # Run tests
npm run lint              # Run linter
npm run lint:fix          # Fix linting issues
```

## 📚 Documentation

### Code Documentation
- Use JSDoc comments for functions and classes
- Document complex business logic
- Keep README files updated
- Add inline comments for tricky code

### API Documentation
- Document all API endpoints
- Include request/response examples
- Specify error codes and messages
- Keep OpenAPI/Swagger docs updated

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be patient with newcomers
- Provide constructive feedback
- Respect different perspectives

### Communication
- Use clear, concise language
- Ask questions when unsure
- Share knowledge and help others
- Be open to feedback and suggestions

## 🎯 Areas for Contribution

### High Priority
- [ ] Bot performance optimization
- [ ] Real-time collaboration features
- [ ] Advanced git operations
- [ ] Security enhancements
- [ ] Mobile app development

### Medium Priority
- [ ] Additional bot types
- [ ] Analytics and reporting
- [ ] Team management features
- [ ] API rate limiting
- [ ] Documentation improvements

### Low Priority
- [ ] UI/UX improvements
- [ ] Performance monitoring
- [ ] Integration tests
- [ ] Accessibility features
- [ ] Internationalization

## 🏆 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame
- GitHub contributors page

## 📞 Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/yourusername/autobot-manager/discussions)
- **Issues**: [GitHub Issues](https://github.com/yourusername/autobot-manager/issues)
- **Discord**: [Community Server](https://discord.gg/autobot-manager)
- **Email**: [team@autobotmanager.com](mailto:team@autobotmanager.com)

## 📄 License

By contributing to AutoBot Manager, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AutoBot Manager! 🚀