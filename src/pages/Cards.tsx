import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { DIALOGUE_MAP, GRAMMAR_MAP, LESSON_MAP, WORD_MAP, WORDS, type Lesson, type Word } from '../content/index.ts'
import { allSrs, completeCard, getImport, getProgress, getSettings, putSrs, saveStep, type ImportedLesson } from '../lib/db.ts'
import { dayStr } from '../lib/date.ts'
import { isDue, newState, review, type Grade } from '../lib/srs.ts'
import { canRecognize, errorText, listen, speak, speakAll, stopSpeaking } from '../lib/speech.ts'
import { judge, scoreSentence, type SentenceScore } from '../lib/score.ts'
import { PrivateCourse } from './PrivateCourse.tsx'

const Back=()=> <button class="back" onClick={()=>history.back()}>‹ 返回</button>
const Meter=({n,total}:{n:number,total:number})=><div class="meter"><i style={{width:`${Math.min(100,n/total*100)}%`}}/></div>

function Recognize({target,answers=[target],keywords=[],onPass}:{target:string;answers?:string[];keywords?:string[];onPass?:()=>void}){
 const [busy,setBusy]=useState(false),[heard,setHeard]=useState(''),[err,setErr]=useState(''),[score,setScore]=useState<SentenceScore|null>(null)
 const session=useRef<ReturnType<typeof listen>|null>(null),active=useRef(true)
 useEffect(()=>()=>{active.current=false;session.current?.stop()},[])
 const start=()=>{ setBusy(true);setErr('');setHeard('');setScore(null); const s=listen(x=>{if(active.current)setHeard(x)});session.current=s;s.result.then(r=>{if(!active.current)return;setBusy(false);if(r.error&&!r.alternatives.length){setErr(errorText(r.error));return}const sc=scoreSentence(target,r.alternatives);setScore(sc);const j=judge(answers,r.alternatives,keywords);if(j.pass)onPass?.()}) }
 if(!canRecognize()) return <div class="notice">当前浏览器不能语音识别。请用 iPhone Safari 打开；你仍可跟读后点“自评通过”。<button onClick={onPass}>自评通过</button></div>
 return <div class="speak-box"><button class={`mic ${busy?'recording':''}`} onClick={()=>busy?session.current?.stop():start()}>{busy?'■ 说完了':'● 开始说'}</button>{heard&&<p class="heard">“{heard}”</p>}{err&&<p class="error">{err}</p>}{score&&<><p class="word-marks">{score.marks.map(m=><span class={m.ok?'ok':'miss'}>{m.text} </span>)}</p><strong>{Math.round(score.score*100)} 分</strong></>}</div>
}

export function VocabCard({lessonId,onDone}:{lessonId?:string;onDone:()=>void}){
 const [list,setList]=useState<Word[]>([]),[i,setI]=useState(0),[flip,setFlip]=useState(false);const start=useRef(Date.now())
 useEffect(()=>{(async()=>{const map=await allSrs(),today=dayStr();let ids=lessonId?LESSON_MAP.get(lessonId)?.words??[]:WORDS.filter(w=>{const s=map.get(w.id);return s&&isDue(s,today)}).map(w=>w.id);if(!lessonId&&ids.length<5){const fresh=WORDS.filter(w=>!map.has(w.id)).slice(0,5-ids.length).map(w=>w.id);ids=[...ids,...fresh]}setList(ids.map(x=>WORD_MAP.get(x)!).filter(Boolean).slice(0,20))})()},[lessonId])
 const grade=async(g:Grade)=>{const w=list[i],today=dayStr(),map=await allSrs();await putSrs(review(map.get(w.id)??newState(w.id,today),g,today));if(i+1>=list.length){await completeCard(`vocab:${lessonId??today}`,'vocab',(Date.now()-start.current)/1000,false);onDone()}else{setI(i+1);setFlip(false)}}
 if(!list.length)return <main><Back/><div class="empty"><b>今天没有到期词汇</b><p>去学一节新课，会把新词加入复习。</p></div></main>
 const w=list[i];return <main><Back/><Meter n={i+1} total={list.length}/><p class="eyebrow">词汇 {i+1}/{list.length}</p><section class={`flash ${flip?'flipped':''}`} onClick={()=>setFlip(true)}><button class="sound" onClick={e=>{e.stopPropagation();speak(w.en)}}>◖))</button><h1>{w.en}</h1>{flip?<div><h2>{w.zh}</h2><p class="example">{w.example}</p><p>{w.exampleZh}</p></div>:<p>想一想，然后轻点翻面</p>}</section>{flip&&<div class="grade"><button onClick={()=>grade('forgot')}>不认识</button><button onClick={()=>grade('fuzzy')}>模糊</button><button class="primary" onClick={()=>grade('know')}>认识</button></div>}</main>
}

function AudioPlayer({lesson,imported,rate}:{lesson?:Lesson;imported?:ImportedLesson;rate:number}){
 const [playing,setPlaying]=useState(false),[line,setLine]=useState(-1);const audio=useRef<HTMLAudioElement>(null);const speech=useRef<ReturnType<typeof speakAll>|null>(null)
 const sentences=lesson?.sentences??imported?.sentences??[]
 const stop=()=>{speech.current?.stop();speech.current=null;stopSpeaking();if(audio.current)audio.current.pause();setPlaying(false);setLine(-1)}
 const play=async()=>{stop();setPlaying(true);if(imported?.audio&&audio.current){try{audio.current.playbackRate=rate;audio.current.currentTime=0;await audio.current.play()}catch{setPlaying(false)}}else if(sentences.length){const session=speakAll(sentences,rate,setLine);speech.current=session;await session.done;if(speech.current===session){speech.current=null;setPlaying(false)}}else setPlaying(false)}
 const url=useMemo(()=>imported?.audio?URL.createObjectURL(imported.audio):'',[imported?.audio]);useEffect(()=>()=>{speech.current?.stop();if(url)URL.revokeObjectURL(url)},[url])
 return <div class="player">{url&&<audio ref={audio} src={url} onEnded={()=>setPlaying(false)}/>}<button class="play" onClick={()=>playing?stop():play()}>{playing?'■':'▶'}</button><div><b>{playing?line>=0?`正在读第 ${line+1} 句`:'正在播放':'播放全文'}</b><small>{rate}× 语速</small></div></div>
}

export function ListenCard({id,onDone}:{id:string;onDone:()=>void}){
 const lesson=LESSON_MAP.get(id);const [imp,setImp]=useState<ImportedLesson>();const [step,setStep]=useState(0),[hydrated,setHydrated]=useState(false),[rate,setRate]=useState(.85),[answers,setAnswers]=useState<number[]>([]),[line,setLine]=useState(0),[passed,setPassed]=useState<Set<number>>(new Set());const start=useRef(Date.now())
 useEffect(()=>{let current=true;setHydrated(false);(async()=>{const [settings,p,imported]=await Promise.all([getSettings(),getProgress(`listen:${id}`),lesson?Promise.resolve(undefined):getImport(id)]);if(!current)return;setRate(settings.rate);setStep(p?.step??0);setImp(imported);setHydrated(true)})();return()=>{current=false}},[id])
 useEffect(()=>{if(hydrated)void saveStep(`listen:${id}`,step)},[step,id,hydrated])
 const sentences=lesson?.sentences??imp?.sentences??[]
 const finish=async()=>{await completeCard(`listen:${id}`,'listen',(Date.now()-start.current)/1000);onDone()}
 if(!lesson&&!imp)return <main><Back/><div class="empty">找不到这节课</div></main>
 return <main><Back/><Meter n={step+1} total={4}/><div class="row"><p class="eyebrow">听力 · {step+1}/4</p><select value={rate} onChange={e=>setRate(Number(e.currentTarget.value))}><option value=".7">0.7×</option><option value=".85">0.85×</option><option value="1">正常</option></select></div><h1>{lesson?.title??imp?.title}</h1>
 {step===0&&<section class="card"><h2>先不看原文，完整听一遍</h2><p>不必听懂每个词，先抓住人物、事情和数字。</p><AudioPlayer lesson={lesson} imported={imp} rate={rate}/><button class="primary wide" onClick={()=>setStep(1)}>听完了</button></section>}
 {step===1&&<section class="card"><h2>理解检查</h2>{lesson?lesson.questions.map((q,qi)=><div class="question"><b>{qi+1}. {q.q}</b>{q.options.map((o,oi)=><button class={`option ${answers[qi]===oi?'selected':''}`} onClick={()=>{const a=[...answers];a[qi]=oi;setAnswers(a)}}>{o}</button>)}{answers[qi]!=null&&<small class={answers[qi]===q.answer?'good':'bad'}>{answers[qi]===q.answer?'答对了':q.explain}</small>}</div>):<p>你能用一句中文说出大意吗？想好后继续。</p>}<button class="primary wide" disabled={!!lesson&&!lesson.questions.every((_,qi)=>answers[qi]!=null)} onClick={()=>setStep(2)}>看原文核对</button></section>}
 {step===2&&<section class="card"><h2>看原文再听</h2><AudioPlayer lesson={lesson} imported={imp} rate={rate}/><div class="transcript">{sentences.map((s,i)=><p onClick={()=>speak(s,rate)}><b>{i+1}</b>{s}{lesson&&<small>{lesson.zh[i]}</small>}</p>)}</div><button class="primary wide" onClick={()=>setStep(3)}>开始逐句跟读</button></section>}
 {step===3&&<section class="card"><p class="eyebrow">第 {line+1}/{sentences.length} 句</p><h2 class="target">{sentences[line]}</h2>{lesson&&<p>{lesson.zh[line]}</p>}<button class="outline" onClick={()=>speak(sentences[line],rate)}>▶ 听这一句</button><Recognize target={sentences[line]} onPass={()=>setPassed(new Set([...passed,line]))}/><div class="row"><button disabled={line===0} onClick={()=>setLine(line-1)}>上一句</button>{line+1<sentences.length?<button class="primary" disabled={!passed.has(line)} onClick={()=>setLine(line+1)}>下一句</button>:<button class="primary" disabled={!passed.has(line)} onClick={finish}>完成本卡</button>}</div></section>}</main>
}

export function GrammarCard({id,onDone}:{id:string;onDone:()=>void}){
 const lesson=LESSON_MAP.get(id),g=lesson&&GRAMMAR_MAP.get(lesson.grammarId);const [i,setI]=useState(-1),[pass,setPass]=useState(false);const start=useRef(Date.now())
 if(!g)return <main><Back/>找不到知识点</main>
 const next=async()=>{if(i+1<g.drills.length){setI(i+1);setPass(false)}else{await completeCard(`grammar:${id}`,'grammar',(Date.now()-start.current)/1000);onDone()}}
 return <main><Back/><p class="eyebrow">知识点 · {lesson.titleZh}</p><h1>{g.title}</h1>{i<0?<section class="card grammar"><h2>{g.summary}</h2>{g.explain.map(x=><p>• {x}</p>)}{g.examples.map(x=><blockquote onClick={()=>speak(x.en)}>{x.en}<small>{x.zh}</small></blockquote>)}<button class="primary wide" onClick={next}>开始开口练习</button></section>:<section class="card"><p>请用英语说：</p><h2>{g.drills[i].zh}</h2><Recognize target={g.drills[i].answers[0]} answers={g.drills[i].answers} keywords={g.drills[i].keywords} onPass={()=>setPass(true)}/>{!pass&&<details><summary>看提示</summary><p>{g.drills[i].answers[0]}</p></details>}<button class="primary wide" disabled={!pass} onClick={next}>{i+1===g.drills.length?'完成':'下一题'}</button></section>}</main>
}

export function DialogueCard({id,onDone}:{id:string;onDone:()=>void}){
 const lesson=LESSON_MAP.get(id),d=lesson&&DIALOGUE_MAP.get(lesson.dialogueId);const [i,setI]=useState(0),[pass,setPass]=useState(false);const start=useRef(Date.now())
 if(!d)return <main><Back/>找不到对话</main>;const turn=d.turns[i]
 useEffect(()=>{if(turn?.role==='app')speak(turn.en)},[i])
 const next=async()=>{if(i+1<d.turns.length){setI(i+1);setPass(false)}else{await completeCard(`dialogue:${id}`,'dialogue',(Date.now()-start.current)/1000);onDone()}}
 return <main><Back/><p class="eyebrow">情景对话 · {d.roleName}</p><h1>{d.title}</h1><p>{d.intro}</p><section class="chat">{d.turns.slice(0,i+1).map((t,n)=><div class={`bubble ${t.role}`}>{t.role==='app'?<><small>{d.roleName}</small>{t.en}<button onClick={()=>speak(t.en)}>◖))</button></>:<i>轮到你回应</i>}</div>)}</section>{turn.role==='app'?<button class="primary wide" onClick={next}>回应</button>:<section class="card"><h2>{turn.zh}</h2><Recognize target={turn.answers[0]} answers={turn.answers} keywords={turn.keywords} onPass={()=>setPass(true)}/><details><summary>卡住了？看提示</summary><p>{turn.answers[0]}</p></details><button class="primary wide" disabled={!pass} onClick={next}>完成对话</button></section>}</main>
}

export function CardRoute({kind,id}:{kind:string;id:string}){const done=()=>{location.hash='#/'};if(kind==='private')return <PrivateCourse id={id} onDone={done}/>;if(kind==='vocab')return <VocabCard lessonId={id||undefined} onDone={done}/>;if(kind==='listen')return <ListenCard id={id} onDone={done}/>;if(kind==='grammar')return <GrammarCard id={id} onDone={done}/>;return <DialogueCard id={id} onDone={done}/>}
