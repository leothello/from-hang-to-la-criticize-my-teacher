# 从夯到拉锐评《基督山伯爵》中所有人物

## 本地运行
```bash
npm install
cp .env.example .env.local   # 从 Vercel KV 控制台填入连接信息
npm run dev
```

## 部署到 Vercel
1. 新建 Vercel 项目，导入本文件夹代码。
2. 在 Vercel 控制台 Storage 中创建一个 KV (Upstash Redis) 数据库，并关联到本项目，环境变量会自动注入，无需手动配置。
3. 部署即可，所有用户访问同一个公开地址。

## 数据结构
所有数据存放在一个 KV key（`monte_cristo_data`）下的大 JSON 对象里，结构见 `lib/kv.ts`。

## 文件说明
- `lib/kv.ts` — 所有数据库读写与业务逻辑（淘汰算法、档位计算等）
- `app/api/characters/route.ts` — 获取人物列表 / 添加新人物
- `app/api/characters/action/route.ts` — 分档、点赞、上传照片/简介、删除、申请下架
- `app/page.tsx` — 唯一前端页面（表格、弹窗全部在此文件内）
- `app/layout.tsx` — 页面外壳，引入 Tailwind CDN
