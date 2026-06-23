# -*- coding: utf-8 -*-
"""
三层解析器框架
1. 站点定制解析器（最高优先级）
2. 结构化提取（表格/列表）
3. 语义提取（关键词+正则）
"""

import re
import logging
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime

logger = logging.getLogger(__name__)

# 通用字段映射：表格表头 -> 标准字段名
FIELD_MAP = {
    "岗位名称": "title",
    "职位名称": "title",
    "岗位": "title",
    "职位": "title",
    "标题": "title",
    "名称": "title",
    "招聘岗位": "title",
    "岗位名称/方向": "title",
    "工作地点": "location",
    "地点": "location",
    "工作城市": "location",
    "所在地": "location",
    "城市": "location",
    "学历要求": "education",
    "学历": "education",
    "学位": "education",
    "专业要求": "major",
    "专业": "major",
    "专业方向": "major",
    "需求专业": "major",
    "招聘人数": "headcount",
    "人数": "headcount",
    "人数/名额": "headcount",
    "薪资": "salary",
    "薪资待遇": "salary",
    "工资": "salary",
    "薪酬": "salary",
    "发布日期": "publish_date",
    "日期": "publish_date",
    "发布时间": "publish_date",
    "截止日期": "deadline",
    "报名截止": "deadline",
    "截止时间": "deadline",
    "链接": "url",
    "详情链接": "url",
    "来源": "source",
    "单位": "source",
    "单位名称": "source",
    "公司名称": "source",
    "招聘单位": "source",
    "类别": "category_field",
    "岗位类别": "category_field",
    "类型": "category_field",
}

# 标题提取正则模式
TITLE_PATTERNS = [
    r'(?:招聘|招|诚聘|急聘)\s*[：:]?\s*(.+)',
    r'(\d+\s*[、.]\s*.+?)(?:\s*\d)',  # 编号列表
    r'(?:岗位|职位|位置)\s*[：:]\s*(.+)',
    r'<a[^>]*>([^<]+)</a>',  # 链接文本
]

# 日期提取模式
DATE_PATTERNS = [
    (r'(\d{4})[年/\-.](\d{1,2})[月/\-.](\d{1,2})[日号]?', '%Y-%m-%d'),
    (r'(\d{4})-(\d{2})-(\d{2})', '%Y-%m-%d'),
    (r'(\d{4})/(\d{2})/(\d{2})', '%Y-%m-%d'),
    (r'(\d{4})年(\d{1,2})月(\d{1,2})日', '%Y-%m-%d'),
]


def create_config(site_parsers=None):
    """创建解析器配置"""
    return {
        "site_parsers": site_parsers or {},
        "field_map": FIELD_MAP,
        "title_patterns": TITLE_PATTERNS,
        "date_patterns": DATE_PATTERNS,
    }


def extract_date(text):
    """从文本中提取日期"""
    if not text:
        return ""
    text = str(text).strip()
    for pattern, fmt in DATE_PATTERNS:
        m = re.search(pattern, text)
        if m:
            try:
                groups = m.groups()
                if fmt == '%Y-%m-%d':
                    return f"{groups[0]}-{int(groups[1]):02d}-{int(groups[2]):02d}"
            except:
                continue
    return ""


def clean_title(title):
    """清理标题文本"""
    if not title:
        return ""
    # 移除常见前缀
    title = re.sub(r'^\d+[\s、.\-]+', '', title)
    title = re.sub(r'^【[^】]+】\s*', '', title)
    title = re.sub(r'^\[[^\]]+\]\s*', '', title)
    # 移除多余空白
    title = re.sub(r'\s+', ' ', title).strip()
    return title


def parse_site_specific(html, source_name, url, category, config):
    """站点定制解析器"""
    site_parsers = config.get("site_parsers", {})

    # 匹配域名到解析器
    for domain, parser_func in site_parsers.items():
        if domain in url:
            try:
                items = parser_func(html, source_name, url, category, config)
                if items:
                    logger.info(f"[站点定制] {domain}: 提取 {len(items)} 条")
                    return items
            except Exception as e:
                logger.warning(f"[站点定制] {domain} 解析错误: {e}")

    return []


def parse_structured(html, source_name, url, category, config):
    """结构化提取 - 解析HTML表格和列表"""
    soup = BeautifulSoup(html, "lxml")
    items = []
    field_map = config.get("field_map", FIELD_MAP)

    # 尝试解析表格
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue

        # 提取表头
        header_row = rows[0]
        headers = []
        for th in header_row.find_all(["th", "td"]):
            text = th.get_text(strip=True)
            mapped = field_map.get(text, text)
            headers.append(mapped)

        if not headers:
            continue

        # 解析数据行
        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue

            item = {
                "source": source_name,
                "url": url,
                "category": category,
                "status": "active",
            }

            for i, cell in enumerate(cells):
                if i < len(headers):
                    field = headers[i]
                    value = cell.get_text(strip=True)
                    # 处理链接
                    a_tag = cell.find("a")
                    if a_tag and a_tag.get("href"):
                        if field == "url":
                            value = urljoin(url, a_tag["href"])
                        elif field == "title" and not item.get("url"):
                            item["url"] = urljoin(url, a_tag["href"])
                    item[field] = value

            # 确保关键字段
            title = item.get("title", "")
            if title and len(title) > 2:
                item["title"] = clean_title(title)
                items.append(item)

    if items:
        logger.info(f"[结构化] {url}: 表格提取 {len(items)} 条")

    # 如果没有表格，尝试列表项
    if not items:
        items = _parse_list_items(soup, source_name, url, category)
        if items:
            logger.info(f"[结构化] {url}: 列表提取 {len(items)} 条")

    return items


def _parse_list_items(soup, source_name, url, category):
    """解析列表项（非表格结构）"""
    items = []

    # 查找常见的列表容器
    list_selectors = [
        ".job-list li", ".job-item", ".position-item",
        ".recruit-list li", ".news-list li",
        "ul.list li", ".list-group-item",
        ".job-card", ".position-card",
        "article", ".post-item",
    ]

    for selector in list_selectors:
        elements = soup.select(selector)
        if not elements:
            continue

        for el in elements:
            title = ""
            link = ""

            # 尝试从链接获取标题
            a_tag = el.find("a")
            if a_tag:
                title = a_tag.get_text(strip=True)
                link = urljoin(url, a_tag.get("href", ""))

            # 尝试从标题元素获取
            if not title:
                h_tag = el.find(["h2", "h3", "h4", "h5"])
                if h_tag:
                    title = h_tag.get_text(strip=True)

            # 尝试从class获取
            if not title:
                for cls in [".title", ".name", ".job-title", ".position-name"]:
                    t = el.select_one(cls)
                    if t:
                        title = t.get_text(strip=True)
                        break

            if title and len(title) > 2:
                items.append({
                    "source": source_name,
                    "title": clean_title(title),
                    "url": link or url,
                    "category": category,
                    "status": "active",
                })

        if items:
            break

    return items


def parse_semantic(html, source_name, url, category, config):
    """语义提取 - 从文本中用关键词+正则提取"""
    soup = BeautifulSoup(html, "lxml")

    # 移除无用标签
    for tag in soup.find_all(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    items = []
    title_patterns = config.get("title_patterns", TITLE_PATTERNS)

    for line in lines:
        # 尝试匹配标题模式
        for pattern in title_patterns:
            m = re.search(pattern, line, re.IGNORECASE)
            if m:
                title = m.group(1).strip()
                if title and len(title) > 4 and len(title) < 100:
                    items.append({
                        "source": source_name,
                        "title": clean_title(title),
                        "url": url,
                        "category": category,
                        "status": "active",
                    })
                    break

    if items:
        logger.info(f"[语义] {url}: 提取 {len(items)} 条")
    return items


def parse_items(html, source_name, url, category, config=None):
    """
    三层解析入口
    按优先级级联：站点定制 -> 结构化 -> 语义
    """
    if config is None:
        config = create_config()

    if not html or len(html) < 200:
        return []

    # 第1层：站点定制解析器
    items = parse_site_specific(html, source_name, url, category, config)
    if items:
        return items

    # 第2层：结构化提取
    items = parse_structured(html, source_name, url, category, config)
    if items:
        return items

    # 第3层：语义提取
    items = parse_semantic(html, source_name, url, category, config)
    return items
