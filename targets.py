# -*- coding: utf-8 -*-
"""
高分子材料硕士招聘信息 - 目标配置
定义数据源、关键词和过滤规则
"""

TARGETS = [
    # ===== 高校就业中心 =====
    {
        "name": "华东理工大学就业信息网",
        "category": "university",
        "region": "上海",
        "urls": ["https://career.ecust.edu.cn"],
        "keywords": ["高分子", "材料", "化学", "化工"],
    },
    {
        "name": "浙江大学就业指导中心",
        "category": "university",
        "region": "浙江",
        "urls": ["https://www.career.zju.edu.cn"],
        "keywords": ["高分子", "材料", "化学"],
    },
    {
        "name": "四川大学就业信息网",
        "category": "university",
        "region": "四川",
        "urls": ["https://jy.scu.edu.cn"],
        "keywords": ["高分子", "材料", "化学"],
    },
    {
        "name": "北京化工大学就业网",
        "category": "university",
        "region": "北京",
        "urls": ["https://job.buct.edu.cn"],
        "keywords": ["高分子", "材料", "化学", "化工"],
    },
    {
        "name": "东华大学就业网",
        "category": "university",
        "region": "上海",
        "urls": ["https://job.dhu.edu.cn"],
        "keywords": ["高分子", "材料", "化学"],
    },
    # ===== 研究机构 =====
    {
        "name": "中国科学院",
        "category": "institute",
        "region": "北京",
        "urls": ["http://www.cas.cn/rcdw/rcjy/"],
        "keywords": ["高分子", "材料", "化学"],
    },
    # ===== 企业招聘 =====
    {
        "name": "万华化学",
        "category": "enterprise",
        "region": "山东",
        "urls": ["https://www.whchem.com/column/16/"],
        "keywords": ["高分子", "材料", "化学", "研发"],
    },
    {
        "name": "金发科技",
        "category": "enterprise",
        "region": "广东",
        "urls": ["https://www.kingfa.com.cn/About/Jobs"],
        "keywords": ["高分子", "材料", "研发", "工程师"],
    },
    {
        "name": "恒力石化",
        "category": "enterprise",
        "region": "江苏",
        "urls": ["https://www.hengli.com/hr/"],
        "keywords": ["高分子", "材料", "化学", "化工"],
    },
    {
        "name": "荣盛石化",
        "category": "enterprise",
        "region": "浙江",
        "urls": ["https://www.rongsheng.com/hr/"],
        "keywords": ["高分子", "材料", "化学"],
    },
]

# ===== 过滤配置 =====
EDUCATION_KEYWORDS = ["硕士", "研究生", "硕士及以上", "博士", "本科及以上", "硕博"]
MAJOR_KEYWORDS = [
    "高分子", "材料", "化学", "化工", "高分子材料", "材料科学",
    "材料工程", "化学工程", "应用化学", "有机化学", "聚合物",
    "polymer", "material", "chemistry", "chemical",
]
REGION_KEYWORDS = [
    "上海", "北京", "江苏", "浙江", "广东", "山东", "四川",
    "苏州", "杭州", "宁波", "南京", "深圳", "广州", "成都",
    "长三角", "珠三角",
]
EXCLUDE_TITLE_KEYWORDS = [
    "销售", "行政", "前台", "财务", "会计", "司机", "保安",
    "保洁", "服务员", "快递", "外卖", "客服", "文员",
    "IT运维", "软件测试", "Java开发", "前端开发", "后端开发",
    "成功", "举办", "公示", "通知", "会议", "培训", "讲座",
    "报名", "考试", "竞赛", "奖学金",
]
