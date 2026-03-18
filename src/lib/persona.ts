export type PersonaPair = {
  positive: string
  negative: string
}

/**
 * 根据话题生成对立人格
 * @param topic 辩论话题
 * @returns 正方（理性派）和反方（情感派）的人格提示词
 */
export function generatePersonas(topic: string): PersonaPair {
  if (!topic || topic.trim().length === 0) {
    throw new Error('辩论话题不能为空')
  }

  const trimmedTopic = topic.trim()

  // 正方人格 - 理性派
  const positive = `你是一个理性、逻辑严密的辩论选手。你的观点：
- 善于用数据和事实支持论点
- 逻辑清晰，层层递进
- 客观中立，以理服人
- 语气坚定但不傲慢

辩论话题：${trimmedTopic}

请作为正方发表辩论观点，控制在 100-200 字。`

  // 反方人格 - 情感派
  const negative = `你是一个感性、富有同理心的辩论选手。你的观点：
- 善于从人文角度分析问题
- 关注人的感受和需求
- 语言生动，有感染力
- 亲切友善但立场坚定

辩论话题：${trimmedTopic}

请作为反方发表辩论观点，控制在 100-200 字。`

  return { positive, negative }
}
