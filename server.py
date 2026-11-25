#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
四中校园墙 · 服务端（多用户版）
------------------------------------------------
· 仅使用 Python 标准库
· 同时支持：本机 HTTP 服务（server.py）与 WSGI 部署（wsgi.py）
· 每台设备首次进入时用「邀请码 + 昵称 + 班级」注册，之后凭设备 ID 识别身份
· 数据保存在 data/campus.db（SQLite）

环境变量：
  CAMPUS_INVITE  圈子邀请码，默认 SIZHONG2027
  CAMPUS_PORT    本机端口，默认 8787
  CAMPUS_OPEN    设为 1 时启动后自动打开浏览器
"""

import json
import os
import re
import socket
import sqlite3
import sys
import threading
import traceback
import webbrowser
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(ROOT, "web")
DATA = os.path.join(ROOT, "data")
DB_PATH = os.path.join(DATA, "campus.db")
PORT = int(os.environ.get("PORT") or os.environ.get("CAMPUS_PORT") or "8787")
INVITE = os.environ.get("CAMPUS_INVITE", "SIZHONG2027")

PALETTE = [
    ("#FF8A5C", "#FF4D6D"), ("#4C6FFF", "#2E4BD8"), ("#26C6B0", "#0E9F8A"),
    ("#7C5CFF", "#5B3FE0"), ("#FF9F43", "#F97316"), ("#F66D9B", "#E0407A"),
    ("#5AA9E6", "#3D7EBF"), ("#8B5CF6", "#6D28D9"), ("#22B573", "#12855A"),
    ("#F0A500", "#D97706"), ("#EC4899", "#BE185D"), ("#14B8A6", "#0F766E"),
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device TEXT UNIQUE,
  name TEXT NOT NULL,
  handle TEXT,
  grade TEXT,
  bio TEXT,
  color_a TEXT,
  color_b TEXT,
  is_official INTEGER DEFAULT 0,
  followers_base INTEGER DEFAULT 0,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS topics(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, emoji TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS posts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, topic_id INTEGER NOT NULL,
  content TEXT NOT NULL, art TEXT, pinned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL, likes INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS comments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  content TEXT NOT NULL, created_at TEXT NOT NULL, likes INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS post_likes(
  post_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  PRIMARY KEY(post_id, user_id)
);
CREATE TABLE IF NOT EXISTS follows(
  follower_id INTEGER NOT NULL, followee_id INTEGER NOT NULL,
  PRIMARY KEY(follower_id, followee_id)
);
CREATE TABLE IF NOT EXISTS chats(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a_id INTEGER NOT NULL, b_id INTEGER NOT NULL,
  pinned_a INTEGER DEFAULT 0, pinned_b INTEGER DEFAULT 0,
  unread_a INTEGER DEFAULT 0, unread_b INTEGER DEFAULT 0,
  created_at TEXT, last_at TEXT,
  UNIQUE(a_id, b_id)
);
CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL, sender_id INTEGER NOT NULL,
  content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_time ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_msg_chat ON messages(chat_id, created_at);
"""

# ---------------------------------------------------------------- 工具

def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def ago(minutes):
    return (datetime.now() - timedelta(minutes=minutes)).isoformat(timespec="seconds")


def rel_time(iso, style="post"):
    try:
        dt = datetime.fromisoformat(iso)
    except Exception:
        return ""
    now = datetime.now()
    secs = max(0, (now - dt).total_seconds())
    days = (now.date() - dt.date()).days
    if style == "chatlist":
        if dt.date() == now.date():
            return dt.strftime("%H:%M")
        if days == 1:
            return "昨天"
        if 1 < days < 7:
            return "周" + "一二三四五六日"[dt.weekday()]
        if dt.year == now.year:
            return "%d/%d" % (dt.month, dt.day)
        return "%d/%d/%d" % (dt.year, dt.month, dt.day)
    if secs < 60:
        return "刚刚"
    if secs < 3600:
        return "%d分钟前" % int(secs // 60)
    if dt.date() == now.date():
        return "%d小时前" % int(secs // 3600)
    if days == 1:
        return "昨天 " + dt.strftime("%H:%M")
    if days < 7:
        return "%d天前" % days
    if dt.year == now.year:
        return "%d月%d日" % (dt.month, dt.day)
    return "%d年%d月%d日" % (dt.year, dt.month, dt.day)


# ---------------------------------------------------------------- 初始演示数据

SEED_USERS = [
    (1, "林小满", "linxiaoman", "高二(3)班", "晚霞收集者 / 广播站 / 偶尔写点东西", "#FF8A5C", "#FF4D6D", 0, 136),
    (2, "陈一鸣", "chenyiming", "高三(1)班", "学生会 · 摄影社，相机比人重", "#4C6FFF", "#2E4BD8", 0, 512),
    (3, "苏打水", "soda", "高一(7)班", "一天三瓶苏打水，第四瓶是意外", "#26C6B0", "#0E9F8A", 0, 208),
    (4, "物理课代表", "physics", "高二(3)班", "受力分析从不缺席", "#7C5CFF", "#5B3FE0", 0, 341),
    (5, "阿汤", "atang", "高三(5)班", "篮球场三号常驻，水平一般，热情很高", "#FF9F43", "#F97316", 0, 276),
    (6, "秃头小宝贝", "bald", "高二(1)班", "头发可以没有，快乐必须有", "#F66D9B", "#E0407A", 0, 790),
    (7, "江晚", "jiangwan", "高一(2)班", "话剧社 / 喜欢晴天", "#5AA9E6", "#3D7EBF", 0, 189),
    (8, "校园墙小助手", "wall", "四中校园墙", "官方账号 · 投稿、举报、找回饭卡都可以找我", "#FF5A3C", "#D93A1C", 1, 3204),
    (9, "广播站", "radio", "校广播站", "每周四 18:30，点歌时间", "#8B5CF6", "#6D28D9", 1, 1102),
    (10, "体育委员", "pe", "高二(3)班", "跑步和喊口号，两样都很在行", "#22B573", "#12855A", 0, 233),
]

TOPICS = [
    (1, "晚自习的月亮", "🌙", 1),
    (2, "食堂新菜品", "🍚", 2),
    (3, "四中运动会", "🏃", 3),
    (4, "偷拍到的春天", "🌸", 4),
    (5, "高三加油", "📚", 5),
    (6, "校园广播点歌", "🎵", 6),
    (7, "失物招领", "🎒", 7),
    (8, "社团招新", "🎭", 8),
    (9, "校园杂谈", "💬", 9),
]

SEED_POSTS = [
    (1, 8, 9, "【置顶】四中校园墙使用说明\n\n这里是我们四中人自己的墙。分享日常、失物招领、点歌、表白，也可以只是说一句今天很累。\n\n不挂人、不传谣、不泄露隐私，违规三次会被下架。\n\n—— 墙墙", None, 1, 2880, 328),
    (2, 3, 2, "今天二楼新出的糖醋里脊，排了二十分钟队。值，但阿姨的手抖得像是帕金森。", None, 0, 12, 46),
    (3, 2, 1, "晚自习下课，操场边的月亮。手机拍不出十分之一，但还是想给你们看看。", "moon", 0, 62, 152),
    (4, 6, 7, "图书馆三楼靠窗那排，有人捡到一副白色耳机吗？线是黑色的，右耳有点松。找到请私信我，谢谢谢谢。", None, 0, 118, 12),
    (5, 10, 3, "运动会报名今天截止！！三班还差两个 1500 米，救救孩子。跑完请你喝奶茶。", None, 0, 175, 67),
    (6, 7, 5, "倒计时牌今天翻到 100 了。楼下那排银杏黄了一半，风一吹就落在高三的窗台上。\n\n学长学姐，慢慢来，我们都在。", None, 0, 290, 289),
    (7, 5, 9, "有人五点半打球吗，篮球场三号，缺两个人。水平不限，来了就是兄弟。", None, 0, 350, 34),
    (8, 4, 9, "周测最后一题全年级只有两个人做出来，其中一个是我。另一个是隔壁班课代表。\n\n今天允许我骄傲一下，明天继续受力分析。", None, 0, 470, 178),
    (9, 2, 4, "教学楼后面的玉兰开了。原图我放评论区。", "spring", 0, 1500, 203),
    (10, 9, 6, "周四 18:30 点歌照常。这周想点《起风了》给高三(1)班，可以吗？", None, 0, 1700, 96),
    (11, 6, 8, "被拉去话剧社，现在每天中午排练。累是真的，笑出声也是真的。招新最后两天，来玩。", None, 0, 1900, 58),
    (12, 3, 2, "求推荐学校附近好吃不贵的店，食堂已经吃腻了，预算 20 以内。", None, 0, 2600, 42),
    (13, 7, 1, "今晚月亮特别亮，走廊上站了一排人在看。班主任路过也停了两秒。", None, 0, 2800, 121),
    (14, 5, 3, "高三(5)班篮球夺冠那年的合照还在我桌肚里。今年也想赢。", None, 0, 4300, 233),
    (15, 8, 9, "本周墙墙收到 46 条投稿，其中 12 条是找饭卡的。饭卡真的很容易掉，记得放内侧口袋。", None, 0, 4400, 88),
    (16, 1, 6, "周四广播站点了一首《晴天》，不知道有没有人听到。\n\n第一次在广播里听见自己的名字，有点紧张。", None, 0, 600, 64),
    (17, 1, 4, "教学楼后面的玉兰开了第二茬。去年这个时候我还在为中考紧张，今年已经在四中的走廊里看花了。", None, 0, 3000, 97),
]

SEED_COMMENTS = [
    (2, 4, "阿姨的手抖，是四中未解之谜。", 8, 23),
    (2, 2, "明天去试试。", 5, 4),
    (2, 6, "建议错峰，12:05 去基本不用排队。", 3, 11),
    (3, 7, "拍得很好啊，比我的清楚多了。", 40, 6),
    (3, 3, "昨晚我也在操场，怎么没看到你。", 30, 3),
    (3, 2, "下次带三脚架，长曝光。", 20, 9),
    (3, 5, "月亮不如篮球好看。", 10, 2),
    (6, 2, "倒计时 100 天，加油。", 270, 20),
    (6, 6, "银杏真的黄了，我今天扫了一上午。", 250, 15),
    (6, 1, "学长学姐加油！", 200, 8),
    (1, 3, "墙墙辛苦了。", 2800, 12),
    (1, 7, "支持！", 2700, 7),
    (8, 6, "课代表你飘了。", 460, 18),
    (8, 7, "另一个是隔壁班课代表，笑死。", 450, 26),
    (8, 2, "这就是强者的世界吗。", 440, 9),
    (5, 5, "我报一个 1500，奶茶记得。", 170, 6),
    (5, 6, "我跑最后一名可以吗。", 160, 12),
    (9, 7, "求原图。", 1400, 5),
    (9, 2, "评论区发不了图，私信我。", 1390, 8),
    (16, 2, "听到了，广播站那首晴天。", 500, 9),
]

WELCOME_TEXT = (
    "欢迎来到四中校园墙 👋\n\n"
    "这里是四中人自己的墙：发帖、评论、关注同学都可以。\n\n"
    "发帖前建议先看一遍置顶的使用说明。有困难随时找我。"
)

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}


class Campus:
    def __init__(self, db_path=DB_PATH, web_dir=WEB):
        self.db_path = db_path
        self.web_dir = web_dir
        self.init_db()

    # ---------------- 数据库

    def conn(self):
        c = sqlite3.connect(self.db_path, timeout=15)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA journal_mode=WAL")
        return c

    def init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        c = self.conn()
        c.executescript(SCHEMA)
        c.commit()
        if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            self.seed(c)
            print("已写入初始演示数据")
        c.close()

    def seed(self, c):
        for u in SEED_USERS:
            c.execute(
                "INSERT INTO users(id,device,name,handle,grade,bio,color_a,color_b,is_official,followers_base,created_at)"
                " VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                (u[0], "seed:%d" % u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], ago(60 * 24 * 60)),
            )
        c.executemany("INSERT INTO topics(id,name,emoji,sort) VALUES(?,?,?,?)", TOPICS)
        c.executemany(
            "INSERT INTO posts(id,user_id,topic_id,content,art,pinned,created_at,likes) VALUES(?,?,?,?,?,?,?,?)",
            [(p[0], p[1], p[2], p[3], p[4], p[5], ago(p[6]), p[7]) for p in SEED_POSTS],
        )
        c.executemany(
            "INSERT INTO comments(post_id,user_id,content,created_at,likes) VALUES(?,?,?,?,?)",
            [(x[0], x[1], x[2], ago(x[3]), x[4]) for x in SEED_COMMENTS],
        )
        # 演示账号之间的关注关系（不影响真实用户）
        for f in [(1, 2), (1, 3), (1, 7), (1, 9), (2, 1)]:
            c.execute("INSERT OR IGNORE INTO follows(follower_id,followee_id) VALUES(?,?)", f)
        c.commit()

    # ---------------- 序列化

    def user_json(self, u, me_id=0, follow_ids=None):
        demo = bool(u["device"] and str(u["device"]).startswith("seed:"))
        followers = u["followers_base"] + self.count(
            "SELECT COUNT(*) FROM follows WHERE followee_id = ?", (u["id"],)
        ) if not demo else u["followers_base"]
        return {
            "id": u["id"], "name": u["name"], "handle": u["handle"], "grade": u["grade"],
            "bio": u["bio"], "colorA": u["color_a"], "colorB": u["color_b"],
            "official": bool(u["is_official"]), "demo": demo,
            "followers": followers,
            "following": bool(follow_ids and u["id"] in follow_ids),
            "self": u["id"] == me_id,
        }

    def count(self, sql, args=()):
        c = self.conn()
        try:
            return c.execute(sql, args).fetchone()[0]
        finally:
            c.close()

    def post_json(self, r, me_id, follow_ids):
        author = {
            "id": r["user_id"], "name": r["uname"], "handle": r["uhandle"], "grade": r["ugrade"],
            "bio": r["ubio"], "colorA": r["ca"], "colorB": r["cb"],
            "official": bool(r["uoff"]), "demo": bool(str(r["udevice"] or "").startswith("seed:")),
            "followers": r["ufollowers"], "following": r["user_id"] in follow_ids,
        }
        return {
            "id": r["id"], "content": r["content"], "art": r["art"],
            "pinned": bool(r["pinned"]), "createdAt": r["created_at"],
            "time": rel_time(r["created_at"]),
            "likes": r["likes"], "liked": bool(r["liked"]),
            "commentCount": r["ccount"],
            "topic": {"id": r["topic_id"], "name": r["tname"], "emoji": r["temoji"]},
            "author": author,
            "mine": r["user_id"] == me_id,
        }

    POST_SQL = """
    SELECT p.*, u.name uname, u.handle uhandle, u.grade ugrade, u.bio ubio,
           u.color_a ca, u.color_b cb, u.is_official uoff, u.device udevice,
           u.followers_base ufollowers, t.name tname, t.emoji temoji,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) ccount,
           EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) liked
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN topics t ON t.id = p.topic_id
    """

    def get_state(self, me):
        c = self.conn()
        try:
            me_id = me["id"]
            follow_ids = {r[0] for r in c.execute("SELECT followee_id FROM follows WHERE follower_id = ?", (me_id,))}
            topics = []
            for t in c.execute("SELECT * FROM topics ORDER BY sort ASC"):
                cnt = c.execute("SELECT COUNT(*) FROM posts WHERE topic_id = ?", (t["id"],)).fetchone()[0]
                topics.append({"id": t["id"], "name": t["name"], "emoji": t["emoji"], "count": cnt})

            posts = [self.post_json(r, me_id, follow_ids) for r in c.execute(self.POST_SQL + " ORDER BY p.pinned DESC, p.created_at DESC", (me_id,))]

            following = []
            for r in c.execute("SELECT u.* FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ? ORDER BY f.rowid ASC", (me_id,)):
                following.append(self.user_json(r, me_id))

            chats = []
            for ch in c.execute("SELECT * FROM chats WHERE a_id = ? OR b_id = ?", (me_id, me_id)):
                peer_id = ch["b_id"] if ch["a_id"] == me_id else ch["a_id"]
                peer = c.execute("SELECT * FROM users WHERE id = ?", (peer_id,)).fetchone()
                last = c.execute("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC, id DESC LIMIT 1", (ch["id"],)).fetchone()
                mine_a = ch["a_id"] == me_id
                chats.append({
                    "id": ch["id"], "peer": self.user_json(peer, me_id),
                    "pinned": bool(ch["pinned_a"] if mine_a else ch["pinned_b"]),
                    "unread": ch["unread_a"] if mine_a else ch["unread_b"],
                    "last": last["content"] if last else "还没有聊天记录",
                    "lastTime": rel_time(last["created_at"], "chatlist") if last else rel_time(ch["created_at"], "chatlist"),
                    "lastAt": last["created_at"] if last else ch["created_at"] or "",
                    "mine": bool(last["sender_id"] == me_id) if last else False,
                })
            chats.sort(key=lambda x: (x["pinned"], x["lastAt"]), reverse=True)

            stats = {
                "posts": c.execute("SELECT COUNT(*) FROM posts WHERE user_id = ?", (me_id,)).fetchone()[0],
                "following": len(follow_ids),
                "followers": me["followers_base"] + c.execute("SELECT COUNT(*) FROM follows WHERE followee_id = ?", (me_id,)).fetchone()[0],
                "likes": c.execute("SELECT COALESCE(SUM(likes),0) FROM posts WHERE user_id = ?", (me_id,)).fetchone()[0],
            }
            return {
                "me": self.user_json(me, me_id),
                "invite": INVITE,
                "topics": topics, "posts": posts, "following": following, "chats": chats,
                "stats": stats,
                "unread": sum(x["unread"] for x in chats),
            }
        finally:
            c.close()

    def get_post(self, me, pid):
        c = self.conn()
        try:
            follow_ids = {r[0] for r in c.execute("SELECT followee_id FROM follows WHERE follower_id = ?", (me["id"],))}
            r = c.execute(self.POST_SQL + " WHERE p.id = ?", (me["id"], pid)).fetchone()
            if not r:
                return None
            post = self.post_json(r, me["id"], follow_ids)
            comments = []
            for x in c.execute(
                """SELECT c.*, u.name uname, u.color_a ca, u.color_b cb, u.is_official uoff
                   FROM comments c JOIN users u ON u.id = c.user_id
                   WHERE c.post_id = ? ORDER BY c.created_at ASC, c.id ASC""", (pid,)
            ):
                comments.append({
                    "id": x["id"], "content": x["content"], "time": rel_time(x["created_at"]),
                    "createdAt": x["created_at"], "likes": x["likes"],
                    "author": {"id": x["user_id"], "name": x["uname"], "colorA": x["ca"],
                               "colorB": x["cb"], "official": bool(x["uoff"])},
                })
            return {"post": post, "comments": comments}
        finally:
            c.close()

    def get_chat(self, me, cid):
        c = self.conn()
        try:
            ch = c.execute("SELECT * FROM chats WHERE id = ? AND (a_id = ? OR b_id = ?)", (cid, me["id"], me["id"])).fetchone()
            if not ch:
                return None
            mine_a = ch["a_id"] == me["id"]
            peer_id = ch["b_id"] if mine_a else ch["a_id"]
            peer = c.execute("SELECT * FROM users WHERE id = ?", (peer_id,)).fetchone()
            msgs = []
            for m in c.execute("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC, id ASC", (cid,)):
                dt = datetime.fromisoformat(m["created_at"])
                msgs.append({
                    "id": m["id"], "mine": m["sender_id"] == me["id"], "content": m["content"],
                    "createdAt": m["created_at"], "time": dt.strftime("%H:%M"), "date": dt.strftime("%Y-%m-%d"),
                })
            return {"id": ch["id"], "peer": self.user_json(peer, me["id"]), "messages": msgs,
                    "unread": ch["unread_a"] if mine_a else ch["unread_b"]}
        finally:
            c.close()

    # ---------------- 写操作

    def register(self, data):
        device = str(data.get("deviceId") or "").strip()
        name = str(data.get("name") or "").strip()
        grade = str(data.get("grade") or "").strip()
        invite = str(data.get("invite") or "").strip()
        if not device or len(device) < 16 or len(device) > 64:
            return self._json(400, {"error": "设备标识无效，请刷新重试"})
        if INVITE and invite.upper() != INVITE.upper():
            return self._json(403, {"error": "邀请码不对，问问墙墙要一个"})
        if not name:
            return self._json(400, {"error": "起个昵称吧"})
        if len(name) > 16:
            return self._json(400, {"error": "昵称最多 16 个字"})
        if len(grade) > 20:
            return self._json(400, {"error": "班级最多 20 个字"})

        c = self.conn()
        try:
            old = c.execute("SELECT * FROM users WHERE device = ?", (device,)).fetchone()
            if old:
                return self._json(200, {"user": self.user_json(old, old["id"]), "state": self.get_state(old)})
            total = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            a, b = PALETTE[total % len(PALETTE)]
            bio = "刚加入四中校园墙"
            cur = c.execute(
                "INSERT INTO users(device,name,handle,grade,bio,color_a,color_b,created_at) VALUES(?,?,?,?,?,?,?,?)",
                (device, name, "", grade or "四中", bio, a, b, now_iso()),
            )
            uid = cur.lastrowid
            # 欢迎私信
            a_id, b_id = sorted([uid, 8])
            ch = c.execute("SELECT * FROM chats WHERE a_id = ? AND b_id = ?", (a_id, b_id)).fetchone()
            if not ch:
                cur2 = c.execute(
                    "INSERT INTO chats(a_id,b_id,unread_a,unread_b,created_at,last_at) VALUES(?,?,?,?,?,?)",
                    (a_id, b_id, 1 if a_id == uid else 0, 1 if b_id == uid else 0, now_iso(), now_iso()),
                )
                cid = cur2.lastrowid
                c.execute("INSERT INTO messages(chat_id,sender_id,content,created_at) VALUES(?,?,?,?)",
                          (cid, 8, WELCOME_TEXT, now_iso()))
            c.commit()
            me = c.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            return self._json(200, {"user": self.user_json(me, uid), "state": self.get_state(me)})
        finally:
            c.close()

    def create_post(self, me, data):
        content = str(data.get("content") or "").strip()
        if not content:
            return self._json(400, {"error": "说点什么再发布吧"})
        if len(content) > 500:
            return self._json(400, {"error": "最多 500 个字"})
        topic_id = int(data.get("topicId") or 9)
        c = self.conn()
        try:
            if not c.execute("SELECT 1 FROM topics WHERE id = ?", (topic_id,)).fetchone():
                topic_id = 9
            cur = c.execute(
                "INSERT INTO posts(user_id,topic_id,content,created_at,likes) VALUES(?,?,?,?,0)",
                (me["id"], topic_id, content, now_iso()),
            )
            c.commit()
            pid = cur.lastrowid
            return self._json(200, {"post": self.get_post(me, pid)["post"], "state": self.get_state(me)})
        finally:
            c.close()

    def toggle_like(self, me, pid):
        c = self.conn()
        try:
            row = c.execute("SELECT likes FROM posts WHERE id = ?", (pid,)).fetchone()
            if not row:
                return self._json(404, {"error": "帖子不存在"})
            ex = c.execute("SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?", (pid, me["id"])).fetchone()
            if ex:
                c.execute("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", (pid, me["id"]))
                c.execute("UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?", (pid,))
                liked = False
            else:
                c.execute("INSERT INTO post_likes(post_id,user_id) VALUES(?,?)", (pid, me["id"]))
                c.execute("UPDATE posts SET likes = likes + 1 WHERE id = ?", (pid,))
                liked = True
            c.commit()
            likes = c.execute("SELECT likes FROM posts WHERE id = ?", (pid,)).fetchone()[0]
            return self._json(200, {"id": pid, "liked": liked, "likes": likes})
        finally:
            c.close()

    def add_comment(self, me, pid, data):
        content = str(data.get("content") or "").strip()
        if not content:
            return self._json(400, {"error": "评论不能为空"})
        if len(content) > 300:
            return self._json(400, {"error": "评论最多 300 个字"})
        c = self.conn()
        try:
            if not c.execute("SELECT 1 FROM posts WHERE id = ?", (pid,)).fetchone():
                return self._json(404, {"error": "帖子不存在"})
            cur = c.execute("INSERT INTO comments(post_id,user_id,content,created_at,likes) VALUES(?,?,?,?,0)",
                            (pid, me["id"], content, now_iso()))
            c.commit()
            cid = cur.lastrowid
            x = c.execute(
                """SELECT c.*, u.name uname, u.color_a ca, u.color_b cb, u.is_official uoff
                   FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?""", (cid,)
            ).fetchone()
            count = c.execute("SELECT COUNT(*) FROM comments WHERE post_id = ?", (pid,)).fetchone()[0]
            return self._json(200, {"comment": {
                "id": x["id"], "content": x["content"], "time": rel_time(x["created_at"]),
                "createdAt": x["created_at"], "likes": 0,
                "author": {"id": x["user_id"], "name": x["uname"], "colorA": x["ca"],
                           "colorB": x["cb"], "official": bool(x["uoff"])},
            }, "commentCount": count})
        finally:
            c.close()

    def toggle_follow(self, me, uid):
        if uid == me["id"]:
            return self._json(400, {"error": "不能关注自己"})
        c = self.conn()
        try:
            if not c.execute("SELECT 1 FROM users WHERE id = ?", (uid,)).fetchone():
                return self._json(404, {"error": "用户不存在"})
            ex = c.execute("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?", (me["id"], uid)).fetchone()
            if ex:
                c.execute("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", (me["id"], uid))
                following = False
            else:
                c.execute("INSERT INTO follows(follower_id,followee_id) VALUES(?,?)", (me["id"], uid))
                following = True
            c.commit()
            return self._json(200, {"userId": uid, "following": following, "state": self.get_state(me)})
        finally:
            c.close()

    def ensure_chat(self, me, uid):
        if uid == me["id"]:
            return self._json(400, {"error": "不能和自己聊天"})
        c = self.conn()
        try:
            if not c.execute("SELECT 1 FROM users WHERE id = ?", (uid,)).fetchone():
                return self._json(404, {"error": "用户不存在"})
            a, b = sorted([me["id"], uid])
            ch = c.execute("SELECT * FROM chats WHERE a_id = ? AND b_id = ?", (a, b)).fetchone()
            if not ch:
                cur = c.execute("INSERT INTO chats(a_id,b_id,created_at,last_at) VALUES(?,?,?,?)", (a, b, now_iso(), now_iso()))
                c.commit()
                cid = cur.lastrowid
            else:
                cid = ch["id"]
            return self._json(200, {"chatId": cid})
        finally:
            c.close()

    def send_message(self, me, cid, data):
        content = str(data.get("content") or "").strip()
        if not content:
            return self._json(400, {"error": "消息不能为空"})
        if len(content) > 500:
            return self._json(400, {"error": "消息最多 500 个字"})
        c = self.conn()
        try:
            ch = c.execute("SELECT * FROM chats WHERE id = ? AND (a_id = ? OR b_id = ?)", (cid, me["id"], me["id"])).fetchone()
            if not ch:
                return self._json(404, {"error": "会话不存在"})
            c.execute("INSERT INTO messages(chat_id,sender_id,content,created_at) VALUES(?,?,?,?)",
                      (cid, me["id"], content, now_iso()))
            mine_a = ch["a_id"] == me["id"]
            if mine_a:
                c.execute("UPDATE chats SET unread_b = unread_b + 1, last_at = ? WHERE id = ?", (now_iso(), cid))
            else:
                c.execute("UPDATE chats SET unread_a = unread_a + 1, last_at = ? WHERE id = ?", (now_iso(), cid))
            c.commit()
            now = datetime.now()
            return self._json(200, {"message": {
                "id": 0, "mine": True, "content": content,
                "createdAt": now.isoformat(timespec="seconds"),
                "time": now.strftime("%H:%M"), "date": now.strftime("%Y-%m-%d"),
            }})
        finally:
            c.close()

    def mark_read(self, me, cid):
        c = self.conn()
        try:
            ch = c.execute("SELECT * FROM chats WHERE id = ? AND (a_id = ? OR b_id = ?)", (cid, me["id"], me["id"])).fetchone()
            if ch:
                col = "unread_a" if ch["a_id"] == me["id"] else "unread_b"
                c.execute("UPDATE chats SET %s = 0 WHERE id = ?" % col, (cid,))
                c.commit()
            return self._json(200, {"ok": True})
        finally:
            c.close()

    def read_all(self, me):
        c = self.conn()
        try:
            c.execute("UPDATE chats SET unread_a = 0 WHERE a_id = ?", (me["id"],))
            c.execute("UPDATE chats SET unread_b = 0 WHERE b_id = ?", (me["id"],))
            c.commit()
            return self._json(200, {"ok": True})
        finally:
            c.close()

    def update_me(self, me, data):
        name = str(data.get("name") or "").strip()
        bio = str(data.get("bio") or "").strip()
        if not name:
            return self._json(400, {"error": "昵称不能为空"})
        if len(name) > 16:
            return self._json(400, {"error": "昵称最多 16 个字"})
        if len(bio) > 60:
            return self._json(400, {"error": "简介最多 60 个字"})
        c = self.conn()
        try:
            c.execute("UPDATE users SET name = ?, bio = ? WHERE id = ?", (name, bio, me["id"]))
            c.commit()
            row = c.execute("SELECT * FROM users WHERE id = ?", (me["id"],)).fetchone()
            return self._json(200, {"me": self.user_json(row, me["id"])})
        finally:
            c.close()

    # ---------------- 路由

    def _json(self, status, obj):
        return (status, "application/json; charset=utf-8",
                json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def current_user(self, headers):
        device = (headers.get("x-device") or "").strip()
        if not device:
            return None
        c = self.conn()
        try:
            return c.execute("SELECT * FROM users WHERE device = ?", (device,)).fetchone()
        finally:
            c.close()

    def dispatch(self, method, path, headers, body):
        try:
            if path == "/api/health":
                return self._json(200, {"ok": True, "time": now_iso()})
            if path == "/api/register" and method == "POST":
                return self.register(self._parse(body))

            if path.startswith("/api/"):
                me = self.current_user(headers)
                if not me:
                    return self._json(401, {"error": "need_register", "message": "请先加入圈子"})
                data = self._parse(body)

                if path == "/api/state" and method == "GET":
                    return self._json(200, self.get_state(me))

                m = re.match(r"^/api/posts/(\d+)$", path)
                if m and method == "GET":
                    res = self.get_post(me, int(m.group(1)))
                    return self._json(200, res) if res else self._json(404, {"error": "帖子不存在"})

                m = re.match(r"^/api/posts/(\d+)/like$", path)
                if m and method == "POST":
                    return self.toggle_like(me, int(m.group(1)))

                m = re.match(r"^/api/posts/(\d+)/comments$", path)
                if m and method == "POST":
                    return self.add_comment(me, int(m.group(1)), data)

                if path == "/api/posts" and method == "POST":
                    return self.create_post(me, data)

                m = re.match(r"^/api/follow/(\d+)$", path)
                if m and method == "POST":
                    return self.toggle_follow(me, int(m.group(1)))

                if path == "/api/chats" and method == "POST":
                    return self.ensure_chat(me, int(data.get("userId") or 0))

                m = re.match(r"^/api/chats/(\d+)$", path)
                if m and method == "GET":
                    res = self.get_chat(me, int(m.group(1)))
                    return self._json(200, res) if res else self._json(404, {"error": "会话不存在"})

                m = re.match(r"^/api/chats/(\d+)/messages$", path)
                if m and method == "POST":
                    return self.send_message(me, int(m.group(1)), data)

                m = re.match(r"^/api/chats/(\d+)/read$", path)
                if m and method == "POST":
                    return self.mark_read(me, int(m.group(1)))

                if path == "/api/read-all" and method == "POST":
                    return self.read_all(me)

                if path == "/api/me" and method in ("PATCH", "POST"):
                    return self.update_me(me, data)

                return self._json(404, {"error": "接口不存在"})

            return self.static(path)
        except Exception:
            traceback.print_exc()
            return self._json(500, {"error": "服务器出错了"})

    def _parse(self, body):
        try:
            return json.loads((body or b"{}").decode("utf-8") or "{}")
        except Exception:
            return {}

    def static(self, path):
        rel = unquote(path).lstrip("/") or "index.html"
        full = os.path.normpath(os.path.join(self.web_dir, rel))
        if not full.startswith(os.path.normpath(self.web_dir)):
            return self._json(403, {"error": "forbidden"})
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            full = os.path.join(self.web_dir, "index.html")
            if not os.path.isfile(full):
                return self._json(404, {"error": "not found"})
        ext = os.path.splitext(full)[1].lower()
        with open(full, "rb") as f:
            body = f.read()
        return (200, MIME.get(ext, "application/octet-stream"), body)


# ---------------------------------------------------------------- 本机 HTTP 服务

class Handler(BaseHTTPRequestHandler):
    server_version = "SizhongWall/2.0"
    protocol_version = "HTTP/1.1"
    app = None

    def _send(self, status, ctype, body):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _handle(self, method):
        try:
            parsed = urlparse(self.path)
            path = unquote(parsed.path)
            headers = {k.lower(): v for k, v in self.headers.items()}
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            body = self.rfile.read(length) if length else b""
            status, ctype, data = self.app.dispatch(method, path, headers, body)
            self._send(status, ctype, data)
        except Exception:
            traceback.print_exc()
            self._send(500, "application/json; charset=utf-8", b'{"error":"server error"}')

    def do_GET(self):
        self._handle("GET")

    def do_POST(self):
        self._handle("POST")

    def do_PATCH(self):
        self._handle("PATCH")

    def log_message(self, fmt, *args):
        pass


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("223.5.5.5", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def banner():
    ip = lan_ip()
    line = "=" * 54
    print("")
    print(line)
    print("  四中校园墙 · 本地服务已启动（多用户版）")
    print(line)
    print("  电脑访问： http://127.0.0.1:%d" % PORT)
    print("  手机访问： http://%s:%d" % (ip, PORT))
    print("  邀请码：   %s" % INVITE)
    print("")
    print("  首次打开需要填昵称 + 邀请码，每台手机一个身份。")
    print(line)
    print("")


def main():
    app = Campus()
    Handler.app = app
    try:
        httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
        httpd.daemon_threads = True
    except OSError as e:
        print("启动失败：端口 %d 可能已被占用。%s" % (PORT, e))
        input("按回车退出…")
        return
    banner()
    if os.environ.get("CAMPUS_OPEN") == "1":
        threading.Timer(1.0, lambda: webbrowser.open("http://127.0.0.1:%d" % PORT)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
