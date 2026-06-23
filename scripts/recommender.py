# -*- coding: utf-8 -*-
"""
招聘信息推荐引擎
基于关键词匹配和评分，生成个性化推荐
"""

import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def load_history(history_path):
    """加载历史记录"""
    if os.path.exists(history_path):
        try:
            with open(history_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"items": [], "last_run": ""}
    return {"items": [], "last_run": ""}


def save_history(history_path, history):
    """保存历史记录"""
    os.makedirs(os.path.dirname(history_path), exist_ok=True)
    with open(history_path, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def is_duplicate(item, history):
    """检查是否重复"""
    key = f"{item.get('title', '')}|{item.get('source', '')}|{item.get('publish_date', '')}"
    return key in history.get("seen_keys", set())


def add_to_history(item, history):
    """添加到历史记录"""
    key = f"{item.get('title', '')}|{item.get('source', '')}|{item.get('publish_date', '')}"
    if "seen_keys" not in history:
        history["seen_keys"] = []
    if key not in history["seen_keys"]:
        history["seen_keys"].append(key)
    # 保留最近1000条key
    if len(history["seen_keys"]) > 1000:
        history["seen_keys"] = history["seen_keys"][-1000:]
    history["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def filter_items(items, config):
    """
    多维度过滤
    1. 排除不相关职位
    2. 学历/专业/地区关键词匹配
    3. 标题清理
    """
    from targets import EXCLUDE_TITLE_KEYWORDS, EDUCATION_KEYWORDS, MAJOR_KEYWORDS, REGION_KEYWORDS

    filtered = []
    for item in items:
        title = item.get("title", "")
        description = item.get("description", item.get("major", ""))

        # 排除不相关职位
        exclude = False
        for kw in EXCLUDE_TITLE_KEYWORDS:
            if kw in title:
                exclude = True
                break
        if exclude:
            continue

        # 标题太短或太长
        if len(title) < 4 or len(title) > 200:
            continue

        # 计算相关度分数
        score = 0
        text = f"{title} {description}".lower()

        for kw in MAJOR_KEYWORDS:
            if kw.lower() in text:
                score += 3

        for kw in EDUCATION_KEYWORDS:
            if kw in title or kw in description:
                score += 2

        location = item.get("location", "")
        for kw in REGION_KEYWORDS:
            if kw in location:
                score += 1

        item["relevance_score"] = score
        filtered.append(item)

    # 按相关度排序
    filtered.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return filtered


def generate_recommendations(items, top_n=20):
    """生成推荐报告"""
    if not items:
        return "本次运行未发现新的招聘信息。"

    today = datetime.now().strftime("%Y年%m月%d日")
    lines = [
        f"{'='*60}",
        f"  高分子材料硕士招聘信息推荐报告",
        f"  生成时间: {today}",
        f"  共发现 {len(items)} 条相关招聘信息",
        f"{'='*60}",
        "",
    ]

    # 按相关度分组
    high_score = [i for i in items if i.get("relevance_score", 0) >= 8]
    medium_score = [i for i in items if 4 <= i.get("relevance_score", 0) < 8]
    low_score = [i for i in items if i.get("relevance_score", 0) < 4]

    if high_score:
        lines.append(f"{'─'*60}")
        lines.append(f"  ★★★ 高度推荐 ({len(high_score)} 条) - 与高分子材料高度匹配")
        lines.append(f"{'─'*60}")
        for i, item in enumerate(high_score[:10], 1):
            lines.append(f"  {i}. [{item.get('source', '未知')}] {item.get('title', '无标题')}")
            if item.get('location'):
                lines.append(f"     地点: {item['location']}")
            if item.get('education'):
                lines.append(f"     学历: {item['education']}")
            if item.get('url') and item['url'] != 'https://':
                lines.append(f"     链接: {item['url']}")
            lines.append("")

    if medium_score:
        lines.append(f"{'─'*60}")
        lines.append(f"  ★★ 一般推荐 ({len(medium_score)} 条) - 可能相关")
        lines.append(f"{'─'*60}")
        for i, item in enumerate(medium_score[:10], 1):
            lines.append(f"  {i}. [{item.get('source', '未知')}] {item.get('title', '无标题')}")
            if item.get('location'):
                lines.append(f"     地点: {item['location']}")
            lines.append("")

    if low_score:
        lines.append(f"{'─'*60}")
        lines.append(f"  ★ 参考 ({len(low_score)} 条) - 低相关度")
        lines.append(f"{'─'*60}")
        for i, item in enumerate(low_score[:5], 1):
            lines.append(f"  {i}. [{item.get('source', '未知')}] {item.get('title', '无标题')}")

    lines.append("")
    lines.append(f"{'='*60}")
    lines.append(f"  报告结束 | 数据来源: 多源自动采集")
    lines.append(f"{'='*60}")

    return "\n".join(lines)
