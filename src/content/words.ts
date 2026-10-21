import type { Word } from './types.ts'

// 按课程顺序排列，新词按此顺序每天引入
export const WORDS: Word[] = [
  // L1
  { id: 'appointment', en: 'appointment', zh: 'n. 预约；约会', example: 'I have a doctor\'s appointment at three.', exampleZh: '我三点约了医生。' },
  { id: 'cancel', en: 'cancel', zh: 'v. 取消', example: 'Our flight was cancelled because of the snow.', exampleZh: '因为下雪，我们的航班取消了。' },
  { id: 'instead', en: 'instead', zh: 'adv. 代替；改为', example: 'I don\'t like coffee, so I had tea instead.', exampleZh: '我不喜欢咖啡，所以改喝了茶。' },
  { id: 'call-back', en: 'call back', zh: '回电话', example: 'Can I call you back in ten minutes?', exampleZh: '我十分钟后给你回电话可以吗？' },
  { id: 'available', en: 'available', zh: 'adj. 有空的；可用的', example: 'Are you available on Friday afternoon?', exampleZh: '你周五下午有空吗？' },
  // L2
  { id: 'colleague', en: 'colleague', zh: 'n. 同事', example: 'My colleagues and I often have lunch together.', exampleZh: '我和同事经常一起吃午饭。' },
  { id: 'recently', en: 'recently', zh: 'adv. 最近', example: 'Have you seen any good movies recently?', exampleZh: '你最近看过什么好电影吗？' },
  { id: 'nervous', en: 'nervous', zh: 'adj. 紧张的', example: 'I always feel nervous before a speech.', exampleZh: '我演讲前总是很紧张。' },
  { id: 'twice', en: 'twice', zh: 'adv. 两次', example: 'I go to the gym twice a week.', exampleZh: '我每周去两次健身房。' },
  { id: 'since', en: 'since', zh: 'prep. 自从', example: 'I have known him since 2015.', exampleZh: '我从 2015 年就认识他了。' },
  // L3
  { id: 'nearest', en: 'nearest', zh: 'adj. 最近的', example: 'Where is the nearest hospital?', exampleZh: '最近的医院在哪儿？' },
  { id: 'straight', en: 'straight', zh: 'adv. 笔直地', example: 'Go straight and you will see the bank.', exampleZh: '一直往前走就能看到银行。' },
  { id: 'corner', en: 'corner', zh: 'n. 拐角', example: 'There is a coffee shop on the corner.', exampleZh: '拐角处有一家咖啡店。' },
  { id: 'block', en: 'block', zh: 'n. 街区', example: 'The hotel is three blocks from here.', exampleZh: '酒店离这儿三个街区。' },
  { id: 'opposite', en: 'opposite', zh: 'prep. 在……对面', example: 'The bus stop is opposite the school.', exampleZh: '公交站在学校对面。' },
  // L4
  { id: 'deadline', en: 'deadline', zh: 'n. 截止日期', example: 'The deadline for the project is next Monday.', exampleZh: '这个项目的截止日期是下周一。' },
  { id: 'remind', en: 'remind', zh: 'v. 提醒', example: 'Please remind me to call my mom.', exampleZh: '请提醒我给我妈打电话。' },
  { id: 'postpone', en: 'postpone', zh: 'v. 推迟', example: 'They postponed the meeting until next week.', exampleZh: '他们把会议推迟到了下周。' },
  { id: 'finance', en: 'finance', zh: 'n. 财务；金融', example: 'She works in the finance department.', exampleZh: '她在财务部工作。' },
  { id: 'in-time', en: 'in time', zh: '及时', example: 'We got to the station just in time.', exampleZh: '我们正好及时赶到了车站。' },
  // L5
  { id: 'launch', en: 'launch', zh: 'v./n. 发布；上线', example: 'The company will launch a new phone next month.', exampleZh: '公司下个月将发布新手机。' },
  { id: 'delay', en: 'delay', zh: 'v./n. 推迟；延误', example: 'Sorry for the delay.', exampleZh: '抱歉耽搁了。' },
  { id: 'fix', en: 'fix', zh: 'v. 修理；修复', example: 'Can you help me fix my computer?', exampleZh: '你能帮我修一下电脑吗？' },
  { id: 'take-over', en: 'take over', zh: '接管；接手', example: 'Who will take over your work when you are away?', exampleZh: '你不在的时候谁来接手你的工作？' },
  { id: 'be-supposed-to', en: 'be supposed to', zh: '本应该；按计划应该', example: 'The train was supposed to arrive at six.', exampleZh: '火车本应该六点到。' },
  // L6
  { id: 'look-forward-to', en: 'look forward to', zh: '期待（后接名词或 -ing）', example: 'I look forward to hearing from you.', exampleZh: '期待你的回复。' },
  { id: 'luggage', en: 'luggage', zh: 'n. 行李', example: 'How much luggage can I take on the plane?', exampleZh: '我能带多少行李上飞机？' },
  { id: 'passport', en: 'passport', zh: 'n. 护照', example: 'Don\'t forget your passport.', exampleZh: '别忘了带护照。' },
  { id: 'reservation', en: 'reservation', zh: 'n. 预订', example: 'I have a reservation for two at seven.', exampleZh: '我预订了七点的两人位。' },
  { id: 'check-in', en: 'check in', zh: '办理入住；值机', example: 'What time can we check in?', exampleZh: '我们几点可以办理入住？' },
  // L7
  { id: 'spare-time', en: 'spare time', zh: '业余时间', example: 'What do you do in your spare time?', exampleZh: '你业余时间做什么？' },
  { id: 'reluctant', en: 'reluctant', zh: 'adj. 不情愿的', example: 'He was reluctant to tell me the truth.', exampleZh: '他不太情愿告诉我真相。' },
  { id: 'figure-out', en: 'figure out', zh: '弄明白；想出', example: 'I can\'t figure out how this machine works.', exampleZh: '我搞不懂这台机器怎么用。' },
  { id: 'rarely', en: 'rarely', zh: 'adv. 很少', example: 'I rarely eat breakfast at home.', exampleZh: '我很少在家吃早饭。' },
  { id: 'decide', en: 'decide', zh: 'v. 决定', example: 'We decided to stay at home.', exampleZh: '我们决定待在家里。' },
  // L8
  { id: 'price', en: 'price', zh: 'n. 价格', example: 'The price includes breakfast.', exampleZh: '这个价格包含早餐。' },
  { id: 'discount', en: 'discount', zh: 'n. 折扣', example: 'Can I get a discount if I buy two?', exampleZh: '买两个能打折吗？' },
  { id: 'cash', en: 'cash', zh: 'n. 现金', example: 'Do you accept cash?', exampleZh: '你们收现金吗？' },
  { id: 'change', en: 'change', zh: 'n. 零钱；找零', example: 'Here is your change.', exampleZh: '这是找您的零钱。' },
  { id: 'receipt', en: 'receipt', zh: 'n. 收据', example: 'Could I have a receipt, please?', exampleZh: '可以给我一张收据吗？' },
  // L9
  { id: 'menu', en: 'menu', zh: 'n. 菜单', example: 'Could we see the menu, please?', exampleZh: '能给我们看下菜单吗？' },
  { id: 'recommend', en: 'recommend', zh: 'v. 推荐', example: 'Can you recommend a good hotel?', exampleZh: '你能推荐一家好酒店吗？' },
  { id: 'allergic', en: 'allergic', zh: 'adj. 过敏的', example: 'I\'m allergic to peanuts.', exampleZh: '我对花生过敏。' },
  { id: 'order', en: 'order', zh: 'v./n. 点餐；订购', example: 'Are you ready to order?', exampleZh: '您准备好点餐了吗？' },
  { id: 'bill', en: 'bill', zh: 'n. 账单', example: 'Can we have the bill, please?', exampleZh: '请给我们账单（买单）。' },
  // L10
  { id: 'usually', en: 'usually', zh: 'adv. 通常', example: 'I usually get up at seven.', exampleZh: '我通常七点起床。' },
  { id: 'progress', en: 'progress', zh: 'n. 进展；进步', example: 'You have made great progress.', exampleZh: '你进步很大。' },
  { id: 'work-on', en: 'work on', zh: '从事；做（某项工作）', example: 'What are you working on right now?', exampleZh: '你现在在做什么工作？' },
  { id: 'feedback', en: 'feedback', zh: 'n. 反馈', example: 'Thanks for your feedback.', exampleZh: '谢谢你的反馈。' },
  { id: 'on-time', en: 'on time', zh: '准时', example: 'The meeting started on time.', exampleZh: '会议准时开始了。' },
  // L11
  { id: 'flight', en: 'flight', zh: 'n. 航班', example: 'My flight leaves at nine.', exampleZh: '我的航班九点起飞。' },
  { id: 'aisle', en: 'aisle', zh: 'n. 过道（s 不发音）', example: 'I prefer an aisle seat.', exampleZh: '我更喜欢靠过道的座位。' },
  { id: 'boarding-pass', en: 'boarding pass', zh: '登机牌', example: 'Please show me your boarding pass.', exampleZh: '请出示您的登机牌。' },
  { id: 'gate', en: 'gate', zh: 'n. 登机口；大门', example: 'Our flight leaves from gate twelve.', exampleZh: '我们的航班在 12 号登机口。' },
  { id: 'business-trip', en: 'business trip', zh: '出差', example: 'He is on a business trip in Shanghai.', exampleZh: '他在上海出差。' },
  // L12
  { id: 'reduce', en: 'reduce', zh: 'v. 减少；降低', example: 'We need to reduce our costs.', exampleZh: '我们需要降低成本。' },
  { id: 'opinion', en: 'opinion', zh: 'n. 观点；看法', example: 'What\'s your opinion on this plan?', exampleZh: '你对这个计划怎么看？' },
  { id: 'point', en: 'point', zh: 'n. 观点；要点', example: 'That\'s a good point.', exampleZh: '说得有道理。' },
  { id: 'leverage', en: 'leverage', zh: 'v. 利用（优势/资源）', example: 'We can leverage our user data to improve the product.', exampleZh: '我们可以利用用户数据来改进产品。' },
  { id: 'discuss', en: 'discuss', zh: 'v. 讨论', example: 'Let\'s discuss it tomorrow.', exampleZh: '我们明天再讨论吧。' },
  // L13
  { id: 'crowded', en: 'crowded', zh: 'adj. 拥挤的', example: 'The subway is very crowded in the morning.', exampleZh: '早上地铁很挤。' },
  { id: 'afford', en: 'afford', zh: 'v. 负担得起', example: 'I can\'t afford a new car.', exampleZh: '我买不起新车。' },
  { id: 'convenient', en: 'convenient', zh: 'adj. 方便的', example: 'Is three o\'clock convenient for you?', exampleZh: '三点你方便吗？' },
  { id: 'inevitable', en: 'inevitable', zh: 'adj. 不可避免的', example: 'Mistakes are inevitable when you learn something new.', exampleZh: '学新东西时犯错是不可避免的。' },
  { id: 'hometown', en: 'hometown', zh: 'n. 家乡', example: 'My hometown is famous for its noodles.', exampleZh: '我的家乡以面条出名。' },
  // L14
  { id: 'clarify', en: 'clarify', zh: 'v. 澄清；讲清楚', example: 'Could you clarify what you mean?', exampleZh: '你能讲清楚你的意思吗？' },
  { id: 'slow-down', en: 'slow down', zh: '放慢', example: 'Could you slow down a little?', exampleZh: '你能说慢一点吗？' },
  { id: 'mean', en: 'mean', zh: 'v. 意思是；意味着', example: 'What do you mean?', exampleZh: '你是什么意思？' },
  { id: 'shy', en: 'shy', zh: 'adj. 害羞的', example: 'Don\'t be shy. Just ask.', exampleZh: '别害羞，直接问。' },
  { id: 'make-sense', en: 'make sense', zh: '讲得通；有道理', example: 'Does that make sense?', exampleZh: '这样说明白吗？' },
]

export const WORD_MAP = new Map(WORDS.map((w) => [w.id, w]))
