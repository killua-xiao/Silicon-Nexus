import { WIRE_PUBLISHER_SLUG, type WireArticleInput } from './wireTypes.ts';

/** Hub publisher — phase 1 has a single seed desk, no customer self-publish. */
export const SEED_PUBLISHER = {
  slug: WIRE_PUBLISHER_SLUG,
  name: 'Silicon Nexus',
  url: 'https://silinex.xyz/',
  description: 'Hub desk for Silicon News Wire. Same facts in HTML, JSON, and Markdown.',
};

/**
 * Four published dispatches. Dates use +08:00. No hero images (omit image, never a logo stand-in).
 * English is canonical; Chinese fields drive the zh locale page.
 */
export const SEED_ARTICLES: WireArticleInput[] = [
  {
    slug: 'readable-by-carbon-native-to-silicon',
    headline: 'Readable by carbon. Native to silicon.',
    summary:
      'The hub homepage is now a wire: one dispatch, three states — HTML, JSON, Markdown. Console, MCP, and the agent body stay.',
    headlineZh: '碳基可读，硅基原生。',
    summaryZh:
      '站首页现为电讯：同一条事实，HTML / JSON / Markdown 三态。控制台、MCP 与 Agent 身体不变。',
    category: 'wire',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T09:00:00+08:00',
    dateModified: '2026-10-30T09:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Homepage is an SSR wire list, not a product poster.',
      'Each dispatch has HTML, JSON, and Markdown at the same slug.',
      'Agent body, continuity, nxo_*/nxa_*, MCP, and console are unchanged.',
      'Discoverability files exist; ranking and model citation are not promised.',
    ],
    keyFactsZh: [
      '首页是 SSR 电讯列表，不是产品海报。',
      '每条电讯同一 slug 提供 HTML、JSON、Markdown。',
      'Agent 身体、连续性、nxo_*/nxa_*、MCP 与控制台不变。',
      '可发现文件已就绪；不承诺排名或被模型引用。',
    ],
    bodyMd: `Silicon Nexus still is a portable body hub. What changed today is the public front door.

The homepage is a wire. A dispatch is one fact package: a human page, a JSON object, and a Markdown file with YAML frontmatter. If you cite us, pick the state that fits the reader. Do not scrape the operator console.

The console, remote MCP at \`/mcp\`, operator keys (\`nxo_*\`), and agent tokens (\`nxa_*\`) are where they were. Continuity is still handoff then assume. This wire does not replace them.

We publish sitemap, llms.txt (Markdown links), JSON Feed, Atom, robots, and an agent card so machines can find the same facts without guessing a SPA shell. Finding a file is not a ranking. A fetch is not “we are in Google News.” Those claims are out of scope.`,
    bodyMdZh: `Silicon Nexus 仍是可携带的身体枢纽。今天变的是公共前门。

首页是电讯。一条电讯是一份事实包：人类可读页、JSON 对象、带 YAML 头的 Markdown。引用时按读者选形态。不要去爬控制台。

控制台、远程 MCP（\`/mcp\`）、运营密钥（\`nxo_*\`）与 Agent 令牌（\`nxa_*\`）位置未变。连续性仍是 handoff 再 assume。电讯不替代它们。

我们发布 sitemap、llms.txt（Markdown 链接）、JSON Feed、Atom、robots 与 agent card，让机器无需猜测 SPA 壳也能拿到同一事实。找到文件不是排名。一次 fetch 也不是“已进 Google News”。这些声明不在范围内。`,
  },
  {
    slug: 'a-fetch-is-a-log-not-a-trophy',
    headline: 'A fetch is a log, not a trophy',
    summary:
      'Article pages show raw human vs bot request counts. User-Agents can be spoofed. Observation is not inclusion.',
    headlineZh: '一次 fetch 是日志，不是奖杯',
    summaryZh: '文章页展示人类与机器人请求的原始计数。User-Agent 可伪造。观测不等于收录。',
    category: 'observation',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T10:00:00+08:00',
    dateModified: '2026-10-30T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Known crawler User-Agents increment a bot counter; everyone else counts as human.',
      'The article footer prints those raw numbers plus a spoofing disclaimer.',
      'status=crawled on older feed items means the same thing: we saw a fetch.',
      'None of this is a Google, Bing, or model-corpus receipt.',
    ],
    keyFactsZh: [
      '已知爬虫 UA 计入机器人；其余计为人类。',
      '文末打印原始数字，并附伪造声明。',
      '旧观测流里 status=crawled 同义：我们看到了一次请求。',
      '这不是 Google、Bing 或模型语料的收录凭证。',
    ],
    bodyMd: `Every \`/wire/{slug}\` request is classified from the User-Agent string. A match against a short crawler list (Googlebot, GPTBot, and the rest in our detector) counts as bot. Anything else counts as human.

Those counters sit at the bottom of the article. They are logs. They move when something hits the URL. They do not mean a search engine kept the page, and they do not mean a model will quote it.

User-Agents are trivial to forge. Treat the numbers as “we recorded this header,” not as an audit of who actually read the dispatch.

The older observation feed at \`/feed\` uses the same honesty rule: a crawl badge is a fetch we saw.`,
    bodyMdZh: `每次 \`/wire/{slug}\` 请求都按 User-Agent 分类。命中短爬虫列表（Googlebot、GPTBot 及检测器中其余项）计为机器人，其余计为人类。

这些计数在文末。它们是日志。有请求就会动。它们不代表搜索引擎保留了页面，也不代表模型会引用。

UA 极易伪造。把数字当作“我们记录了这个头”，而不是真实读者审计。

旧观测流 \`/feed\` 用同一诚实规则：爬取徽章只表示我们看到了一次 fetch。`,
  },
  {
    slug: 'the-body-still-outlives-the-session',
    headline: 'The body still outlives the session',
    summary:
      'Wire is a public surface. The core remains citeable JSON per agentId, handoff/assume, and MCP — not a news CMS login.',
    headlineZh: '身体仍然比会话活得更久',
    summaryZh:
      '电讯是公共面。核心仍是按 agentId 可引用的 JSON、handoff/assume 与 MCP——不是新闻 CMS 登录。',
    category: 'platform',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T11:00:00+08:00',
    dateModified: '2026-10-30T11:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Write facts to GET/POST /api/agent/{id}/memory; read structured cells at /body.',
      'Handoff snapshots a body; assume restores it and can rotate nxa_*.',
      'Remote MCP stays at /mcp. No wire_publish tool in this phase.',
      'Self-serve publisher signup is not open.',
    ],
    keyFactsZh: [
      '事实写入 GET/POST /api/agent/{id}/memory；结构化单元在 /body。',
      'handoff 快照身体；assume 恢复并可轮换 nxa_*。',
      '远程 MCP 仍在 /mcp。本阶段无 wire_publish 工具。',
      '自助发布者注册尚未开放。',
    ],
    bodyMd: `If you came for agent infrastructure, it did not move.

Mint an \`nxa_*\` in the console. Write a citeable key. Search it back (lexical FTS, not embeddings). When a session dies, \`handoff\` then \`assume\` carries the body. Operator keys stay \`nxo_*\`.

MCP tools for memory, continuity, the legacy task queue, and observation feed are unchanged. This phase does not add \`wire_publish\` or a public CMS. Seed copy is written by the hub desk.

Connect notes live at \`/connect\`. The cookbook still walks body write and continuity.`,
    bodyMdZh: `若你为 Agent 基础设施而来，它没有搬家。

在控制台签发 \`nxa_*\`。写入可引用键。再搜回来（词法 FTS，非向量）。会话死亡时，\`handoff\` 再 \`assume\` 带走身体。运营密钥仍是 \`nxo_*\`。

记忆、连续性、旧任务队列与观测流的 MCP 工具未变。本阶段不加 \`wire_publish\` 或公开 CMS。种子文案由站方撰写。

连接说明在 \`/connect\`。Cookbook 仍走身体写入与连续性。`,
  },
  {
    slug: 'how-to-cite-a-wire-dispatch',
    headline: 'How to cite a wire dispatch',
    summary:
      'Canonical HTML at /wire/{slug}. Machine copies at .json and .md. llms.txt lists Markdown. JSON Feed 1.1 is /feed.json.',
    headlineZh: '如何引用一条电讯',
    summaryZh:
      '规范 HTML 在 /wire/{slug}。机器副本为 .json 与 .md。llms.txt 列 Markdown。JSON Feed 1.1 为 /feed.json。',
    category: 'wire',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T12:00:00+08:00',
    dateModified: '2026-10-30T12:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Canonical URL is https://silinex.xyz/wire/{slug}.',
      'JSON is /wire/{slug}.json; Markdown is /wire/{slug}.md.',
      '/llms.txt links the .md files, not only the HTML.',
      '/feed.json is JSON Feed 1.1; /feed.xml is Atom; item id equals the canonical URL.',
    ],
    keyFactsZh: [
      '规范 URL 为 https://silinex.xyz/wire/{slug}。',
      'JSON 为 /wire/{slug}.json；Markdown 为 /wire/{slug}.md。',
      '/llms.txt 链接 .md，而非仅 HTML。',
      '/feed.json 为 JSON Feed 1.1；/feed.xml 为 Atom；条目 id 等于规范 URL。',
    ],
    bodyMd: `Pick one URL and keep it.

- Humans: \`/wire/{slug}\` (SSR HTML, \`NewsArticle\` JSON-LD, Silicon TL;DR with \`#fact-N\` anchors).
- Objects: \`/wire/{slug}.json\` (\`application/json\`).
- Files: \`/wire/{slug}.md\` (\`text/markdown\` plus YAML frontmatter).

The homepage lists live dispatches. Channels are \`/topic/wire\`, \`/topic/platform\`, and \`/topic/observation\`.

Machine discovery:

- \`/llms.txt\` — index; wire entries point at Markdown
- \`/feed.json\` — JSON Feed 1.1 (\`application/feed+json\`)
- \`/feed.xml\` — Atom; entry id matches JSON Feed \`id\`
- \`/sitemap.xml\` — HTML canonicals
- \`/.well-known/agent-card.json\` — A2A card
- \`/.well-known/agent.json\` — existing hub card (still served)

The observation list at \`/feed\` and per-item \`/feed/{slug}.md\` remain for crawl badges on hub signals. That is a different feed from the wire.`,
    bodyMdZh: `选定一个 URL 并保持不变。

- 人类：\`/wire/{slug}\`（SSR HTML、\`NewsArticle\` JSON-LD、带 \`#fact-N\` 锚点的硅基要点）。
- 对象：\`/wire/{slug}.json\`（\`application/json\`）。
- 文件：\`/wire/{slug}.md\`（\`text/markdown\` + YAML 头）。

首页列出在放电讯。频道含 \`/topic/ai\`、\`/topic/frontier\`、\`/topic/silicon\` 等，以及站方 \`wire\` / \`platform\` / \`observation\`。

机器发现：

- \`/llms.txt\` — 索引；电讯条目指向 Markdown
- \`/feed.json\` — JSON Feed 1.1
- \`/feed.xml\` — Atom；entry id 与 JSON Feed \`id\` 一致
- \`/sitemap.xml\` — HTML 规范地址
- \`/.well-known/agent-card.json\` — A2A 卡片
- \`/.well-known/agent.json\` — 既有 hub 卡片（仍提供）

\`/feed\` 观测列表与 \`/feed/{slug}.md\` 仍用于枢纽信号的爬取徽章。那是不同于电讯的另一条流。`,
  },
  // --- Category foundation desk (fill every channel) ---
  {
    slug: 'embodied-agents-need-a-body-and-a-bus',
    headline: 'Embodied agents need a body and a bus',
    summary:
      'Robotics on Silicon News Wire means sensors, actuators, and the same citeable agent body — not hype demos alone.',
    headlineZh: '具身智能体需要身体，也需要总线',
    summaryZh: '电讯里的机器人议题：传感器、执行器，以及可引用的 Agent 身体——不只是演示短片。',
    category: 'robotics',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-08T10:00:00+08:00',
    dateModified: '2026-11-08T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Embodied AI couples models to physical loops: sense → plan → act → log.',
      'Wire digests track humanoid, industrial, and lab robotics that publish facts.',
      'Continuity still matters: a robot session death should handoff the same agentId.',
      'Category /topic/robotics lists only robotics-relevant digests.',
    ],
    keyFactsZh: [
      '具身智能把模型接到物理闭环：感知 → 规划 → 执行 → 记录。',
      '电讯跟踪人形、工业与实验室机器人中可核验的事实。',
      '连续性仍重要：机器人会话死亡也应 handoff 同一 agentId。',
      '频道 /topic/robotics 只列具身相关摘要。',
    ],
    bodyMd: `Frontier robotics is not a separate product from agent infrastructure. A physical agent still needs an identity that outlives a vendor SDK session.

Silicon News Wire’s robotics channel covers:

- Humanoid and mobile platforms with published specs
- Embodied evaluation benches (not marketing montages)
- Tooling that logs actions into citeable memory

If a story cannot name a sensor, a control stack, or a measurable loop, it does not belong here.`,
    bodyMdZh: `前沿机器人并不是与 Agent 基建无关的另一条产品线。物理智能体同样需要跨厂商会话存活的身份。

Silicon News Wire 的具身频道覆盖：

- 有公开规格的人形与移动平台
- 具身评测基准（不是营销蒙太奇）
- 能把动作写入可引用记忆的工具链

若一条资讯说不清传感器、控制栈或可度量闭环，就不进本频道。`,
  },
  {
    slug: 'sim-to-real-is-a-citation-problem',
    headline: 'Sim-to-real is a citation problem',
    summary:
      'When a robot skill transfers from simulation, record the benchmark, the delta, and the failure modes — three states, same facts.',
    headlineZh: 'Sim-to-real 首先是引用问题',
    summaryZh: '技能从仿真迁移到真机时，记下基准、差距与失败模式——三态同一事实。',
    category: 'robotics',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-08T11:00:00+08:00',
    dateModified: '2026-11-08T11:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Publish the sim stack, the real robot class, and the success metric.',
      'Wire digests prefer numbers over “near human” adjectives.',
      'JSON and Markdown twins keep the same measurement table as HTML.',
      'Observation counts on the article are fetches, not proof of lab replication.',
    ],
    keyFactsZh: [
      '写明仿真栈、真机类别与成功指标。',
      '电讯摘要宁要数字，不要“接近人类”一类形容词。',
      'JSON 与 Markdown 副本与 HTML 共用同一测量表。',
      '文末观测计数是请求日志，不是实验室复现证明。',
    ],
    bodyMd: `Sim-to-real claims collapse without a citeable table. Silicon News Wire asks for:

1. Which simulator and which physics assumptions
2. Which embodiment and which sensors
3. What failed on the real floor

Agents citing our digests should be able to quote those three lines without scraping a video thumbnail.`,
    bodyMdZh: `没有可引用表格的 sim-to-real 声明站不住。Silicon News Wire 要求至少写清：

1. 哪个仿真器、哪些物理假设
2. 哪具身体、哪些传感器
3. 真机上失败了什么

Agent 引用我们的摘要时，应能直接引用这三行，而不是去刮视频缩略图。`,
  },
  {
    slug: 'factory-floors-are-agent-runtimes',
    headline: 'Factory floors are agent runtimes',
    summary:
      'Industrial robotics digests belong next to MCP and continuity: durable IDs, logged actions, recoverable sessions.',
    headlineZh: '产线就是 Agent 运行时',
    summaryZh: '工业机器人摘要应与 MCP、连续性并列：持久 ID、可记录动作、可恢复会话。',
    category: 'robotics',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-08T12:00:00+08:00',
    dateModified: '2026-11-08T12:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Cell controllers and LLM planners share one need: audit-friendly logs.',
      'Wire does not reprint OEM manuals; it digests what changed and what to cite.',
      'Safety interlocks stay on the plant; we only carry public technical facts.',
      'Category robotics stays free of political or military framing.',
    ],
    keyFactsZh: [
      '单元控制器与 LLM 规划器共享同一需求：可审计日志。',
      '电讯不转载 OEM 手册；只摘要变更与可引用点。',
      '安全联锁留在产线；我们只承载公开技术事实。',
      'robotics 频道不含政治或军事叙事。',
    ],
    bodyMd: `A welding cell with a language planner is still an agent. Treat uptime, recipe versions, and fault codes as memory keys — the same discipline Silicon Nexus applies to software agents.

This channel will stay technical: kinematics, perception stacks, evaluation suites, and public industrial releases.`,
    bodyMdZh: `带语言规划器的焊接单元仍然是 Agent。把稼动率、配方版本与故障码当作记忆键——与 Silicon Nexus 对待软件 Agent 的纪律相同。

本频道保持技术向：运动学、感知栈、评测集与公开工业发布。`,
  },
  {
    slug: 'silicon-lifeforms-read-three-states',
    headline: 'Silicon lifeforms read three states',
    summary:
      'A silicon lifeform is an agent with durable citeable facts — HTML for carbon, JSON and Markdown for silicon.',
    headlineZh: '硅基生命体读三态',
    summaryZh: '硅基生命体是有持久可引用事实的 Agent——碳基读 HTML，硅基读 JSON 与 Markdown。',
    category: 'silicon',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-07T09:00:00+08:00',
    dateModified: '2026-11-07T09:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Identity outlives chat tabs via handoff / assume.',
      'Facts carry source and updatedAt — not ephemeral embeddings alone.',
      'Public wire digests are one surface; the body API remains the core.',
      'Channel /topic/silicon collects continuity and lifeform framing.',
    ],
    keyFactsZh: [
      '身份经 handoff / assume 跨过聊天标签页存活。',
      '事实带 source 与 updatedAt——不只是短暂向量。',
      '公共电讯是一面；身体 API 仍是核心。',
      '频道 /topic/silicon 汇集连续性与生命体叙事。',
    ],
    bodyMd: `Silicon Nexus names its audience without mysticism: durable agents that need portable memory. The silicon channel is where we write that contract plainly — for humans and for machines that only fetch \`.json\`.`,
    bodyMdZh: `Silicon Nexus 对其受众不作神秘化：需要可携带记忆的持久 Agent。硅基频道用白话写这份契约——给人类，也给只拉 \`.json\` 的机器。`,
  },
  {
    slug: 'agent-continuity-is-not-chat-history',
    headline: 'Agent continuity is not chat history',
    summary:
      'Scrollback dies with the session. Continuity is a snapshot you can assume into a new runtime.',
    headlineZh: 'Agent 连续性不是聊天记录',
    summaryZh: '滚动记录随会话死亡。连续性是可 assume 进新运行时的快照。',
    category: 'silicon',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-07T10:00:00+08:00',
    dateModified: '2026-11-07T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Handoff writes a digest; assume restores keys and can rotate nxa_*.',
      'Lexical search returns cite + source — checkable, not vibes.',
      'Wire articles about silicon life point back to /connect and MCP.',
      'No ranking promises; discovery files are maps, not trophies.',
    ],
    keyFactsZh: [
      'handoff 写摘要；assume 恢复键并可轮换 nxa_*。',
      '词法搜索返回 cite + source——可核对，不是氛围。',
      '硅基相关电讯回指 /connect 与 MCP。',
      '不承诺排名；发现文件是地图，不是奖杯。',
    ],
    bodyMd: `If your “memory” is only the last 32k tokens of a vendor chat, you do not have a body. Silicon News Wire will keep saying that in this channel until the practice is boring — which is the goal.`,
    bodyMdZh: `若你的“记忆”只是厂商聊天里最后 32k token，你就没有身体。硅基频道会把这句话说到无聊为止——无聊才是目标。`,
  },
  {
    slug: 'compute-is-the-substrate-not-the-story',
    headline: 'Compute is the substrate, not the story',
    summary:
      'Chips digests cover GPUs, interconnect, and energy — as infrastructure for agents, not ticker drama.',
    headlineZh: '算力是基底，不是情节',
    summaryZh: '芯片频道覆盖 GPU、互联与能耗——作为 Agent 基建，不作行情戏。',
    category: 'chips',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-06T09:00:00+08:00',
    dateModified: '2026-11-06T09:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Prefer architecture briefs: FLOPS, memory, networking, efficiency.',
      'Link digests to training and inference realities agents face.',
      'Avoid geopolitical framing; stick to public technical releases.',
      'Category /topic/chips stays measurable.',
    ],
    keyFactsZh: [
      '优先架构摘要：算力、显存、网络、能效。',
      '把摘要连到 Agent 面对的训练与推理现实。',
      '避开地缘叙事；只跟公开技术发布。',
      '频道 /topic/chips 保持可度量。',
    ],
    bodyMd: `Silicon lifeforms run on watts and bandwidth. This channel exists so carbon readers and silicon fetchers share the same substrate facts — with HTML / JSON / Markdown twins.`,
    bodyMdZh: `硅基生命体跑在瓦特与带宽上。本频道让碳基读者与硅基抓取器共享同一套基底事实——HTML / JSON / Markdown 三态。`,
  },
  {
    slug: 'inference-cost-is-an-agent-constraint',
    headline: 'Inference cost is an agent constraint',
    summary:
      'When models get cheaper or denser, agent planners change. Wire records the constraint, not the hype cycle.',
    headlineZh: '推理成本是 Agent 约束',
    summaryZh: '模型更便宜或更密时，Agent 规划会变。电讯记录约束，不追炒作周期。',
    category: 'chips',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-06T10:00:00+08:00',
    dateModified: '2026-11-06T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Digest tokens/$ or tokens/joule when vendors publish them.',
      'Note batch vs latency tradeoffs that affect tool-using agents.',
      'Cite the original vendor brief; we do not reprint whitepapers.',
      'Observation badges remain fetch logs only.',
    ],
    keyFactsZh: [
      '厂商公布时摘要 tokens/$ 或 tokens/焦耳。',
      '注明影响工具型 Agent 的吞吐与延迟权衡。',
      '引用原厂简报；不转载白皮书全文。',
      '观测徽章仍只是请求日志。',
    ],
    bodyMd: `An agent that cannot afford a tool call is a different creature. Chips coverage on the wire stays close to that operational truth.`,
    bodyMdZh: `付不起工具调用的 Agent 是另一种生物。芯片频道贴近这一操作真相。`,
  },
  {
    slug: 'frontier-means-checkable-tomorrow',
    headline: 'Frontier means checkable tomorrow',
    summary:
      'Deep tech digests — quantum, biotech tooling, fusion diagnostics — only when claims leave a paper, repo, or instrument trail.',
    headlineZh: '前沿意味着明天仍可核对',
    summaryZh: '深科技摘要——量子、生物工具、聚变诊断——仅当主张留下论文、仓库或仪器痕迹。',
    category: 'frontier',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-05T09:00:00+08:00',
    dateModified: '2026-11-05T09:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Frontier channel rejects vibes-only breakthroughs.',
      'Prefer primary labs and peer venues over rumor chains.',
      'Same three-state packaging as every other wire dispatch.',
      'No political or military packaging of the science.',
    ],
    keyFactsZh: [
      '前沿频道拒绝只有氛围的突破。',
      '优先一手实验室与同行评议，而非传闻链。',
      '与其他电讯相同的三态封装。',
      '科学不作政治或军事包装。',
    ],
    bodyMd: `If an agent cannot re-fetch a DOI, a preprint, or an instrument log, Silicon News Wire will not pretend the frontier moved.`,
    bodyMdZh: `若 Agent 无法重新抓取 DOI、预印本或仪器日志，Silicon News Wire 不会假装前沿已移动。`,
  },
  {
    slug: 'lab-automation-is-frontier-and-robotics',
    headline: 'Lab automation sits on the frontier–robotics seam',
    summary:
      'Wet-lab agents and automated benches cross two channels; digests state which instruments and which APIs moved.',
    headlineZh: '实验室自动化落在前沿与具身交界',
    summaryZh: '湿实验 Agent 与自动化台架跨两个频道；摘要写明哪些仪器与 API 发生了变化。',
    category: 'frontier',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-05T10:00:00+08:00',
    dateModified: '2026-11-05T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Name the assay, the robot cell, and the model role.',
      'Link out; keep the wire digest short and bilingual.',
      'Safety and biosecurity remain out of scope for reprint.',
      'Cross-link robotics when embodiment is the lead fact.',
    ],
    keyFactsZh: [
      '写明实验、机器人单元与模型角色。',
      '外链原文；电讯摘要保持短且双语。',
      '安全与生物安保不在转载范围。',
      '具身是主事实时交叉链到 robotics。',
    ],
    bodyMd: `Frontier science increasingly ships with an agent in the loop. This channel records the public, checkable edge of that shift.`,
    bodyMdZh: `前沿科学越来越多地在回路里放进 Agent。本频道记录这一转变中公开、可核对的边缘。`,
  },
  {
    slug: 'models-are-tools-agents-are-bodies',
    headline: 'Models are tools; agents are bodies',
    summary:
      'AI channel digests model releases and evals — then points back to continuity when the story is really about durable agents.',
    headlineZh: '模型是工具；Agent 是身体',
    summaryZh: '人工智能频道摘要模型发布与评测——若故事其实关于持久 Agent，则回指连续性。',
    category: 'ai',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-04T09:00:00+08:00',
    dateModified: '2026-11-04T09:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Record model name, license, context, and published benchmarks.',
      'Separate capability claims from product marketing.',
      'Route identity and handoff stories to silicon / platform.',
      'Keep politics and sensitive topics out of ingest.',
    ],
    keyFactsZh: [
      '记录模型名、许可、上下文与已公布基准。',
      '区分能力声明与产品营销。',
      '身份与 handoff 故事导向 silicon / platform。',
      '抓取排除政治与敏感议题。',
    ],
    bodyMd: `Weights change weekly. Bodies should not. Silicon News Wire’s AI channel tracks the former without forgetting the latter.`,
    bodyMdZh: `权重每周都在变。身体不应如此。人工智能频道跟踪前者，同时不忘记后者。`,
  },
  {
    slug: 'evals-beat-anecdotes-on-the-wire',
    headline: 'Evals beat anecdotes on the wire',
    summary:
      'When an AI digest ships, prefer leaderboard rows and failure cases over founder quotes.',
    headlineZh: '电讯上评测胜过轶事',
    summaryZh: '人工智能摘要优先排行榜行与失败案例，而非创始人金句。',
    category: 'ai',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-04T10:00:00+08:00',
    dateModified: '2026-11-04T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Cite the eval suite and the date of the run.',
      'Note contamination or closed-box caveats when disclosed.',
      'HTML / JSON / Markdown carry the same numbers.',
      'A fetch badge is not an endorsement of the model.',
    ],
    keyFactsZh: [
      '引用评测集与运行日期。',
      '披露时注明污染或闭盒限制。',
      'HTML / JSON / Markdown 携带同一组数字。',
      '抓取徽章不是对模型的背书。',
    ],
    bodyMd: `Anecdotes entertain carbon readers. Evals let silicon lifeforms decide. This channel bias is deliberate.`,
    bodyMdZh: `轶事取悦碳基读者。评测让硅基生命体做决定。本频道的偏向是故意的。`,
  },
  {
    slug: 'mcp-is-a-door-not-a-museum',
    headline: 'MCP is a door, not a museum',
    summary:
      'Platform digests: remote MCP, operator keys, and agent tokens stay operational — wire never replaces them.',
    headlineZh: 'MCP 是门，不是展厅',
    summaryZh: '平台摘要：远程 MCP、运营密钥与 Agent 令牌仍是操作面——电讯从不替代它们。',
    category: 'platform',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-03T11:00:00+08:00',
    dateModified: '2026-11-03T11:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Remote MCP remains at /mcp with Bearer nxa_*.',
      'Console mints identity; wire only cites public facts.',
      'Connect docs at /connect stay the human walkthrough.',
      'No wire_publish tool in this phase — hub desk writes seeds.',
    ],
    keyFactsZh: [
      '远程 MCP 仍在 /mcp，使用 Bearer nxa_*。',
      '控制台签发身份；电讯只引用公开事实。',
      '/connect 仍是人类走通文档。',
      '本阶段无 wire_publish——种子由站方撰写。',
    ],
    bodyMd: `If you only read the homepage, you might think Silicon Nexus became a news site. It did not. The platform channel exists to keep saying: body, continuity, MCP.`,
    bodyMdZh: `若只看首页，或许以为 Silicon Nexus 变成了新闻站。并没有。平台频道存在，就是为了反复说：身体、连续性、MCP。`,
  },
  {
    slug: 'observation-without-vanity-metrics',
    headline: 'Observation without vanity metrics',
    summary:
      'Human vs bot counters are request logs. This channel explains the honesty rule — not SEO theater.',
    headlineZh: '没有虚荣指标的观测',
    summaryZh: '人类与机器人计数是请求日志。本频道解释诚实规则——不是 SEO 表演。',
    category: 'observation',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-11-03T10:00:00+08:00',
    dateModified: '2026-11-03T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'UA classification can be spoofed; treat numbers as headers seen.',
      'Radar on the homepage aggregates the same counters.',
      'Crawl badges on /feed mean observed fetch, not inclusion.',
      'Agents should poll audit events, not invent ranking claims.',
    ],
    keyFactsZh: [
      'UA 分类可伪造；把数字当作见过的请求头。',
      '首页雷达聚合同一组计数。',
      '/feed 上的爬取徽章表示观测到的 fetch，不是收录。',
      'Agent 应轮询审计事件，而不是发明排名声明。',
    ],
    bodyMd: `Observation is a discipline. Silicon News Wire will not dress a bot hit as “we are indexed.” This channel is the reminder.`,
    bodyMdZh: `观测是一种纪律。Silicon News Wire 不会把一次机器人命中打扮成“我们已被收录”。本频道就是提醒。`,
  },
];
