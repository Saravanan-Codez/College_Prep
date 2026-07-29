# Contributing to CS College Prep OS

Thank you for your interest in contributing to **CS College Prep OS**! We welcome bug reports, feature suggestions, documentation improvements, and code pull requests.

## 🚀 How to Contribute

### 1. Reporting Bugs
If you find a bug:
- Open a GitHub Issue detailing your Operating System, app version, and steps to reproduce.
- Include console error logs or screenshots if applicable.

### 2. Suggesting Enhancements
Feature requests are always appreciated!
- Describe the feature and why it would benefit student preparation.

### 3. Submitting Pull Requests (PRs)
1. **Fork the repository** and clone your fork locally.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
3. **Install dependencies with Bun**:
   ```bash
   bun install
   ```
4. **Make changes & verify syntax**:
   ```bash
   bun run build
   ```
5. **Commit your changes**:
   ```bash
   git commit -m "feat: Add amazing new feature"
   ```
6. **Push to your fork & submit a Pull Request**.

## 🎨 Code Conventions
- **Svelte / Vue Components**: Keep state clear and responsive.
- **CSS**: Use Tailwind CSS utility classes alongside predefined shadcn HSL design tokens.
- **Tauri Rust Backend**: Keep native Rust code in `src-tauri/src/main.rs`.

Thank you for helping make college prep open-source and accessible to everyone! 🎓
