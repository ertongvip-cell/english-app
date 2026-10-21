export interface LrcCue { startMs:number; endMs?:number; text:string; sourceLine:number }
export interface ParsedLrc { metadata:Record<string,string>; cues:LrcCue[] }
export interface ParsedNceLrc extends ParsedLrc { lesson?:string; title?:string; leadQuestion?:string; content:LrcCue[] }

const TIME=/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g
const META=/^\[([a-z]+):([^\]]*)\]$/i
const ms=(m:string,s:string,f='0')=>Number(m)*60000+Number(s)*1000+Number(f.padEnd(3,'0').slice(0,3))

export function parseLrc(raw:string):ParsedLrc{
 const metadata:Record<string,string>={},cues:LrcCue[]=[]
 raw.replace(/^\uFEFF/,'').split(/\r?\n/).forEach((line,index)=>{
  const clean=line.trim();if(!clean)return
  const tag=clean.match(META);if(tag){metadata[tag[1].toLowerCase()]=tag[2].trim();return}
  const times=[...clean.matchAll(TIME)];if(!times.length)return
  const text=clean.replace(TIME,'').trim();if(!text)return
  times.forEach(t=>cues.push({startMs:ms(t[1],t[2],t[3]),text,sourceLine:index+1}))
 })
 cues.sort((a,b)=>a.startMs-b.startMs||a.sourceLine-b.sourceLine)
 cues.forEach((cue,i)=>{const next=cues[i+1];if(next&&next.startMs>cue.startMs)cue.endMs=next.startMs})
 return{metadata,cues}
}

export function parseNceLrc(raw:string):ParsedNceLrc{
 const parsed=parseLrc(raw);let at=0,lesson:string|undefined,title:string|undefined,leadQuestion:string|undefined
 if(/^lesson\s+\d+/i.test(parsed.cues[at]?.text??'')){lesson=parsed.cues[at].text.match(/\d+/)?.[0];at++}
 if(parsed.cues[at]){title=parsed.metadata.ti||parsed.cues[at].text;at++}
 if(/^listen to (the )?tape/i.test(parsed.cues[at]?.text??''))at++
 if(parsed.cues[at]?.text.endsWith('?')){leadQuestion=parsed.cues[at].text;at++}
 return{...parsed,lesson,title,leadQuestion,content:parsed.cues.slice(at)}
}
