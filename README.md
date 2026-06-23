# 高分子材料硕士招聘信息自动收集系统

自动从多个数据源采集高分子材料相关硕士/博士招聘信息，支持增量去重、智能推荐和自动推送到 Gitee。

## 功能

- 多源采集：高校就业网、研究机构、企业招聘页
- 三层解析：站点定制 → 结构化提取 → 语义提取
- 智能过滤：关键词匹配、排除噪声职位
- 增量去重：基于历史记录，避免重复采集
- 推荐报告：按相关度评分，生成推荐清单
- Gitee 推送：自动将结果推送到远程仓库

## 使用

```bash
# 安装依赖
pip install -r requirements.txt
playwright install chromium

# 运行采集
python3 cloud_scheduler.py

# 配置 Gitee 推送（可选）
export GITEE_REPO=https://gitee.com/username/repo
export GITEE_PAT=your_personal_access_token
python3 cloud_scheduler.py
```

## 输出文件

| 文件 | 说明 |
|------|------|
| `recruitment_YYYYMMDD_v6.csv` | 招聘信息 CSV 数据 |
| `recommendation_YYYYMMDD_v6.txt` | 推荐报告 |
| `history_v6.json` | 历史去重记录 |

## 项目结构

```
polymer-job-hunter/
├── cloud_scheduler.py      # 主调度脚本
├── targets.py              # 目标数据源配置
├── requirements.txt        # Python 依赖
├── README.md
└── scripts/
    ├── fetcher.py          # 双模式页面抓取器
    ├── parser_framework.py # 三层解析器框架
    ├── recommender.py      # 推荐引擎
    └── gitee_pusher.py     # Gitee 推送模块
```
