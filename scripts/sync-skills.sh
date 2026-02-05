#!/bin/bash

# 定义需要同步的工具名称
TOOLS=("gemini" "claude" "opencode" "codex")
SOURCE_DIR="skills/knowledge-wiki"
SKILL_DIR_NAME="knowledge-wiki"

echo "🚀 开始全局同步 Skill 文件夹 (含模板)..."

# 检查源目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ 错误: 找不到源目录 $SOURCE_DIR"
    exit 1
fi

for tool in "${TOOLS[@]}"; do
    # 构造标准路径: ~/.tool/skills/
    TARGET_BASE="$HOME/.$tool/skills"
    
    # 自动创建基础目录
    mkdir -p "$TARGET_BASE"
    
    # 全量复制目录 (覆盖旧文件)
    cp -r "$SOURCE_DIR" "$TARGET_BASE/"
    echo "✅ 已全局同步至: $TARGET_BASE/$SKILL_DIR_NAME"
done

# 同时同步本地项目内的规范化结构
for tool in "${TOOLS[@]}"; do
    LOCAL_BASE=".$tool/skills"
    mkdir -p "$LOCAL_BASE"
    cp -r "$SOURCE_DIR" "$LOCAL_BASE/"
    echo "✅ 已项目同步至: $LOCAL_BASE/$SKILL_DIR_NAME"
done

# 清理旧的非规范文件 (如果有)
for tool in "${TOOLS[@]}"; do
    rm -f "$HOME/.$tool/skills/knowledge-wiki.md"
    rm -f ".$tool/skills/knowledge-wiki.md"
    # 清理旧的根目录单文件
    rm -f "knowledge-wiki-web/.claude-skill.md"
done

echo "🎉 同步完成！技能目录及其模板已就绪。"