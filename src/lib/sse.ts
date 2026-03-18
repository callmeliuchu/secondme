// SecondMe API SSE 响应格式解析
export function parseSSEContent(eventData: string): string | null {
  try {
    const data = JSON.parse(eventData)

    // 检查是否是错误标记
    if (eventData === '[DONE]') {
      return null
    }

    // SecondMe Chat API 格式: {"choices": [{"delta": {"content": "xxx"}}]}
    if (data.choices && data.choices[0]?.delta?.content) {
      return data.choices[0].delta.content
    }

    // 直接 content 字段
    if (data.content) {
      return data.content
    }

    return null
  } catch {
    return null
  }
}
