# Contributing to Supabase Coolify MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- **Clear title** describing the issue
- **Description** with detailed steps to reproduce
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Node version, Coolify version, Supabase version)
- **Logs or error messages** if applicable

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- **Clear description** of the feature
- **Use case** explaining why it would be useful
- **Proposed implementation** if you have ideas
- **Alternatives considered**

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/supabase-coolify-mcp-server
   cd supabase-coolify-mcp-server
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

5. **Test your changes**
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template

## 📝 Code Style

### TypeScript

- Use TypeScript for all code
- Provide type annotations for public APIs
- Avoid `any` types when possible
- Use interfaces for object types

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline objects/arrays
- Maximum line length: 100 characters

### Naming Conventions

- `camelCase` for variables and functions
- `PascalCase` for classes and types
- `UPPER_SNAKE_CASE` for constants
- Descriptive names over short names

### Comments

- Use JSDoc for public APIs
- Add comments for complex logic
- Keep comments up-to-date with code changes

Example:

```typescript
/**
 * Deploy a new database migration
 * @param sql - The SQL migration code
 * @param name - A descriptive name for the migration
 * @returns Promise with the migration result
 */
async deployMigration(sql: string, name: string): Promise<ToolResponse<Migration>> {
  // Implementation
}
```

## 🧪 Testing

### Manual Testing

1. Set up test environment variables
2. Build the project: `npm run build`
3. Test with a real Coolify and Supabase instance
4. Verify all tools work as expected

### Test Checklist

Before submitting a PR, ensure:

- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] All new features are documented
- [ ] README updated if needed
- [ ] Tested with actual Coolify/Supabase instances

## 🏗️ Project Structure

```
supabase-coolify-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── types.ts              # Type definitions
│   ├── coolify-client.ts     # Coolify API client
│   ├── supabase-client.ts    # Supabase management
│   ├── resources.ts          # MCP resources
│   └── tools/
│       ├── supabase-tools.ts     # Supabase tools
│       ├── coolify-tools.ts      # Coolify tools
│       └── deployment-tools.ts   # Deployment tools
├── dist/                     # Built JavaScript files
├── README.md                 # Main documentation
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
└── package.json              # Project configuration
```

## 🎯 Development Priorities

### High Priority

- Bug fixes
- Security improvements
- Core functionality improvements
- Documentation improvements

### Medium Priority

- New Supabase features (new services, etc.)
- New Coolify features
- Performance optimizations
- Developer experience improvements

### Low Priority

- Nice-to-have features
- Code refactoring (without functional changes)
- Cosmetic improvements

## 🔒 Security

### Reporting Security Issues

**Do not** create public issues for security vulnerabilities.

Instead:
1. Email the maintainers directly
2. Include detailed information about the vulnerability
3. Wait for a response before disclosing publicly

### Security Best Practices

When contributing:
- Never commit API tokens or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Use secure random generation for tokens
- Keep dependencies updated

## 📚 Documentation

### When to Update Documentation

Update documentation when:
- Adding new features or tools
- Changing existing behavior
- Fixing bugs that affect usage
- Improving error messages

### Documentation Checklist

- [ ] README.md updated with new features
- [ ] DEPLOYMENT_GUIDE.md updated if deployment changes
- [ ] Code comments added/updated
- [ ] Type definitions documented
- [ ] Examples provided for new features

## 🌟 Code Review Process

All PRs require:
1. **Code review** by at least one maintainer
2. **Passing tests** (when implemented)
3. **No merge conflicts**
4. **Up-to-date with main branch**

Reviewers will check for:
- Code quality and style
- Functionality and correctness
- Test coverage
- Documentation completeness
- Security considerations

## 💡 Getting Help

If you need help:

1. **Check existing issues** - your question might be answered
2. **Read the documentation** - README and DEPLOYMENT_GUIDE
3. **Create an issue** - ask questions or discuss ideas
4. **Be patient and respectful** - maintainers are volunteers

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, is valued and appreciated. Thank you for helping make this project better!

---

**Questions?** Open an issue or reach out to the maintainers.

