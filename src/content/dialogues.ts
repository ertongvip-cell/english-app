import type { Dialogue } from './types.ts'

const specs = [
 ['daily','改约时间','朋友','你需要把上午十点的见面改到下午两点。','Are we still meeting at ten?','我们改到下午两点见可以吗？','Could we meet at two in the afternoon instead?','meet at two'],
 ['work','认识同事','新同事','与新同事聊工作经历。','How long have you worked here?','我在这里工作五年了。','I have worked here for five years.','have worked|for five years'],
 ['travel','问路','路人','询问最近的地铁站。','Can I help you?','你知道最近的地铁站在哪吗？','Do you know where the nearest subway station is?','do you know where|station is'],
 ['work','承认疏漏','经理','你忘了提前提醒经理。','Why didn’t you tell me earlier?','我本应该早点告诉你的。','I should have told you earlier.','should have told'],
 ['work','项目延期','同事','说明报告的完成时间。','When will the report be ready?','报告明天上午会完成。','The report will be finished tomorrow morning.','will be finished'],
 ['travel','酒店入住','前台','确认入住安排。','We have your reservation.','我期待住在这里。','I am looking forward to staying here.','look forward to staying'],
 ['daily','业余爱好','朋友','聊自己的英语学习。','What do you do in your spare time?','我喜欢学英语。','I enjoy learning English.','enjoy learning'],
 ['travel','购物结账','收银员','付款后索要收据。','That will be twenty dollars.','请给我一张收据好吗？','Could I have a receipt, please?','could i have|receipt'],
 ['travel','餐厅点餐','服务员','询问推荐并说明过敏。','Are you ready to order?','你能推荐一道不含花生的菜吗？','Could you recommend a dish without peanuts?','could you recommend|without peanuts'],
 ['work','汇报进度','经理','说明自己目前在做什么。','What are you working on right now?','我现在正在做付款页面。','I am working on the payment page right now.','am working on'],
 ['travel','机场值机','工作人员','说明上周出差。','Is this a holiday trip?','不是，我上周去上海出差了。','No, I went to Shanghai on a business trip last week.','went to shanghai|last week'],
 ['work','会议表达观点','同事','建议降低价格。','What do you think we should do?','我认为我们应该降低价格。','I think we should reduce the price.','i think we should|reduce the price'],
 ['daily','旅行愿望','朋友','谈有更多时间时想做什么。','Would you like to travel more?','如果我有更多时间，我会多旅行。','If I had more time, I would travel more.','if i had|i would travel'],
 ['work','请求澄清','同事','会议中没有听懂。','We should leverage the existing channel.','抱歉，你能解释一下你的意思吗？','Sorry, could you explain what you mean?','could you explain|what you mean'],
] as const

export const DIALOGUES: Dialogue[] = specs.map((s,i)=>({
 id:`d${i+1}`, scene:s[0], title:s[1], roleName:s[2], intro:s[3],
 turns:[{role:'app',en:s[4],zh:''},{role:'user',zh:s[5],answers:[s[6]],keywords:s[7].split('|')}],
 betterSay:[{en:s[6],zh:s[5]}],
}))
export const DIALOGUE_MAP = new Map(DIALOGUES.map(x=>[x.id,x]))
