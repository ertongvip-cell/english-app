declare const process: { exit(code: number): never }
import { WORDS, GRAMMAR, DIALOGUES, LESSONS } from '../src/content/index.ts'

let errors = 0
const check = (ok: unknown, message: string) => { if (!ok) { console.error(`✗ ${message}`); errors++ } }
const unique = <T>(items:T[], get:(x:T)=>string, name:string) => {
 const ids=items.map(get); check(new Set(ids).size===ids.length,`${name} ID 必须唯一`)
}
unique(WORDS,x=>x.id,'单词'); unique(GRAMMAR,x=>x.id,'语法'); unique(DIALOGUES,x=>x.id,'对话'); unique(LESSONS,x=>x.id,'课程')
const wi=new Set(WORDS.map(x=>x.id)), gi=new Set(GRAMMAR.map(x=>x.id)), di=new Set(DIALOGUES.map(x=>x.id))
check(LESSONS.length===14,`应有 14 课，实际 ${LESSONS.length}`)
for(const l of LESSONS){
 check(l.sentences.length===l.zh.length,`${l.id} 原文和翻译句数不一致`)
 check(l.sentences.length>=4,`${l.id} 课文过短`); check(l.words.length===5,`${l.id} 应有 5 个词`)
 l.words.forEach(id=>check(wi.has(id),`${l.id} 引用了不存在的单词 ${id}`))
 check(gi.has(l.grammarId),`${l.id} 语法引用不存在`); check(di.has(l.dialogueId),`${l.id} 对话引用不存在`)
 check(l.questions.length>=2,`${l.id} 至少需要 2 道题`)
 l.questions.forEach((q,i)=>check(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,`${l.id} 第 ${i+1} 题答案越界`))
}
for(const g of GRAMMAR){ check(g.drills.length>0,`${g.id} 缺少练习`); g.drills.forEach(d=>check(d.answers.length>0,`${g.id} 练习无答案`)) }
for(const d of DIALOGUES){ check(d.turns.some(t=>t.role==='user'),`${d.id} 缺少用户回合`) }
if(errors){ console.error(`\n内容校验失败：${errors} 个问题`); process.exit(1) }
console.log(`内容校验通过：${LESSONS.length} 课，${WORDS.length} 个词，${GRAMMAR.length} 个语法点，${DIALOGUES.length} 段对话`)
