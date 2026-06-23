# -*- coding: utf-8 -*-
"""
高分子材料硕士招聘信息自动收集 - 云端调度脚本

功能：
1. 从多源网站爬取高分子材料相关招聘信息
2. 三层解析（站点定制 -> 结构化 -> 语义）
3. 关键词过滤 + 增量去重
4. 生成 CSV 数据文件和推荐报告
5. 自动推送到 Gitee 仓库

使用：
    python3 cloud_scheduler.py

环境变量：
    GITEE_REPO: Gitee仓库地址（可选）
    GITEE_PAT: Gitee个人访问令牌（可选）
"""

import os
import sys
import csv
import json
import time
import logging
from datetime import datetime

# 添加项目路径
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_DIR)
sys.path.insert(0, os.path.join(PROJECT_DIR, "scripts"))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# 设置环境变量
os.environ["TODAY"] = datetime.now().strftime("%Y%m%d")

# 导入模块
from targets import TARGETS, MAJOR_KEYWORDS, EDUCATION_KEYWORDS
from scripts.fetcher import fetch_page_with_retry, cleanup
from scripts.parser_framework import parse_items, create_config
from scripts.recommender import (
    load_history, save_history, is_duplicate,
    add_to_history, filter_items, generate_recommendations,
)
from scripts.gitee_pusher import push_to_gitee


def write_csv(items, filepath):
    """写入CSV文件"""
    if not items:
        logger.warning("没有数据可写入CSV")
        return

    fieldnames = [
        "序号", "来源", "岗位名称", "学历要求", "专业要求",
        "工作地点", "发布日期", "截止日期", "薪资", "招聘人数",
        "相关度", "原文链接", "招聘状态", "采集时间",
    ]

    os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else ".", exist_ok=True)

    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, item in enumerate(items, 1):
            writer.writerow({
                "序号": i,
                "来源": item.get("source", ""),
                "岗位名称": item.get("title", ""),
                "学历要求": item.get("education", ""),
                "专业要求": item.get("major", ""),
                "工作地点": item.get("location", ""),
                "发布日期": item.get("publish_date", ""),
                "截止日期": item.get("deadline", ""),
                "薪资": item.get("salary", ""),
                "招聘人数": item.get("headcount", ""),
                "相关度": item.get("relevance_score", 0),
                "原文链接": item.get("url", ""),
                "招聘状态": item.get("status", "active"),
                "采集时间": datetime.now().strftime("%Y-%m-%d %H:%M"),
            })

    logger.info(f"CSV 已保存: {filepath} ({len(items)} 条)")


def main():
    """主调度流程"""
    start_time = time.time()
    today = datetime.now().strftime("%Y%m%d")
    version = "v6"

    logger.info("=" * 60)
    logger.info("  高分子材料硕士招聘信息自动收集系统")
    logger.info(f"  版本: {version} | 日期: {today}")
    logger.info("=" * 60)

    # 输出文件路径
    csv_file = os.path.join(PROJECT_DIR, f"recruitment_{today}_{version}.csv")
    txt_file = os.path.join(PROJECT_DIR, f"recommendation_{today}_{version}.txt")
    history_file = os.path.join(PROJECT_DIR, f"history_{version}.json")

    # 加载历史
    history = load_history(history_file)
    logger.info(f"历史记录: {len(history.get('seen_keys', []))} 条已见条目")

    # 创建解析器配置
    config = create_config()

    # 收集所有数据
    all_items = []
    total_targets = len(TARGETS)
    success_count = 0
    fail_count = 0

    for idx, target in enumerate(TARGETS, 1):
        name = target["name"]
        urls = target.get("urls", [])
        category = target.get("category", "other")
        keywords = target.get("keywords", [])

        logger.info(f"[{idx}/{total_targets}] 采集: {name} ({len(urls)} 个URL)")

        target_items = []
        for url in urls:
            try:
                html, mode = fetch_page_with_retry(url, max_retries=1)
                if mode == "failed" or not html:
                    logger.warning(f"  ⚠ 获取失败: {url}")
                    fail_count += 1
                    continue

                items = parse_items(html, name, url, category, config)
                logger.info(f"  ✓ [{mode}] 提取 {len(items)} 条")
                target_items.extend(items)

            except Exception as e:
                logger.error(f"  ✗ 错误: {e}")
                fail_count += 1

        if target_items:
            success_count += 1
            all_items.extend(target_items)
        else:
            fail_count += 1

        # 礼貌延迟
        time.sleep(1)

    logger.info(f"原始数据: 共 {len(all_items)} 条 (来自 {success_count} 个源)")

    # 过滤
    filtered = filter_items(all_items, config)
    logger.info(f"过滤后: {len(filtered)} 条")

    # 去重
    new_items = []
    for item in filtered:
        if not is_duplicate(item, history):
            new_items.append(item)
            add_to_history(item, history)

    logger.info(f"新增: {len(new_items)} 条 (去重过滤 {len(filtered) - len(new_items)} 条)")

    # 保存历史
    save_history(history_file, history)
    logger.info(f"历史记录已更新: {history_file}")

    # 如果有新数据，写入文件
    if new_items:
        write_csv(new_items, csv_file)

        # 生成推荐报告
        report = generate_recommendations(new_items)
        with open(txt_file, "w", encoding="utf-8") as f:
            f.write(report)
        logger.info(f"推荐报告已保存: {txt_file}")

        # 推送到 Gitee
        logger.info("准备推送到 Gitee...")
        data_files = [
            os.path.basename(csv_file),
            os.path.basename(txt_file),
            os.path.basename(history_file),
        ]
        push_result = push_to_gitee(PROJECT_DIR, data_files=data_files)
        if push_result:
            logger.info("✅ Gitee 推送成功")
        else:
            logger.info("ℹ️ Gitee 推送未执行（未配置环境变量或推送失败）")
    else:
        logger.info("本次运行未发现新的招聘信息")

        # 即使没有新数据也生成空报告
        report = generate_recommendations([])
        with open(txt_file, "w", encoding="utf-8") as f:
            f.write(report)

        # 写入空CSV（保持文件格式一致）
        write_csv([], csv_file)

    # 清理
    cleanup()

    # 统计
    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info(f"  运行完成 | 耗时: {elapsed:.1f}s")
    logger.info(f"  成功源: {success_count}/{total_targets}")
    logger.info(f"  新增条目: {len(new_items)}")
    logger.info(f"  输出文件:")
    logger.info(f"    - {csv_file}")
    logger.info(f"    - {txt_file}")
    logger.info(f"    - {history_file}")
    logger.info("=" * 60)

    return new_items


if __name__ == "__main__":
    main()
