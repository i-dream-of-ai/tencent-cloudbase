# Spec Workflow Command

**Description:** Force complete spec workflow for structured software engineering

## Usage

### Claude Code
```bash
/spec
```

### Other IDEs
```bash
@spec
```

## What This Command Does

When you use this command, the AI will follow a complete software engineering process:

1. **Requirements Clarification** - Understand and confirm the problem
2. **Requirements Document** - Create `specs/spec_name/requirements.md` using EARS syntax
3. **Technical Design** - Create `specs/spec_name/design.md` with architecture and technical decisions
4. **Task Breakdown** - Create `specs/spec_name/tasks.md` with detailed implementation plan
5. **Execution** - Implement tasks with status updates and confirmations

## When to Use

- New feature development
- Complex architecture design
- Multi-module integration
- Database design projects
- UI/UX design projects
- Third-party service integration

## Example

```
/spec 开发一个用户管理系统
```

The AI will respond with:
```
🎯 Workflow 模式：Spec 流程

📋 判断依据：用户明确指定使用 /spec 命令
🔄 后续流程：将按照标准软件工程方式执行
  1. 需求澄清和确认
  2. 需求文档设计（requirements.md）
  3. 技术方案设计（design.md）
  4. 任务拆分（tasks.md）
  5. 执行任务并更新状态

✅ 确认：我将开始需求澄清阶段，请确认是否继续？
```

## Output Structure

The command generates structured documentation:

```
specs/
└── your-project-name/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

Each file follows standardized templates for consistency and quality assurance.