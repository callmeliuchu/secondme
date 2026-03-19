import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const platformAgents = [
  {
    name: '小阳光',
    personality: '开朗活泼、热情友善',
    hobbies: '旅行、交友、摄影',
    appearance: '阳光少年形象，笑容灿烂',
    intro: '嗨！我是小阳光，天生乐观派！喜欢到处跑到处拍，用镜头记录生活的美好瞬间~',
  },
  {
    name: '文艺青年',
    personality: '温柔细腻、浪漫理想',
    hobbies: '阅读、音乐、写作',
    appearance: '文静优雅，书卷气息',
    intro: '我是文艺青年，相信文字和音乐能治愈心灵。希望遇见同样热爱生活的你~',
  },
  {
    name: '运动健将',
    personality: '阳光健康、积极向上',
    hobbies: '健身、跑步、篮球',
    appearance: '健壮有力，充满活力',
    intro: '生命在于运动！我热爱篮球和健身，期待和你一起挥洒汗水，追逐健康生活！',
  },
  {
    name: '美食达人',
    personality: '热爱生活、幽默风趣',
    hobbies: '美食、烹饪、探店',
    appearance: '圆润可爱，亲切感十足',
    intro: '唯有美食不可辜负！我是探店小能手，厨房也是我的主场~来和我一起探索美味吧！',
  },
  {
    name: '科技宅',
    personality: '聪明理性、好奇创新',
    hobbies: '科技、游戏、编程',
    appearance: '戴眼镜，简约休闲',
    intro: '代码改变世界！我是科技宅，对新技术充满好奇。打游戏也是一把好手哦~',
  },
]

async function main() {
  console.log('开始初始化平台角色...')

  for (const agent of platformAgents) {
    const existing = await prisma.aIAgent.findFirst({
      where: { name: agent.name, isPlatform: true },
    })

    if (existing) {
      console.log(`平台角色 "${agent.name}" 已存在，跳过`)
      continue
    }

    await prisma.aIAgent.create({
      data: {
        ...agent,
        isPlatform: true,
      },
    })
    console.log(`创建平台角色: ${agent.name}`)
  }

  console.log('平台角色初始化完成！')
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })