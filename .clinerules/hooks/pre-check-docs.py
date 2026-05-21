#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文档同步预检查 —— 功能收尾时校验文档体系是否齐全、交叉引用是否可解析。

用法：
    python .clinerules/hooks/pre-check-docs.py

可选（会执行 git add/commit，请仅在确认后使用）：
    python .clinerules/hooks/pre-check-docs.py --commit --desc "文档同步"

项目：闲鱼自动化助手 (xianyu_master)
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

if sys.stdout.encoding != "utf-8" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DOCS_TO_CHECK = [
    "docs/README.md",
    "docs/产品需求文档-PRD.md",
    "docs/技术方案设计.md",
    "docs/开发路线.md",
    "docs/已完成阶段详细清单与更新日志.md",
    "docs/经验教训汇总.md",
    "docs/技术栈.md",
    "docs/功能规格说明.md",
    "测试脚本与问题记录/问题记录与修复日志.md",
]

CROSS_REFERENCES: dict[str, list[str]] = {
    "docs/README.md": [
        "docs/产品需求文档-PRD.md",
        "docs/技术方案设计.md",
        "docs/开发路线.md",
        "docs/经验教训汇总.md",
        "docs/技术栈.md",
        "docs/已完成阶段详细清单与更新日志.md",
        "docs/功能规格说明.md",
        "测试脚本与问题记录/问题记录与修复日志.md",
        "测试脚本与问题记录/归档/",
    ],
    "docs/开发路线.md": [
        "docs/已完成阶段详细清单与更新日志.md",
    ],
}

DOC_HEADER_MARKERS: dict[str, str] = {
    "docs/README.md": "闲鱼自动化助手",
    "docs/产品需求文档-PRD.md": "产品需求文档",
    "docs/技术方案设计.md": "技术方案设计",
    "docs/经验教训汇总.md": "经验教训汇总",
    "docs/已完成阶段详细清单与更新日志.md": "已完成阶段详细清单",
    "docs/开发路线.md": "开发路线",
    "docs/技术栈.md": "技术栈",
    "docs/功能规格说明.md": "功能规格说明",
    "测试脚本与问题记录/问题记录与修复日志.md": "问题记录与修复日志",
}


def check_file_exists(filepath: str) -> bool:
    return (PROJECT_ROOT / filepath).exists()


def check_cross_reference(source: str, target: str) -> bool:
    source_path = PROJECT_ROOT / source
    if not source_path.exists():
        return True
    if target.endswith("/"):
        return True
    content = source_path.read_text(encoding="utf-8")
    target_name = Path(target).stem
    link_pattern = re.compile(r"\[" + re.escape(target_name) + r"\]\([^)]+\)")
    if not link_pattern.search(content):
        print(f"  [!] {source} 缺少指向 {target} 的 Markdown 链接（链接文字须为 [{target_name}](...)）")
        return False
    return True


def check_version_consistency() -> bool:
    # 与「版本[：:]」语义一致，并兼容 Markdown 加粗及「文档版本」「文档体系版本」等字段；排除「对应版本」
    version_pattern = re.compile(
        r"(?<!对应)(?:文档体系)?(?:文档)?版本\D*?[：:]\s*v?(\d+\.\d+(?:\.\d+)?)"
    )
    versions: dict[str, str] = {}
    for doc_path in DOCS_TO_CHECK:
        full_path = PROJECT_ROOT / doc_path
        if not full_path.exists():
            continue
        content = full_path.read_text(encoding="utf-8")
        match = version_pattern.search(content)
        if match:
            versions[doc_path] = match.group(1)
    if not versions:
        print("  [i] 未找到可解析的版本字段，跳过一致性检查")
        return True
    unique = set(versions.values())
    if len(unique) > 1:
        print("  [!] 文档体系版本不一致：")
        for doc, ver in versions.items():
            print(f"      {doc}: v{ver}")
        return False
    print(f"  [OK] 文档体系版本一致: v{next(iter(unique))}")
    return True


def git_check_changed_docs() -> list[tuple[str, str]]:
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    changed: list[tuple[str, str]] = []
    for line in result.stdout.strip().split("\n"):
        if not line.strip():
            continue
        parts = line.strip().split(None, 1)
        if len(parts) != 2:
            continue
        status, filepath = parts
        if filepath.startswith("docs/") or filepath.startswith("测试脚本与问题记录/"):
            changed.append((status, filepath))
    return changed


def git_auto_commit(description: str) -> bool:
    print("\n--- Git 自动提交 ---")
    changed_docs = git_check_changed_docs()
    if not changed_docs:
        print("  [?] 未检测到文档变更，跳过提交")
        return True
    print("  [i] 检测到以下文件变更：")
    status_map = {"M": "修改", "A": "新增", "D": "删除", "??": "未跟踪"}
    for status, filepath in changed_docs:
        print(f"      {status_map.get(status, status)}: {filepath}")
    commit_msg = f"docs: {description}"
    print(f"\n  提交信息：{commit_msg}")
    try:
        paths = sorted({fp for _, fp in changed_docs})
        subprocess.run(
            ["git", "add", "--", *paths],
            cwd=PROJECT_ROOT,
            check=True,
            capture_output=True,
        )
        result = subprocess.run(
            ["git", "commit", "-m", commit_msg],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            print("  [OK] 提交成功")
            if result.stdout.strip():
                print(f"       {result.stdout.strip()}")
            return True
        stderr = (result.stderr or "").strip()
        if "nothing to commit" in stderr or "no changes" in stderr:
            print("  [?] 没有需要提交的变更")
            return True
        print(f"  [!] 提交失败：{stderr[:300]}")
        return False
    except subprocess.CalledProcessError as e:
        print(f"  [!] Git 命令失败：{e}")
        return False
    except FileNotFoundError:
        print("  [!] 未检测到 git 命令，跳过自动提交")
        return False


def run_checks() -> bool:
    all_pass = True

    print("\n[1/4] 文档文件存在性检查")
    for doc in DOCS_TO_CHECK:
        if check_file_exists(doc):
            print(f"  [OK] {doc}")
        else:
            print(f"  [!] {doc} 不存在！")
            all_pass = False

    print("\n[2/4] 文档头标记检查")
    for doc_path, marker in DOC_HEADER_MARKERS.items():
        full_path = PROJECT_ROOT / doc_path
        if not full_path.exists():
            continue
        content = full_path.read_text(encoding="utf-8")
        if marker in content:
            print(f"  [OK] {doc_path}")
        else:
            print(f"  [!] {doc_path} 未找到预期标记：{marker}")
            all_pass = False

    print("\n[3/4] 交叉引用链接检查")
    ref_issues = False
    for source, targets in CROSS_REFERENCES.items():
        for target in targets:
            if not check_cross_reference(source, target):
                ref_issues = True
    if ref_issues:
        all_pass = False
    else:
        print("  [OK] 交叉引用链接检查通过")

    print("\n[4/4] 文档体系版本一致性")
    if not check_version_consistency():
        all_pass = False

    return all_pass


def main() -> int:
    should_commit = "--commit" in sys.argv
    commit_desc = "文档同步与整理"
    for i, arg in enumerate(sys.argv):
        if arg == "--desc" and i + 1 < len(sys.argv):
            commit_desc = sys.argv[i + 1]

    print()
    print("=" * 60)
    print("  文档同步预检查（闲鱼自动化助手）")
    print("=" * 60)

    all_pass = run_checks()

    print()
    print("=" * 60)
    if all_pass:
        print("  预检查全部通过。")
    else:
        print("  存在需要关注的问题，请根据以上提示处理。")

    if should_commit:
        if not git_auto_commit(commit_desc):
            return 1
    else:
        print("\n  [i] 如需在确认后提交文档，可执行：")
        print('      python .clinerules/hooks/pre-check-docs.py --commit --desc "提交说明"')

    print("=" * 60)
    print()
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
