import { db, getSettings, STORES } from './db.ts'

interface Backup {version:3;createdAt:string;settings:unknown;appState:{activePlanId?:string;currentPrivateLessonId?:string};stores:Record<string,unknown[]>}
const DATA_STORES=STORES.filter(x=>x!=='kv')
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)

export async function makeBackup():Promise<Blob>{
 const d=await db(),stores:Record<string,unknown[]>={}
 for(const name of DATA_STORES){const rows=await d.getAll(name as any);stores[name]=name==='imports'?rows.map((x:any)=>({...x,audio:undefined,audioName:undefined})):rows}
 const activePlanId=await d.get('kv','activePlanId'),currentPrivateLessonId=await d.get('kv','currentPrivateLessonId')
 const appState:Backup['appState']={};if(typeof activePlanId==='string')appState.activePlanId=activePlanId;if(typeof currentPrivateLessonId==='string')appState.currentPrivateLessonId=currentPrivateLessonId
 const data:Backup={version:3,createdAt:new Date().toISOString(),settings:await getSettings(),appState,stores}
 return new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
}

function migrateBackup(value:unknown):unknown{
 if(!object(value)||(value.version!==1&&value.version!==2))return value
 const stores=object(value.stores)?{...value.stores}:value.stores
 if(object(stores)){if(!Array.isArray(stores.plans))stores.plans=[];if(!Array.isArray(stores.lessonMastery))stores.lessonMastery=[]}
 return{...value,version:3,stores,appState:object(value.appState)?value.appState:{}}
}
function validateBackup(data:unknown):asserts data is Backup{
 if(!object(data)||data.version!==3||!object(data.settings)||!object(data.stores)||!object(data.appState))throw new Error('不是有效的英语 App 备份文件')
 const s=data.settings
 if(typeof s.dailyGoal!=='number'||s.dailyGoal<1||s.dailyGoal>20||typeof s.rate!=='number'||s.rate<.5||s.rate>1.5||typeof s.voiceName!=='string'||typeof s.newWordsPerDay!=='number'||typeof s.onboarded!=='boolean')throw new Error('备份中的设置无效')
 const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v),strings=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string'),between=(v:unknown,min:number,max:number)=>number(v)&&v>=min&&v<=max,integer=(v:unknown,min:number,max:number)=>Number.isInteger(v)&&between(v,min,max),date=(v:unknown)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const [y,m,d]=v.split('-').map(Number),x=new Date(y,m-1,d);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d}
 const masteryRecord=(r:Record<string,unknown>)=>{
  if(typeof r.lessonId!=='string'||!integer(r.currentStage??0,0,9)||!object(r.dictation)||!object(r.shadowing)||!object(r.recall)||!object(r.originalSpeed)||!between(r.retellCoverage,0,1)||!integer(r.transferPassed,0,100000)||!integer(r.reviewIndex,0,5)||typeof r.stable!=='boolean'||!number(r.updatedAt))return false
  const sentenceOk=Object.values(r.dictation).every(x=>object(x)&&between(x.bestScore,0,1)&&integer(x.passStreak,0,100000)&&strings(x.errorTypes)),shadowOk=Object.values(r.shadowing).every(x=>object(x)&&Array.isArray(x.ratesPassed)&&x.ratesPassed.every(v=>typeof v==='number'&&[.75,.9,1].includes(v))&&between(x.bestScore,0,1)),recall=r.recall,original=r.originalSpeed,reviewState=r.firstCompletedAt==null?(r.reviewIndex===0&&r.nextReview==null&&r.stable===false):(date(r.firstCompletedAt)&&((r.stable===true&&r.reviewIndex===5&&r.nextReview==null)||(r.stable===false&&Number(r.reviewIndex)<5&&date(r.nextReview))))
  return sentenceOk&&shadowOk&&integer(recall.level,0,4)&&between(recall.bestScore,0,1)&&integer(recall.passStreak,0,100000)&&between(original.bestScore,0,1)&&between(original.bestDurationRatio,0,100000)&&integer(original.passStreak,0,100000)&&(r.reviewPending==null||Array.isArray(r.reviewPending)&&r.reviewPending.length>0&&r.reviewPending.every(x=>['dictation','reaction','transfer'].includes(String(x))))&&reviewState
 }
 const valid:Record<string,(r:Record<string,unknown>)=>boolean>={
  srs:r=>typeof r.id==='string'&&number(r.interval)&&typeof r.due==='string'&&number(r.reps)&&number(r.lapses)&&typeof r.introduced==='string',daily:r=>typeof r.date==='string'&&number(r.cards)&&number(r.seconds)&&object(r.kinds),progress:r=>typeof r.id==='string'&&typeof r.done==='boolean'&&number(r.step)&&number(r.updatedAt),imports:r=>typeof r.id==='string'&&typeof r.title==='string'&&strings(r.sentences)&&number(r.createdAt),assessments:r=>typeof r.id==='string'&&typeof r.date==='string'&&(r.kind==='initial'||r.kind==='retest')&&number(r.listening)&&number(r.grammar)&&number(r.readAloud)&&number(r.speakingWords)&&number(r.speakingWpm)&&strings(r.transcripts),plans:r=>r.schemaVersion===1&&typeof r.id==='string'&&typeof r.title==='string'&&strings(r.lessonIds)&&typeof r.startLessonId==='string'&&typeof r.createdAt==='string',lessonMastery:r=>masteryRecord(r),
 }
 for(const name of DATA_STORES){const rows=data.stores[name];if(!Array.isArray(rows))throw new Error(`备份缺少 ${name} 数据`);if(rows.some(row=>!object(row)||!valid[name](row)))throw new Error(`备份中的 ${name} 记录无效`)}
 const plans=data.stores.plans as Record<string,unknown>[],imports=data.stores.imports as Record<string,unknown>[],planIds=new Set(plans.map(x=>x.id)),lessonIds=new Set(imports.map(x=>x.id))
 if(data.appState.activePlanId!=null&&(!str(data.appState.activePlanId)||!planIds.has(data.appState.activePlanId)))throw new Error('当前学习计划引用无效')
 if(data.appState.currentPrivateLessonId!=null&&(!str(data.appState.currentPrivateLessonId)||!lessonIds.has(data.appState.currentPrivateLessonId)))throw new Error('当前课程引用无效')
}
const str=(v:unknown):v is string=>typeof v==='string'&&v.length>0

export async function restoreBackup(file:File):Promise<void>{
 if(file.size>20*1024*1024)throw new Error('备份文件过大（上限 20MB）')
 const raw=migrateBackup(JSON.parse(await file.text()));validateBackup(raw);const data=raw,d=await db(),tx=d.transaction(STORES as any,'readwrite')
 for(const name of STORES)await tx.objectStore(name as any).clear()
 await tx.objectStore('kv' as any).put(data.settings,'settings')
 if(data.appState.activePlanId)await tx.objectStore('kv' as any).put(data.appState.activePlanId,'activePlanId')
 if(data.appState.currentPrivateLessonId)await tx.objectStore('kv' as any).put(data.appState.currentPrivateLessonId,'currentPrivateLessonId')
 for(const name of DATA_STORES)for(const row of data.stores[name])await tx.objectStore(name as any).put(row)
 await tx.done
}
export function download(blob:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/** 供导入前检查和回归测试使用，不写入数据库 */
export function validateBackupData(value: unknown): boolean {
  try { const migrated=migrateBackup(value);validateBackup(migrated);return true } catch { return false }
}
