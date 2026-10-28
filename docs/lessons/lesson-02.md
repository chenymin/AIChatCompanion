# 第 2 课：在同一条链路中切换模型实现

目标：将模拟与真实模型隔离在适配层，解释模型配置、接口契约和 HTTP 调用的关系。预计 3～4 小时。

起点：`lesson-01`；参考完成版：`lesson-02`。模拟、真实模型与故障案例均**未执行，待用户验证**。

## 本课相对上一课新增什么

第 1 课直接调用模拟实现。本课引入 `ModelClient` 契约、配置解析和 provider 选择：

```text
cli
  → agent：先校验输入，再调用工厂
       → providers/index → config：解析模式与配置，创建 ModelClient
       → ModelClient.generate：执行本轮
       ├─ mock：本地固定响应
       └─ openai-compatible：fetch 到 /chat/completions
```

业务层通过同一契约接收回复。切换 provider 后，输入处理、错误传递和 trace 仍沿用既有路径。当前真实适配仅覆盖非流式 Chat Completions；流式、Responses 与供应商差异留给后续课程，不能因接口名称兼容就假定所有功能兼容。

注意这里的模型工厂由 `agent.ts` 调用；CLI 负责输入与退出，不负责拼装供应商 HTTP 请求。第一课正文保留当时版本，学习第一课时请切到 `lesson-01`。

## 推荐阅读顺序与断点

| 顺序 | 文件 | 要找的问题与断点 |
|---|---|---|
| 1 | `src/model.ts` | 输入消息和输出结果如何定义；业务层究竟依赖哪些能力 |
| 2 | `src/config.ts` | 默认模式、live 必需配置、无效配置何时失败 |
| 3 | `src/providers/index.ts` | mock 与 live 的选择分支；从配置到实例的转换 |
| 4 | `src/agent.ts` | 调用契约前后；是否需要理解供应商响应 JSON |
| 5 | `src/providers/openai-compatible.ts` | URL、请求体、Authorization、超时 signal、响应解析与错误分支 |
| 6 | `src/providers/mock.ts` | 与真实实现如何满足同一个接口 |

在真实适配器的 `fetch` 前、收到响应后各设断点。观察状态、角色与正文即可，避免将凭证粘入实验记录。

## 先验证默认模拟模式

不设置 `MODEL_MODE` 时仍使用模拟模式：

```sh
npm run chat -- '突然降温'
```

显式选择也可以：

```sh
MODEL_MODE=mock npm run chat -- '突然降温'
```

预期：不需要 Key，仍沿业务编排输出模拟回复，trace 可看到调用阶段。它检验接口接线，不等于真实 HTTP 已验证。

## 可选：配置真实模型

在仓库根目录创建本地 `.env`，按照 `.env.example` 的字段填入自己的连接：

```dotenv
MODEL_MODE=live
LLM_BASE_URL=https://你的供应商地址/v1
LLM_MODEL=供应商支持的模型名
LLM_API_KEY=你的本地模型凭证
```

`LLM_BASE_URL` 是 API 根地址，不是完整的 `/chat/completions` 地址；具体拼接规则以适配器代码为准。本地 `.env` 不进入参考课程提交。

然后手动执行：

```sh
npm run chat -- '突然降温'
```

预期：配置解析选择 live，适配器发送一次非流式生成请求，正常时将响应正文交还业务层。检查连接状态、正文与 trace，不要求每次回答逐字相同。HTTP 失败、网络异常和超时应沿错误路径返回，不能用模拟回复掩盖真实失败。

若要调试：

```sh
npm run debug -- '突然降温'
```

先连接 VS Code 的 Node Attach 调试器，再逐步继续。调用记录中的次数与耗时属于应用这一层实际记录的范围；没有采集到的 token、费用或供应商内部执行信息不能写成实测。

## 故障实验：live 模式缺少必要配置

先预测错误应发生在配置解析还是模型 HTTP 阶段。准备一个没有 `LLM_API_KEY` 的本地环境，选择 live 后执行同一输入；若 `.env` 已保存 Key，需要在这个实验中使用独立环境或手动暂时去掉该字段。

预期：配置校验失败，不应该继续请求模型服务。用断点检查 `src/config.ts`，并确认真实适配器的 `fetch` 没有执行。

模拟模型的失败开关仍可独立复现：

```sh
MODEL_MODE=mock MOCK_FAULT=error npm run chat -- '突然降温'
```

两个错误分别属于配置阶段和生成阶段，比较 trace，说明为何不能只凭“没有回复”判断根因。

## 从上一课开始练习

```sh
git switch -c practice/lesson-02 lesson-01
```

任务：为现有模拟实现提取最小契约，再接入一个实现同一契约的生成适配器。完成后阅读参考版本的差异：

```sh
git diff lesson-01 lesson-02 -- src
```

未演示变体：增加第二种固定响应实现，仍由配置选择，尽量不修改业务编排。解释你为什么把选择逻辑放在该位置。

## 与原项目对照

在原项目 `apps/api/src/routes/chat/inbox.route.ts` 中搜索：

- `resolveChatProviderConfig`：请求中配置与服务端环境配置的选择。
- `buildLangChainChatModel`：分析模型的实例创建。
- `fetchUpstreamChat`：正式生成的 HTTP 请求与协议处理。

本课只从本地环境选择 provider，尚未实现浏览器连接配置、登录身份、结构化分析或正式流解析。这里抽象出的能力是：让业务层依赖所需的生成契约，把供应商配置和协议细节留在适配层。

## 完成本课的证据

- 能画出配置、provider 工厂、契约与 Agent 的关系。
- 能通过配置切换实现，并说明实际进入哪个分支。
- 能区分缺配置、HTTP 失败和正文解析失败的定位入口。
- 已运行与未运行的模式分别记录；没有 Key 不影响继续模拟课程。

把接口设计、断点观察或 provider 差异发回对话继续反馈。下一课加入显式会话状态，观察“模型记住前文”所依赖的输入。
