import { db, getSettings, STORES } from './db.ts'

interface Backup {version:2;createdAt:string;settings:unknown;appState:{activePlanId?:string;currentPrivateLessonId?:string};stores:Record<string,unknown[]>}
const DATA_STORES=STORES.filter(x=>x!=='kv')
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)

export async function makeBackup():Promise<Blob>{
 const d=await db(),stores:Record<string,unknown[]>={}
 for(const name of DATA_STORES){const rows=await d.getAll(name as any);stores[name]=name==='imports'?rows.map((x:any)=>({...x,audio:undefined,audioName:undefined})):rows}
 const activePlanId=await d.get('kv','activePlanId'),currentPrivateLessonId=await d.get('kv','currentPrivateLessonId')
 const appState:Backup['appState']={};if(typeof activePlanId==='string')appState.activePlanId=activePlanId;if(typeof currentPrivateLessonId==='string')appState.currentPrivateLessonId=currentPrivateLessonId
 const data:Backup={version:2,createdAt:new Date().toISOString(),settings:await getSettings(),appState,stores}
 return new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
}

function migrateBackup(value:unknown):unknown{
 if(!object(value)||value.version!==1)return value
 const stores=object(value.stores)?{...value.stores}:value.stores
 if(object(stores)&&!Array.isArray(stores.plans))stores.plans=[]
 return{...value,version:2,stores,appState:{}}
}
function validateBackup(data:unknown):asserts data is Backup{
 if(!object(data)||data.version!==2||!object(data.settings)||!object(data.stores)||!object(data.appState))throw new Error('不是有效的英语 App 备份文件')
 const s=data.settings
 if(typeof s.dailyGoal!=='number'||s.dailyGoal<1||s.dailyGoal>20||typeof s.rate!=='number'||s.rate<.5||s.rate>1.5||typeof s.voiceName!=='string'||typeof s.newWordsPerDay!=='number'||typeof s.onboarded!=='boolean')throw new Error('备份中的设置无效')
 const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v),strings=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string')
 const valid:Record<string,(r:Record<string,unknown>)=>boolean>={
  srs:r=>typeof r.id==='string'&&number(r.interval)&&typeof r.due==='string'&&number(r.reps)&&number(r.lapses)&&typeof r.introduced==='string',daily:r=>typeof r.date==='string'&&number(r.cards)&&number(r.seconds)&&object(r.kinds),progress:r=>typeof r.id==='string'&&typeof r.done==='boolean'&&number(r.step)&&number(r.updatedAt),imports:r=>typeof r.id==='string'&&typeof r.title==='string'&&strings(r.sentences)&&number(r.createdAt),assessments:r=>typeof r.id==='string'&&typeof r.date==='string'&&(r.kind==='initial'||r.kind==='retest')&&number(r.listening)&&number(r.grammar)&&number(r.readAloud)&&number(r.speakingWords)&&number(r.speakingWpm)&&strings(r.transcripts),plans:r=>r.schemaVersion===1&&typeof r.id==='string'&&typeof r.title==='string'&&strings(r.lessonIds)&&typeof r.startLessonId==='string'&&typeof r.createdAt==='string',
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
