import { addDays, dayStr } from './date.ts'
import { normalize } from './score.ts'

export type DictationErrorType='number-time'|'polarity'|'article'|'preposition'|'auxiliary'|'word-ending'|'vocabulary'
export interface DiffToken {text:string;actual?:string;status:'correct'|'missing'|'replaced'|'extra';errorType?:DictationErrorType}
export interface DictationResult {score:number;distance:number;tokens:DiffToken[];errorTypes:DictationErrorType[]}
export interface SentenceMastery {bestScore:number;passStreak:number;errorTypes:DictationErrorType[]}
export interface ShadowState {ratesPassed:number[];bestScore:number}
export interface LessonMastery {
 lessonId:string
 currentStage:number
 dictation:Record<string,SentenceMastery>
 shadowing:Record<string,ShadowState>
 recall:{level:number;bestScore:number;passStreak:number}
 originalSpeed:{bestScore:number;bestDurationRatio:number;passStreak:number}
 retellCoverage:number
 transferPassed:number
 firstCompletedAt?:string
 reviewIndex:number
 reviewPending?:ReviewPart[]
 nextReview?:string
 stable:boolean
 updatedAt:number
}
export type ReviewPart='dictation'|'reaction'|'transfer'
export interface ReviewResults {dictation?:boolean;reaction?:boolean;transfer?:boolean}
const NUMBERS=new Set('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand monday tuesday wednesday thursday friday saturday sunday'.split(' '))
const POLARITY=new Set(['not','no','never','without'])
const ARTICLES=new Set(['a','an','the'])
const PREPOSITIONS=new Set('at in on to for from with by of under over across after before into'.split(' '))
const AUX=new Set('am is are was were be been being do does did have has had will would can could may might must should shall'.split(' '))
const stems=(word:string)=>{const out=new Set([word]);for(const suffix of ['ing','ed','es','s'])if(word.length>suffix.length+1&&word.endsWith(suffix))out.add(word.slice(0,-suffix.length));return out}
const endingVariant=(a:string,b:string)=>a!==b&&[...stems(a)].some(x=>stems(b).has(x))
function kind(target:string,actual?:string):DictationErrorType{if(NUMBERS.has(target))return'number-time';if(POLARITY.has(target)||actual&&POLARITY.has(actual))return'polarity';if(ARTICLES.has(target))return'article';if(PREPOSITIONS.has(target))return'preposition';if(AUX.has(target))return'auxiliary';if(actual&&endingVariant(target,actual))return'word-ending';return'vocabulary'}

export function scoreDictation(target:string,input:string):DictationResult{
 const a=normalize(target),b=normalize(input),dp=Array.from({length:a.length+1},()=>new Array<number>(b.length+1).fill(0))
 for(let i=0;i<=a.length;i++)dp[i][0]=i;for(let j=0;j<=b.length;j++)dp[0][j]=j
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
 const out:DiffToken[]= [];let i=a.length,j=b.length
 while(i||j){if(i&&j&&a[i-1]===b[j-1]){out.push({text:a[i-1],status:'correct'});i--;j--}else if(i&&j&&dp[i][j]===dp[i-1][j-1]+1){out.push({text:a[i-1],actual:b[j-1],status:'replaced',errorType:kind(a[i-1],b[j-1])});i--;j--}else if(i&&dp[i][j]===dp[i-1][j]+1){out.push({text:a[i-1],status:'missing',errorType:kind(a[i-1])});i--}else{out.push({text:b[j-1],status:'extra',errorType:kind(b[j-1])});j--}}
 out.reverse();const distance=dp[a.length][b.length],score=Math.max(0,1-distance/Math.max(a.length,b.length,1)),errorTypes=[...new Set(out.flatMap(x=>x.errorType?[x.errorType]:[]))]
 return{score,distance,tokens:out,errorTypes}
}
export function emptyMastery(lessonId:string):LessonMastery{return{lessonId,currentStage:0,dictation:{},shadowing:{},recall:{level:0,bestScore:0,passStreak:0},originalSpeed:{bestScore:0,bestDurationRatio:99,passStreak:0},retellCoverage:0,transferPassed:0,reviewIndex:0,stable:false,updatedAt:Date.now()}}
export function recordDictation(m:LessonMastery,sentenceId:string,result:DictationResult):LessonMastery{const old=m.dictation[sentenceId],passed=result.score>=.9,next:SentenceMastery={bestScore:Math.max(old?.bestScore??0,result.score),passStreak:passed?(old?.passStreak??0)+1:0,errorTypes:result.errorTypes};return{...m,dictation:{...m.dictation,[sentenceId]:next},updatedAt:Date.now()}}
export function recordShadow(m:LessonMastery,sentenceId:string,rate:number,score:number):LessonMastery{const old=m.shadowing[sentenceId]??{ratesPassed:[],bestScore:0},rates=score>=.85?[...new Set([...old.ratesPassed,rate])].sort():old.ratesPassed;return{...m,shadowing:{...m.shadowing,[sentenceId]:{ratesPassed:rates,bestScore:Math.max(old.bestScore,score)}},updatedAt:Date.now()}}
export function recordRecall(m:LessonMastery,score:number):LessonMastery{const pass=score>=.85,streak=pass?m.recall.passStreak+1:0,level=pass?Math.min(4,m.recall.level+1):m.recall.level;return{...m,recall:{level,bestScore:Math.max(m.recall.bestScore,score),passStreak:streak},updatedAt:Date.now()}}
export function recordOriginalSpeed(m:LessonMastery,score:number,ratio:number):LessonMastery{const pass=score>=.85&&ratio<=1.2,streak=pass?m.originalSpeed.passStreak+1:0;return{...m,originalSpeed:{bestScore:Math.max(m.originalSpeed.bestScore,score),bestDurationRatio:Math.min(m.originalSpeed.bestDurationRatio,ratio),passStreak:streak},updatedAt:Date.now()}}
export const REVIEW_DAYS=[1,3,7,14,30]
export function canStartReviews(m:LessonMastery,sentenceIds:string[],requiredTransfers=1):boolean{const p=masteryProgress(m,sentenceIds);return p.total>0&&p.dictation===p.total&&p.shadowing===p.total&&p.recall&&p.originalSpeed&&p.retell&&m.transferPassed>=requiredTransfers}
export function startReviews(m:LessonMastery,sentenceIds:string[],requiredTransfers=1,today=dayStr()):LessonMastery{if(!canStartReviews(m,sentenceIds,requiredTransfers))throw new Error('课程掌握门槛尚未全部通过');if(m.firstCompletedAt)return m;return{...m,firstCompletedAt:today,reviewIndex:0,reviewPending:undefined,nextReview:addDays(today,REVIEW_DAYS[0]),updatedAt:Date.now()}}
export function canReview(m:LessonMastery,sentenceIds:string[],requiredTransfers:number,today=dayStr()):boolean{return canStartReviews(m,sentenceIds,requiredTransfers)&&!!m.firstCompletedAt&&!m.stable&&m.reviewIndex<REVIEW_DAYS.length&&!!m.nextReview&&m.nextReview<=today}
export function recordReview(m:LessonMastery,results:ReviewResults,expectedParts:ReviewPart[],sentenceIds:string[],requiredTransfers:number,today=dayStr()):LessonMastery{if(!canReview(m,sentenceIds,requiredTransfers,today))throw new Error('复测尚未到期或课程掌握门槛已失效');const entries=Object.entries(results) as [ReviewPart,boolean][],actualKeys=entries.map(([x])=>x).sort(),expectedKeys=[...expectedParts].sort();if(actualKeys.join('|')!==expectedKeys.join('|'))throw new Error('复测结果不完整');const passed=entries.filter(([,ok])=>ok).length,required=Math.min(2,entries.length);if(!entries.length)throw new Error('没有可用的复测任务');if(passed<required)return{...m,reviewPending:entries.filter(([,ok])=>!ok).map(([part])=>part),nextReview:addDays(today,1),updatedAt:Date.now()};const index=m.reviewIndex+1;return{...m,reviewIndex:index,reviewPending:undefined,nextReview:index<REVIEW_DAYS.length?addDays(m.firstCompletedAt!,REVIEW_DAYS[index]):undefined,stable:index>=REVIEW_DAYS.length,updatedAt:Date.now()}}
export function masteryProgress(m:LessonMastery,sentenceIds:string[]){const dictation=sentenceIds.filter(id=>(m.dictation[id]?.passStreak??0)>=2).length,shadowing=sentenceIds.filter(id=>m.shadowing[id]?.ratesPassed.includes(1)).length;return{dictation,shadowing,recall:m.recall.level>=4,originalSpeed:m.originalSpeed.passStreak>=2,retell:m.retellCoverage>=.6,transfer:m.transferPassed>0,reviews:m.reviewIndex,total:sentenceIds.length}}
export const ERROR_LABELS:Record<DictationErrorType,string>={'number-time':'数字/时间','polarity':'否定词','article':'冠词','preposition':'介词','auxiliary':'助动词','word-ending':'时态/词尾','vocabulary':'词汇'}
