import { db, type CardProgress } from './db.ts'

export interface ReactionResult { responseMs:number; correct:boolean; usedChinese:boolean }
export function nextMastery(old:CardProgress|undefined,result:ReactionResult,id:string):CardProgress{
 const streak=result.correct&&!result.usedChinese&&result.responseMs<=3000?(old?.correctStreak??0)+1:0
 return{id,done:false,step:0,updatedAt:Date.now(),reactionMs:result.responseMs,correctStreak:streak,chineseHints:(old?.chineseHints??0)+(result.usedChinese?1:0),direct:streak>=2}
}
export async function recordReaction(chunkId:string,result:ReactionResult):Promise<CardProgress>{const d=await db(),id=`mastery:${chunkId}`,state=nextMastery(await d.get('progress',id),result,id);await d.put('progress',state);return state}
export async function masterySummary():Promise<{direct:number;averageMs:number;chineseHints:number}>{const rows=(await (await db()).getAll('progress')).filter(x=>x.id.startsWith('mastery:')),timed=rows.filter(x=>x.reactionMs!=null);return{direct:rows.filter(x=>x.direct).length,averageMs:timed.length?Math.round(timed.reduce((n,x)=>n+(x.reactionMs??0),0)/timed.length):0,chineseHints:rows.reduce((n,x)=>n+(x.chineseHints??0),0)}}
