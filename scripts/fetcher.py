# -*- coding: utf-8 -*-
"""
双模式页面抓取器 - requests + Playwright
自动检测是否需要JS渲染，智能回退
"""

import requests
import re
import time
import logging

logger = logging.getLogger(__name__)

# JS框架检测标记
JS_FRAMEWORK_MARKERS = [
    "__NEXT_DATA__",
    "data-reactroot",
    'id="root"',
    'id="app"',
    "ng-version",
    "vue",
    "React",
    "Angular",
    "window.__NUXT__",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

_playwright_browser = None


def _get_playwright_browser():
    """懒加载Playwright浏览器"""
    global _playwright_browser
    if _playwright_browser is None:
        try:
            from playwright.sync_api import sync_playwright
            pw = sync_playwright().start()
            _playwright_browser = pw.chromium.launch(headless=True)
            logger.info("Playwright Chromium 浏览器已启动")
        except Exception as e:
            logger.warning(f"Playwright 启动失败: {e}")
            return None
    return _playwright_browser


def _needs_js_rendering(html):
    """检测页面是否需要JS渲染"""
    if not html or len(html) < 2000:
        return True

    # 去除script/style后检查内容量
    clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)
    if len(clean.strip()) < 1000:
        return True

    # 检查JS框架标记
    for marker in JS_FRAMEWORK_MARKERS:
        if marker in html:
            return True

    return False


def fetch_with_requests(url, timeout=15):
    """使用requests获取静态页面"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=False, allow_redirects=True)
        resp.encoding = resp.apparent_encoding or 'utf-8'
        if resp.status_code == 200 and len(resp.text) > 100:
            return resp.text, 'requests'
        return None, 'failed'
    except Exception as e:
        logger.debug(f"requests 获取失败 {url}: {e}")
        return None, 'failed'


def fetch_with_playwright(url, timeout=20):
    """使用Playwright获取JS渲染页面"""
    browser = _get_playwright_browser()
    if browser is None:
        return None, 'failed'

    try:
        context = browser.new_context(
            user_agent=HEADERS["User-Agent"],
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle", timeout=timeout * 1000)
        time.sleep(2)  # 额外等待动态内容加载
        html = page.content()
        context.close()
        if html and len(html) > 100:
            return html, 'playwright'
        return None, 'failed'
    except Exception as e:
        logger.warning(f"Playwright 获取失败 {url}: {e}")
        return None, 'failed'


def fetch_page(url, force_browser=False, timeout=15):
    """
    智能页面抓取 - 自动选择模式
    返回: (html, mode) mode为 'requests'|'playwright'|'failed'
    """
    if not force_browser:
        html, mode = fetch_with_requests(url, timeout)
        if mode == 'requests':
            # 检查是否需要JS渲染
            if not _needs_js_rendering(html):
                logger.info(f"[requests] {url} ({len(html)} bytes)")
                return html, 'requests'
            logger.info(f"[requests] 内容不足，尝试Playwright: {url}")

    # 使用Playwright
    html, mode = fetch_with_playwright(url, timeout=timeout + 5)
    if mode == 'playwright':
        logger.info(f"[playwright] {url} ({len(html)} bytes)")
    else:
        logger.warning(f"[FAILED] {url}")
    return html, mode


def fetch_page_with_retry(url, max_retries=2, force_browser=False):
    """带重试的页面抓取"""
    for attempt in range(max_retries + 1):
        html, mode = fetch_page(url, force_browser=force_browser)
        if mode != 'failed':
            return html, mode
        if attempt < max_retries:
            time.sleep(3)
    return None, 'failed'


def cleanup():
    """清理资源"""
    global _playwright_browser
    if _playwright_browser is not None:
        try:
            _playwright_browser.close()
        except:
            pass
        _playwright_browser = None
