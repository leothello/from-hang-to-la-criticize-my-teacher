# 从夯到拉锐评25中所有老师

## 部署步骤

1. 点击 Vercel 一键部署按钮（或手动导入仓库）
2. 进入 Vercel Dashboard → 你的项目 → Storage
3. 点击 "Connect Store" 并创建一个 Vercel KV 数据库
4. 系统会自动注入 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 环境变量
5. 重新部署一次，完成

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 Vercel KV 的连接信息：

```
KV_REST_API_URL=你的KV_REST_API_URL
KV_REST_API_TOKEN=你的KV_REST_API_TOKEN
```
