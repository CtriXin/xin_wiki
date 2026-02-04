#!/bin/bash

# 定义需要同步的工具名称
TOOLS=("gemini" "claude" "opencode" "codex")
SOURCE=".claude-skill.md"
SKILL_DIR_NAME="knowledge-wiki"
SKILL_FILENAME="SKILL.md"

echo "🚀 开始全局同步 Skill 指南 (规范化格式)..."

# 检查源文件
if [ ! -f "$SOURCE" ]; then
    echo "❌ 错误: 找不到源文件 $SOURCE"
    exit 1
fi

for tool in "${TOOLS[@]}"; do
    # 构造标准路径: ~/.tool/skills/skill-name/SKILL.md
    TARGET_PATH="$HOME/.$tool/skills/$SKILL_DIR_NAME"
    
    # 自动创建规范化的目录结构
    if [ ! -d "$TARGET_PATH" ]; then
        echo "📂 正在创建规范化目录: $TARGET_PATH"
        mkdir -p "$TARGET_PATH"
    fi
    
    # 复制并更名为 SKILL.md
    cp "$SOURCE" "$TARGET_PATH/$SKILL_FILENAME"
    echo "✅ 已同步至: $TARGET_PATH/$SKILL_FILENAME"
done

# 同时同步本地项目内的规范化结构
for tool in "${TOOLS[@]}"; do
    LOCAL_PATH=".$tool/skills/$SKILL_DIR_NAME"
    mkdir -p "$LOCAL_PATH"
    cp "$SOURCE" "$LOCAL_PATH/$SKILL_FILENAME"
done

# 清理旧的非规范文件 (如果有)
for tool in "${TOOLS[@]}"; do
    rm -f "$HOME/.$tool/skills/knowledge-wiki.md"
    rm -f ".$tool/skills/knowledge-wiki.md"
done

echo "🎉 同步完成！符合规范的 Skill 结构已就绪。"
