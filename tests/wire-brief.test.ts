import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { composeWireBrief } from '../src/server/wireBrief.ts';

describe('wire brief rewrite', () => {
  test('produces structured paraphrased body with attribution', async () => {
    const brief = await composeWireBrief({
      title: 'Open lab ships a new robotics benchmark',
      rssSummary:
        'Researchers released a public robotics benchmark covering manipulation tasks. The suite includes success rates and failure logs. Teams can compare agents under the same protocol.',
      sourceName: 'MIT Technology Review',
      link: 'https://www.technologyreview.com/example',
      lang: 'en',
    });
    assert.match(brief.bodyMd, /## Wire brief/);
    assert.match(brief.bodyMd, /## Source & notice/);
    assert.match(brief.bodyMd, /not a verbatim full-text reprint/i);
    assert.match(brief.bodyMd, /technologyreview\.com\/example/);
    assert.ok(brief.bodyMd.length > 280);
    assert.ok(brief.keyFacts.length >= 2);
    assert.ok(brief.summary.length > 40);
    assert.doesNotMatch(brief.bodyMd, /首页|RSS订阅|软媒魔方/);
  });

  test('Chinese brief uses 电讯正文 and 来源声明', async () => {
    const brief = await composeWireBrief({
      title: '开源具身评测集发布',
      rssSummary:
        '研究团队公开了一套机器人操作评测。评测包含成功率与失败记录。各方可按同一协议比较智能体表现。团队表示将持续更新任务集，便于社区对齐评测口径。',
      sourceName: '量子位',
      link: 'https://www.qbitai.com/example',
      lang: 'zh',
      pageExtract:
        '首页 IT圈 最会买 设置 日夜间 研究团队公开了一套机器人操作评测。评测包含成功率与失败记录。各方可按同一协议比较智能体表现。',
    });
    assert.match(brief.bodyMd, /## 电讯正文/);
    assert.match(brief.bodyMd, /## 来源与声明/);
    assert.match(brief.bodyMd, /不是原文全文转载/);
    assert.doesNotMatch(brief.bodyMd, /IT圈|最会买|日夜间/);
    assert.ok(brief.bodyMd.length > 180);
  });
});
