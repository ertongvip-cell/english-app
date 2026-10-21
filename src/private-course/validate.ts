import { PRIVATE_COURSE_VERSION, type LearningPlan, type PrivateLesson, type ValidationResult } from './schema.ts'

const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const str=(v:unknown)=>typeof v==='string'&&v.trim().length>0
const strs=(v:unknown)=>Array.isArray(v)&&v.every(str)
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)

export function validatePrivateLesson(value:unknown):ValidationResult{
 const e:string[]=[]
 if(!obj(value))return{valid:false,errors:['课程包必须是对象']}
 if(value.schemaVersion!==PRIVATE_COURSE_VERSION)e.push('不支持的 schemaVersion')
 if(!str(value.id)||!/^[a-z0-9][a-z0-9:._-]*$/i.test(String(value.id)))e.push('课程 id 无效')
 if(!obj(value.source)||!str(value.source.title)||!str(value.source.language))e.push('source 信息不完整')
 const arrays=['sentences','concepts','vocabulary','grammar','chunks','retell','transfers'] as const
 for(const k of arrays)if(!Array.isArray(value[k]))e.push(`${k} 必须是数组`)
 if(e.length)return{valid:false,errors:e}
 const lesson=value as unknown as PrivateLesson
 const unique=(items:{id:string}[],name:string)=>{const ids=items.map(x=>x.id);if(ids.some(x=>!str(x)))e.push(`${name} 存在空 id`);if(new Set(ids).size!==ids.length)e.push(`${name} id 重复`)}
 unique(lesson.sentences,'sentences');unique(lesson.concepts,'concepts');unique(lesson.vocabulary,'vocabulary');unique(lesson.grammar,'grammar');unique(lesson.chunks,'chunks');unique(lesson.retell,'retell');unique(lesson.transfers,'transfers')
 const sentenceIds=new Set(lesson.sentences.map(x=>x.id)),grammarIds=new Set(lesson.grammar.map(x=>x.id))
 let previous=-1
 lesson.sentences.forEach((s,i)=>{if(!str(s.text))e.push(`sentences[${i}].text 为空`);if(s.startMs!=null){if(!num(s.startMs)||s.startMs<0)e.push(`${s.id}.startMs 无效`);if(s.startMs<previous)e.push(`${s.id} 时间轴倒序`);previous=s.startMs}if(s.endMs!=null&&(!num(s.endMs)||s.endMs<=(s.startMs??-1)))e.push(`${s.id}.endMs 无效`)})
 lesson.concepts.forEach(x=>{if(!str(x.prompt)||!strs(x.options)||x.options.length<2||!Number.isInteger(x.answer)||x.answer<0||x.answer>=x.options.length)e.push(`${x.id} 概念题无效`);x.sentenceIds?.forEach(id=>{if(!sentenceIds.has(id))e.push(`${x.id} 引用了不存在的句子 ${id}`)})})
 lesson.vocabulary.forEach(x=>{if(!str(x.word)||!str(x.definitionEn)||!strs(x.collocations)||!strs(x.examples))e.push(`${x.id} 词汇信息不完整`)})
 lesson.grammar.forEach(x=>{if(!str(x.title)||!str(x.explanationEn)||!strs(x.examples))e.push(`${x.id} 语法信息不完整`)})
 lesson.chunks.forEach(x=>{if(!str(x.chunk)||!str(x.scenario)||!strs(x.acceptableAnswers)||!num(x.targetMs)||x.targetMs<1000||x.targetMs>15000)e.push(`${x.id} 反应训练无效`);if(x.grammarId&&!grammarIds.has(x.grammarId))e.push(`${x.id} 引用了不存在的语法 ${x.grammarId}`)})
 lesson.retell.forEach(x=>{if(!str(x.prompt)||!strs(x.keywords)||!num(x.targetSeconds)||x.targetSeconds<10||x.targetSeconds>180)e.push(`${x.id} 复述任务无效`)})
 lesson.transfers.forEach(x=>{if(!str(x.situation)||!str(x.role)||!strs(x.acceptableAnswers)||!strs(x.keywords))e.push(`${x.id} 迁移任务无效`)})
 if(lesson.media&&(!str(lesson.media.fileName)||lesson.media.durationMs!=null&&(!num(lesson.media.durationMs)||lesson.media.durationMs<=0)))e.push('media 信息无效')
 return{valid:e.length===0,errors:e}
}

export function validateLearningPlan(value:unknown,knownLessonIds?:Set<string>):ValidationResult{
 const e:string[]=[]
 if(!obj(value))return{valid:false,errors:['学习计划必须是对象']}
 if(value.schemaVersion!==PRIVATE_COURSE_VERSION)e.push('不支持的 schemaVersion')
 if(!str(value.id)||!str(value.title)||!strs(value.lessonIds)||!str(value.startLessonId)||!str(value.createdAt))e.push('学习计划字段不完整')
 if(e.length)return{valid:false,errors:e}
 const p=value as unknown as LearningPlan
 if(new Set(p.lessonIds).size!==p.lessonIds.length)e.push('课程 ID 重复')
 if(!p.lessonIds.includes(p.startLessonId))e.push('起始课程不在计划中')
 if(knownLessonIds)p.lessonIds.forEach(id=>{if(!knownLessonIds.has(id))e.push(`找不到课程 ${id}`)})
 return{valid:e.length===0,errors:e}
}

export function assertPrivateLesson(value:unknown):asserts value is PrivateLesson{const r=validatePrivateLesson(value);if(!r.valid)throw new Error(r.errors.join('；'))}
export function assertLearningPlan(value:unknown):asserts value is LearningPlan{const r=validateLearningPlan(value);if(!r.valid)throw new Error(r.errors.join('；'))}
