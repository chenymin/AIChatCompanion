# Agent 开发：从最小闭环到独立迁移

当前版本：**lesson-02 / 统一模型接口与真实服务适配**。

目标：沿一条持续演进的代码主线，学习实现、单步调试和故障分析，再将能力迁移到其他业务。每课一个稳定 Git tag，课程正文与代码一起版本化。

## 开始第一课

在这个独立仓库根目录操作，使用 Node **22.22.0**（见 `.nvmrc`）与 pnpm **10.33.1**。

```sh
pnpm install --frozen-lockfile
pnpm run chat -- "突然降温"
```

运行时只使用 Node 自带功能，TypeScript 通过 Node 原生类型擦除直接执行，没有构建步骤。安装的 TypeScript 和 Node 类型用于编辑器提示与手动类型检查；原生执行本身不检查类型。

- 学习正文：[lesson-01](docs/lessons/lesson-01.md)
- 本课新增：[lesson-02](docs/lessons/lesson-02.md)
- 全部能力安排：[24 课路线图](docs/ROADMAP.md)
- 手动验收记录：[VALIDATION.md](VALIDATION.md)
- 调试：VS Code **直接打开本仓库目录**，在 `src/agent.ts` 设置断点，再选“课程：单次聊天”启动。
- 终端调试：`pnpm run debug -- "突然降温"`；`--inspect-brk` 会暂停等待调试器连接。

默认是固定响应模拟，不调用模型服务、不需要 Key、不保存消息。正常回复输出到 stdout，JSON 阶段 trace 输出到 stderr；runId 与实际耗时每次变化。

`modelCalls` 记录本轮进入生成接口的次数；`mode: mock` 表示模拟调用，真实外部模型请求数仍为 0。后续真实模式也只统计本应用发起的调用，不推断供应商内部调用、Token 或费用。

## 第 2 课：接入真实模型

复制 `.env.example` 为本地 `.env`，将 `MODEL_MODE` 改为 `live`，填写服务商提供的 `LLM_BASE_URL`、`LLM_MODEL`、`LLM_API_KEY`。然后执行同一个 `pnpm run chat -- "突然降温"` 命令。`.env` 已忽略，不会进入课程提交。

本课适配非流式 Chat Completions：向 API 根地址追加 `/chat/completions`，只取 `choices[0].message.content`，不拼接推理字段。缺配置、HTTP 失败、超时和无效正文会返回明确错误；不会切回模拟回复。真实模型与供应商兼容性须单独手动验收。

完整步骤、故障实验和源码断点见 [第 2 课](docs/lessons/lesson-02.md)。终端 `debug` 启动后，选择 VS Code“课程：Node Attach”；也可直接选择“课程：单次聊天”启动调试。

## 如何使用课程版本

```sh
# 阅读某课参考完成版
git switch --detach lesson-01

# 从参考版建立自己的练习分支，再完成下一课
git switch -c practice/lesson-02 lesson-01

# 后续课发布后，比较新增能力
git diff lesson-01 lesson-02 -- src
```

切换前先保存自己的工作。课程 tag 固定，`main` 指向最新已制作版本；文档中尚未发布的版本只是路线图。

原项目对照按课提供文件路径与函数名，不导入其业务模块。本课可对照 ElectronicCompanionAgent 的 `inbox-chat.tsx` 提交入口、`inbox.route.ts` 主 POST 与模型调用位置；此处先建立最小链路。

官方依据：[Node v22.22.0 原生 TypeScript](https://nodejs.org/download/release/v22.22.0/docs/api/typescript.html)、[命令行与 env-file](https://nodejs.org/download/release/v22.22.0/docs/api/cli.html)。

## 验证状态

实现已准备；CLI、类型检查、调试和真实模型均未由制作者执行。按照学习约定，由用户手动验证后记录结果。`Agents.md` 保留这一规则。
