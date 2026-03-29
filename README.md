# AI Capability Service

统一 AI 能力执行服务 — 通过单一 REST 端点调用多种 AI 能力（文本摘要、图片描述等），支持模拟/真实双模式。

## 快速启动

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env

# 开发模式（mock，无需 API key）
pnpm dev

# 运行测试
pnpm test
```

## 使用真实模型

```bash
# .env
USE_REAL_MODEL=true
OPENAI_API_KEY=sk-your-key-here
```

## API

### POST /v1/capabilities/run

```bash
# 文本摘要
curl -X POST http://localhost:3000/v1/capabilities/run \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "text_summary",
    "input": {
      "text": "Node.js is a JavaScript runtime built on V8. It uses an event-driven, non-blocking I/O model. This makes it lightweight and efficient.",
      "max_length": 80
    },
    "request_id": "req-001"
  }'
```

成功响应：

```json
{
  "ok": true,
  "data": {
    "result": "Node.js is a JavaScript runtime built on V8. It uses an event-driven, non-blocking I/O model...."
  },
  "meta": {
    "request_id": "req-001",
    "capability": "text_summary",
    "elapsed_ms": 2
  }
}
```

```bash
# 图片描述
curl -X POST http://localhost:3000/v1/capabilities/run \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "image_caption",
    "input": { "image_url": "https://example.com/photo.jpg" }
  }'
```

错误响应（格式一致）：

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "input.text is required and must be a string",
    "details": { "field": "text", "received": "undefined" }
  },
  "meta": {
    "request_id": "auto-generated-uuid",
    "capability": "text_summary",
    "elapsed_ms": 1
  }
}
```

### GET /v1/capabilities

返回已注册的能力列表。

### GET /health

健康检查。

## 目录结构

```
src/
├── index.ts                  # 入口：Express 启动 + graceful shutdown
├── config.ts                 # 环境变量集中管理
├── routes/
│   └── capabilities.ts       # POST /v1/capabilities/run
├── capabilities/
│   ├── registry.ts           # Capability 注册表（Map + 接口）
│   ├── text-summary.ts       # text_summary（模拟 + 真实双模式）
│   └── image-caption.ts      # image_caption（多模态视觉）
├── middleware/
│   ├── error-handler.ts      # 全局错误处理 → 统一 JSON 格式
│   └── request-logger.ts     # 请求日志
├── types/
│   └── index.ts              # 类型定义
└── errors/
    └── index.ts              # 错误类体系
```

## 设计决策

1. **注册表模式**：所有 capability 通过统一接口注册到 Map，新增能力只需一个文件 + 一行 import，路由零侵入。这与我在生产环境中构建统一 API 网关的设计模式一致 — 当时接入了 12+ 种 AI 模型，全部通过注册表统一管理。

2. **模拟/真实双模式**：通过 `USE_REAL_MODEL` 环境变量切换。模拟模式无外部依赖，适合测试和 CI；真实模式接入 OpenAI，展示模型集成能力。这在生产中也是标配 — 我们的异步任务系统同样支持 dry-run 模式用于回归测试。

3. **统一错误格式**：所有错误都经过同一个 error handler，保证任何情况（包括未预期异常）下响应 JSON 格式严格一致。`meta` 字段在成功和失败响应中都存在，方便调用方统一处理。

4. **精确计时**：使用 `performance.now()` 而非 `Date.now()`，提供亚毫秒精度的 `elapsed_ms`。在我维护的 API 网关中，这种精度对于识别慢请求和 P99 尾延迟至关重要。

5. **输入校验前置**：每个 capability 自行定义 `validate()` 方法，在 `execute()` 前完成校验，避免脏数据进入业务逻辑。校验失败直接抛出带详细 `details` 的 `ValidationError`，方便调用方定位问题。

6. **Graceful Shutdown**：监听 `SIGINT`/`SIGTERM`，先停止接收新请求，等待已有连接完成后退出。这是容器化部署的基本要求。

## 技术栈

- Node.js 20+ / TypeScript (strict mode)
- Express 4
- OpenAI SDK (gpt-4o-mini)
- vitest + supertest
- pnpm
