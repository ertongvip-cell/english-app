import { useEffect, useState } from 'preact/hooks'
import { LESSONS } from '../content/index.ts'
import { allAssessments, allDays, allImports, allProgress, getActivePlan, getCurrentPrivateLessonId, getSettings, type CardProgress, type ImportedLesson } from '../lib/db.ts'
import { masterySummary } from '../lib/mastery.ts'
import { dayStr } from '../lib/date.ts'
import { streak, type DayRecord } from '../lib/daily.ts'

const go=(path:string)=>location.hash=`#${path}`
export function Home(){
 const [days,setDays]=useState(new Map<string,DayRecord>()),[progress,setProgress]=useState(new Map<string,CardProgress>()),[goal,setGoal]=useState(4),[needsAssessment,setNeedsAssessment]=useState(false),[privateItems,setPrivateItems]=useState<ImportedLesson[]>([]),[plan,setPlan]=useState<Awaited<ReturnType<typeof getActivePlan>>>(),[currentPrivate,setCurrentPrivate]=useState<string>(),[mastery,setMastery]=useState({direct:0,averageMs:0,chineseHints:0})
 useEffect(()=>{Promise.all([allDays(),allProgress(),getSettings(),allAssessments(),allImports(),getActivePlan(),getCurrentPrivateLessonId(),masterySummary()]).then(([d,p,s,a,imports,active,current,m])=>{setDays(d);setProgress(p);setGoal(s.dailyGoal);setNeedsAssessment(a.length===0);setPrivateItems(imports);setPlan(active);setCurrentPrivate(current);setMastery(m)})},[])
 const today=days.get(dayStr()),done=today?.cards??0,st=streak(days,dayStr())
 const next=LESSONS.find(l=>!progress.get(`listen:${l.id}`)?.done)??LESSONS[0]
 const planned=plan?.lessonIds.map(id=>privateItems.find(x=>x.id===id)).filter((x):x is ImportedLesson=>!!x)??[],privateNext=planned.find(x=>x.id===currentPrivate&&!progress.get(`private:${x.id}`)?.done)??planned.find(x=>!progress.get(`private:${x.id}`)?.done)
 return <main class="home"><header class="hero"><div><p class="eyebrow">DAY BY DAY</p><h1>今天，<br/><em>听懂一句。</em></h1></div><div class="streak"><strong>{st}</strong><span>连续天数</span></div><div class="sound-lines" aria-hidden="true">{[1,2,3,4,5,6,7,8,9].map((x)=><i style={{height:`${12+(x*17)%44}px`}}/>)}</div></header>
 {needsAssessment&&<button class="assessment-banner" onClick={()=>go('/assessment')}><b>先完成基线复测</b><span>听力、语法、口语约 6 分钟，四周后对比进步 →</span></button>}
 <section class="today"><div class="row"><div><p class="eyebrow">今日进度</p><h2>{done}<small> / {goal} 张</small></h2></div><span class={done>=goal?'badge done':'badge'}>{done>=goal?'今日达标':'碎片时间也算数'}</span></div><div class="meter"><i style={{width:`${Math.min(100,done/goal*100)}%`}}/></div></section>
 <section class="direct-stats"><div><strong>{mastery.direct}</strong><span>直接反应词块</span></div><div><strong>{mastery.averageMs?`${(mastery.averageMs/1000).toFixed(1)}s`:'—'}</strong><span>平均回应时间</span></div><div><strong>{mastery.chineseHints}</strong><span>提示使用次数</span></div></section>
 {privateNext&&<button class="next-card private-next" onClick={()=>go(`/card/private/${encodeURIComponent(privateNext.id)}`)}><span class="number">EN</span><div><small>{plan?.title} · 直接反应训练</small><b>{privateNext.title}</b><span>{privateNext.privateLesson?.source.lesson} · 六层训练</span></div><i>→</i></button>}
 <button class="next-card" onClick={()=>go(`/card/listen/${next.id}`)}><span class="number">{String(LESSONS.indexOf(next)+1).padStart(2,'0')}</span><div><small>推荐下一张 · 听力</small><b>{next.title}</b><span>{next.titleZh} · 约 4 分钟</span></div><i>→</i></button>
 <div class="quick"><button onClick={()=>go('/card/vocab/')}><span>Aa</span><b>复习到期词汇</b><small>忙时学这一张就算打卡</small></button><button onClick={()=>go(`/card/dialogue/${next.id}`)}><span>◉</span><b>开口说</b><small>情景回应练习</small></button></div>
 <section class="courses"><div class="section-title"><h2>两周唤醒计划</h2><span>14 课</span></div>{[1,2].map(w=><div><p class="week">第 {w} 周</p>{LESSONS.filter(l=>l.week===w).map((l,i)=>{const listened=progress.get(`listen:${l.id}`)?.done;return <article class="lesson"><button class="lesson-main" onClick={()=>go(`/card/listen/${l.id}`)}><span class={listened?'check complete':'check'}>{listened?'✓':(w-1)*7+i+1}</span><div><b>{l.title}</b><small>{l.titleZh}</small></div><i>›</i></button><div class="lesson-actions"><button onClick={()=>go(`/card/vocab/${l.id}`)}>词汇</button><button onClick={()=>go(`/card/grammar/${l.id}`)}>知识点</button><button onClick={()=>go(`/card/dialogue/${l.id}`)}>对话</button></div></article>})}</div>)}</section>
 </main>
}
