import { allImports, putImport, putPrivateBatch, type ImportedLesson } from './db.ts'
import { assertPrivateLesson, validateLearningPlan } from '../private-course/validate.ts'
import type { LearningPlan, PrivateLesson } from '../private-course/schema.ts'

const base=(name:string)=>name.replace(/\.[^.]+$/,'').trim().toLowerCase()
const splitSentences=(text:string)=>text.replace(/^\uFEFF/,'').split(/(?<=[.!?。！？])\s+|\r?\n+/).map(x=>x.trim()).filter(Boolean)
const isAudio=(name:string)=>/\.(mp3|m4a|wav|aac|ogg)$/i.test(name)
const sha256=async(file:Blob)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('')
export interface ImportResult {added:number;plans:number;warnings:string[]}

export async function importFiles(files:File[]):Promise<ImportResult>{
 const warnings:string[]=[],audioByName=new Map(files.filter(f=>isAudio(f.name)).map(f=>[f.name.toLowerCase(),f])),packageFiles=files.filter(f=>f.name.toLowerCase().endsWith('.lesson.json')),planFiles=files.filter(f=>f.name.toLowerCase()==='learning-plan.json'||f.name.toLowerCase().endsWith('.plan.json')),oldItems=await allImports(),oldMap=new Map(oldItems.map(x=>[x.id,x])),staged:ImportedLesson[]=[],stagedPlans:LearningPlan[]=[]

 // 私有包先全部解析、校验并核对媒体；任一无效都会在写库前终止整批
 for(const file of packageFiles){
  const value:unknown=JSON.parse(await file.text());assertPrivateLesson(value);const lesson:PrivateLesson=value,old=oldMap.get(lesson.id),selected=lesson.media?.fileName?audioByName.get(lesson.media.fileName.toLowerCase()):undefined,audio=selected??old?.audio
  if(lesson.media?.checksum&&audio){const actual=await sha256(audio);if(actual!==lesson.media.checksum)throw new Error(`${lesson.source.title}：音频校验失败，请重新选择正确文件`)}
  if(lesson.media&&!audio)warnings.push(`${lesson.source.title}：未选择配套音频 ${lesson.media.fileName}`)
  staged.push({id:lesson.id,title:lesson.source.title,sentences:lesson.sentences.map(x=>x.text),privateLesson:lesson,audio,audioName:selected?.name??old?.audioName,createdAt:old?.createdAt??Date.now()})
 }
 const known=new Set(staged.map(x=>x.id))
 for(const file of planFiles){const value=JSON.parse(await file.text()) as LearningPlan,result=validateLearningPlan(value,known);if(!result.valid)throw new Error(`${file.name}：${result.errors.join('；')}`);stagedPlans.push(value)}
 if(staged.length||stagedPlans.length)await putPrivateBatch(staged,stagedPlans)

 // 兼容原有 TXT/MD + 同名音频；不参与私有课程包事务
 const ignored=new Set([...packageFiles,...planFiles]),groups=new Map<string,{text?:File;audio?:File}>()
 for(const f of files){if(ignored.has(f))continue;const key=base(f.name),g=groups.get(key)??{};if(/\.(txt|md)$/i.test(f.name))g.text=f;else if(isAudio(f.name))g.audio=f;groups.set(key,g)}
 let legacy=0
 for(const [key,g] of groups){if(!g.text)continue;const raw=await g.text.text(),lines=raw.replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),title=lines.shift()||key,sentences=splitSentences(lines.join(' '));if(!sentences.length){warnings.push(`${title}：没有课文内容`);continue}const old=oldMap.get(`import:${key}`),item:ImportedLesson={id:`import:${key}`,title,sentences,audio:g.audio??old?.audio,audioName:g.audio?.name??old?.audioName,createdAt:old?.createdAt??Date.now()};await putImport(item);legacy++}
 return{added:staged.length+legacy,plans:stagedPlans.length,warnings}
}
