# CloudBase Commands Directory

This directory contains CloudBase AI Toolkit commands that can be used across different AI IDEs.

## Command Structure

- `spec.md` - Force complete spec workflow
- `no-spec.md` - Skip spec workflow, execute directly
- `workflow-help.md` - Show workflow command help

## Usage

### In Claude Code
These commands are available as project commands and will appear in `/help`.

### In Other IDEs
Use alternative trigger words:
- `@spec` instead of `/spec`
- `@no-spec` instead of `/no_spec`
- `@workflow-help` instead of `/help`

## Command Reference

### Spec Workflow
Forces complete software engineering process:
1. Requirements clarification
2. Requirements document (requirements.md)
3. Technical design (design.md)
4. Task breakdown (tasks.md)
5. Execution with status updates

### No-Spec Workflow
Direct execution without documentation:
1. Analyze task requirements
2. Create execution plan
3. Execute directly
4. Maintain code quality

### Workflow Help
Shows available commands and usage examples.