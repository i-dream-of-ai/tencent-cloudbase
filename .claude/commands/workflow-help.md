# Workflow Help Command

**Description:** Show available workflow commands and usage examples

## Usage

### Claude Code
```bash
/help
```
or
```bash
/workflow
```

### Other IDEs
```bash
@workflow-help
```

## Available Commands

### `/spec` or `@spec`
Force complete spec workflow for structured software engineering

**Best for:**
- New feature development
- Complex architecture design
- Multi-module integration
- Database design projects
- UI/UX design projects

### `/no-spec` or `@no-spec`
Skip spec workflow and execute tasks directly

**Best for:**
- Simple bug fixes
- Documentation updates
- Configuration changes
- Code refactoring
- Performance optimizations

### `/help` or `@workflow-help`
Show this help information

## Smart Detection

If you don't specify a command, the AI will automatically detect the task complexity and choose the appropriate workflow:

**Uses Spec Workflow for:**
- New feature development
- Complex architecture design
- Multi-module integration
- Database design
- UI design
- Third-party service integration

**Uses No-Spec Workflow for:**
- Simple bug fixes
- Documentation updates
- Configuration modifications
- Code refactoring
- Performance optimization
- Test case writing

## Examples

### Spec Workflow Example
```
/spec 开发一个用户管理系统
```

### No-Spec Workflow Example
```
/no-spec 修复登录按钮的样式问题
```

### Smart Detection Example
```
开发一个复杂的电商购物车功能
```
(AI will automatically choose spec workflow)

```
修复 README.md 中的错别字
```
(AI will automatically choose no-spec workflow)

## Workflow Comparison

| Aspect | Spec Workflow | No-Spec Workflow |
|--------|---------------|------------------|
| Documentation | Comprehensive | Minimal |
| Process | Structured | Direct |
| Time Investment | Higher | Lower |
| Quality Assurance | Maximum | Standard |
| Best For | Complex tasks | Simple tasks |

## Tips

- When in doubt, let the AI decide automatically
- You can always switch workflows during development
- Complex tasks benefit from spec workflow structure
- Simple tasks are faster with no-spec workflow
- All workflows maintain code quality standards