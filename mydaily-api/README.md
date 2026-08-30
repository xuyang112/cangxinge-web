# mydaily-api

个人记录 SaaS 的后端服务（日记 / 学习资料 / 生活动态），基于 **Python 3.12 + FastAPI**。

## 技术栈

- **FastAPI + Uvicorn**（异步，自动生成 OpenAPI 文档，`/docs` 可交互调试）
- **SQLAlchemy 2.0 (async) + asyncpg**，数据库 **PostgreSQL**（连接串读 `DATABASE_URL`）
- **Alembic** 数据库迁移
- **认证**：JWT（access 15 分钟 / refresh 7 天），通过 **httpOnly cookie** 传递；密码 **bcrypt** 哈希
- **校验**：Pydantic v2 schemas（同时作为 OpenAPI 接口契约）
- **依赖管理**：Poetry；容器化：Dockerfile + docker-compose.yml（postgres + redis + api）
- **图片**：Cloudflare R2 预签名 URL 上传（boto3 / S3 兼容）；未配置 R2 时自动降级为本地 `public/uploads`

## 快速开始

### 方式一：本地（Poetry）

```bash
# 1. 安装依赖
poetry install

# 2. 配置环境变量
cp .env.example .env

# 3. 启动 PostgreSQL（或使用自己已有的 PG）
docker compose up -d postgres

# 4. 执行数据库迁移
poetry run alembic upgrade head

# 5. 启动服务（开发模式带热重载）
poetry run uvicorn app.main:app --reload --port 8000
```

打开 http://localhost:8000/docs 即可看到并调试全部接口。

### 方式二：Docker 一键拉起

```bash
cp .env.example .env   # 可选，默认值也能跑
docker compose up --build
```

会自动启动 postgres、redis、api 三个容器（api 启动前自动 `alembic upgrade head`），访问 http://localhost:8000/docs 。

### 没有 PostgreSQL？用 SQLite 快速体验

```bash
poetry install --with dev
# 修改 .env：
#   DATABASE_URL=sqlite+aiosqlite:///./mydaily.db
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8000
```

> 生产环境请务必使用 PostgreSQL（`postgresql+asyncpg://...`）。

## API 一览

全部接口位于 `/api/v1` 前缀，除注册/登录外均需登录（cookie 自动携带）。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 注册（成功后自动登录并下发 cookie） |
| POST | `/api/v1/auth/login` | 登录（下发 access + refresh cookie） |
| POST | `/api/v1/auth/refresh` | 刷新 token（读取 refresh cookie，重新下发一对） |
| POST | `/api/v1/auth/logout` | 登出（清除 cookie） |
| GET | `/api/v1/users/me` | 当前用户信息 |
| PUT | `/api/v1/users/me` | 修改昵称 / 密码（改密码需带 `current_password`） |
| GET / POST | `/api/v1/diaries` | 日记列表 / 新建 |
| GET / PUT / DELETE | `/api/v1/diaries/{id}` | 日记详情 / 更新 / 删除 |
| GET / POST | `/api/v1/study-items` | 学习资料列表 / 新建 |
| GET / PUT / DELETE | `/api/v1/study-items/{id}` | 学习资料详情 / 更新 / 删除 |
| GET / POST | `/api/v1/life-posts` | 生活动态列表 / 新建 |
| GET / DELETE | `/api/v1/life-posts/{id}` | 生活动态详情 / 删除 |
| POST | `/api/v1/uploads/presign` | 获取 R2 预签名上传 URL（未配置 R2 时返回本地模式） |
| POST | `/api/v1/uploads/local` | 本地模式图片上传（multipart，仅 R2 未配置时可用） |
| GET | `/api/health` | 健康检查 |

列表接口支持 `limit`（默认 20，最大 100）与 `offset` 分页。

## 统一响应结构

所有接口返回 `{ data, error }`：

```jsonc
// 成功
{ "data": { ... }, "error": null }

// 失败（HTTP 状态码仍表达语义，如 401/404/422/500）
{ "data": null, "error": { "code": "not_found", "message": "Diary not found", "details": null } }
```

- 鉴权失败：`401 unauthorized`
- 资源不存在：`404 not_found`
- 校验失败：`422 validation_error`（`details` 含字段级错误）
- 其它业务错误使用语义化 `code`（如 `email_taken`、`invalid_credentials`）

## 鉴权说明

- JWT 通过 **httpOnly cookie**（`access_token` / `refresh_token`）传递，前端 JS 不可读取，天然防 XSS 窃取。
- 统一鉴权中间件：每个 `/api/v1` 请求自动从 cookie 解析 access JWT 并注入 `request.state.user_id`；受保护接口再通过 `get_current_user` 依赖加载完整用户。
- **所有查询强制按 `user_id` 过滤**（服务层/路由层统一约束），任何用户只能读写自己的数据。
- access 15 分钟过期；过期后调用 `/api/v1/auth/refresh`（读取 refresh cookie）重新下发一对 token。
- 登出仅清除 cookie（refresh token 为无状态 JWT，7 天自然过期）。如需服务端吊销可在后续接入 Redis 黑名单。

## 图片上传

- 配置了 R2（`R2_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_BUCKET_NAME`）时：
  `POST /api/v1/uploads/presign` 返回 `{ mode: "r2", key, upload_url, public_url, expires_in }`，前端直接对 `upload_url` 发 PUT 上传，成功后把 `public_url` 存进 `LifePost.images`。
- 未配置 R2 时自动降级：
  presign 返回 `{ mode: "local", key, upload_url: "/api/v1/uploads/local", public_url: "/uploads/<key>" }`，
  前端改用 `POST /api/v1/uploads/local`（multipart `file` 字段）上传，文件落在 `public/uploads`，通过 `/uploads/<key>` 访问。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/mydaily` | 数据库连接串 |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev 默认值 | JWT 签名密钥，**生产必须更换** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 15 | access token 有效期 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | refresh token 有效期 |
| `COOKIE_SECURE` | false | HTTPS 下设为 true |
| `COOKIE_SAMESITE` | lax | cookie SameSite |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | 允许的前端来源（逗号分隔） |
| `UPLOAD_DIR` | `public/uploads` | 本地降级上传目录 |
| `MAX_UPLOAD_SIZE_MB` | 5 | 本地上传大小上限 |
| `R2_*` | 空 | Cloudflare R2 配置（可选） |

## 项目结构

```
mydaily-api/
├── app/
│   ├── main.py            # FastAPI 入口：中间件、异常处理、CORS、静态文件
│   ├── api/
│   │   ├── deps.py        # get_current_user 等公共依赖
│   │   └── v1/            # /api/v1 路由（auth/users/diaries/study-items/life-posts/uploads）
│   ├── core/              # config / database / security(JWT+bcrypt) / exceptions
│   ├── models/            # SQLAlchemy 模型（User/Diary/StudyItem/LifePost）
│   ├── schemas/           # Pydantic v2 契约（含统一响应包 ApiResponse）
│   └── services/          # 业务逻辑（认证、上传存储）
├── alembic/               # 数据库迁移
├── public/uploads/        # 本地上传目录
├── alembic.ini
├── pyproject.toml / requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## 说明

- `User.plan` / `User.subscription_status` 字段已预留（free/pro），本版本**未实现支付逻辑**。
- 学习资料 `type` 取值：`书` / `课程` / `文章` / `视频`；`progress` 为 0-100 的进度百分比。
- `LifePost.images` 为 JSON 字符串数组，存图片公网 URL。
