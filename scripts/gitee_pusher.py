# -*- coding: utf-8 -*-
"""
Gitee 推送模块
将采集结果推送到 Gitee 远程仓库
"""

import os
import subprocess
import logging

logger = logging.getLogger(__name__)


def push_to_gitee(repo_dir, data_files=None, commit_msg=None):
    """
    推送数据文件到 Gitee 仓库

    Args:
        repo_dir: 本地仓库目录
        data_files: 要推送的文件列表（相对于repo_dir）
        commit_msg: 提交信息
    """
    gitee_repo = os.environ.get("GITEE_REPO", "")
    gitee_pat = os.environ.get("GITEE_PAT", "")

    if not gitee_repo or not gitee_pat:
        logger.warning("⚠️  GITEE_REPO 或 GITEE_PAT 未配置，跳过 Gitee 推送")
        logger.info("   配置方法:")
        logger.info("   export GITEE_REPO=https://gitee.com/username/repo")
        logger.info("   export GITEE_PAT=your_personal_access_token")
        return False

    today = os.environ.get("TODAY", "")
    if not commit_msg:
        commit_msg = f"自动更新招聘数据 {today}" if today else "自动更新招聘数据"

    try:
        # 检查是否已初始化 git
        git_dir = os.path.join(repo_dir, ".git")
        if not os.path.exists(git_dir):
            logger.info("初始化 Git 仓库...")
            subprocess.run(["git", "init"], cwd=repo_dir, capture_output=True, check=True)

        # 配置 remote
        # 将 PAT 嵌入 URL
        repo_url = gitee_repo.rstrip("/")
        if repo_url.endswith(".git"):
            repo_base = repo_url[:-4]
        else:
            repo_base = repo_url

        # 提取用户名和仓库名
        parts = repo_base.replace("https://", "").replace("http://", "").split("/")
        if len(parts) >= 2:
            username = parts[0]
            repo_name = parts[1]
            auth_url = f"https://{username}:{gitee_pat}@gitee.com/{username}/{repo_name}.git"
        else:
            auth_url = repo_url

        # 检查 remote 是否已存在
        result = subprocess.run(
            ["git", "remote", "-v"],
            cwd=repo_dir, capture_output=True, text=True
        )
        if "gitee" not in result.stdout:
            subprocess.run(
                ["git", "remote", "add", "gitee", auth_url],
                cwd=repo_dir, capture_output=True, check=True
            )
        else:
            subprocess.run(
                ["git", "remote", "set-url", "gitee", auth_url],
                cwd=repo_dir, capture_output=True, check=True
            )

        # 添加文件
        if data_files:
            for f in data_files:
                fpath = os.path.join(repo_dir, f)
                if os.path.exists(fpath):
                    subprocess.run(
                        ["git", "add", f],
                        cwd=repo_dir, capture_output=True, check=True
                    )
        else:
            subprocess.run(
                ["git", "add", "-A"],
                cwd=repo_dir, capture_output=True, check=True
            )

        # 检查是否有变更
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_dir, capture_output=True, text=True
        )
        if not result.stdout.strip():
            logger.info("没有新的变更需要提交")
            return True

        # 提交
        subprocess.run(
            ["git", "commit", "-m", commit_msg],
            cwd=repo_dir, capture_output=True, check=True
        )

        # 推送（清除代理）
        env = os.environ.copy()
        for proxy_var in ["HTTPS_PROXY", "HTTP_PROXY", "https_proxy", "http_proxy"]:
            env.pop(proxy_var, None)

        result = subprocess.run(
            ["git", "push", "-u", "gitee", "master"],
            cwd=repo_dir, capture_output=True, text=True, env=env, timeout=60
        )

        if result.returncode == 0:
            logger.info("✅ 成功推送到 Gitee!")
            return True
        else:
            # 尝试 main 分支
            result2 = subprocess.run(
                ["git", "push", "-u", "gitee", "main"],
                cwd=repo_dir, capture_output=True, text=True, env=env, timeout=60
            )
            if result2.returncode == 0:
                logger.info("✅ 成功推送到 Gitee (main 分支)!")
                return True
            else:
                logger.error(f"❌ 推送失败: {result.stderr}")
                return False

    except subprocess.TimeoutExpired:
        logger.error("❌ 推送超时")
        return False
    except Exception as e:
        logger.error(f"❌ 推送出错: {e}")
        return False
