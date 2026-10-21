import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { CourseSentence } from '../private-course/schema.ts'

export function CuedAudioPlayer({audio,sentences,rate=.85,onCue}:{audio:Blob;sentences:CourseSentence[];rate?:number;onCue?:(i:number)=>void}){
 const ref=useRef<HTMLAudioElement>(null),[active,setActive]=useState(0),[loop,setLoop]=useState<number|null>(null),[playing,setPlaying]=useState(false)
 const url=useMemo(()=>URL.createObjectURL(audio),[audio]);useEffect(()=>()=>{ref.current?.pause();URL.revokeObjectURL(url)},[url])
 const seek=(i:number,auto=true)=>{const a=ref.current,s=sentences[i];if(!a||!s)return;a.currentTime=(s.startMs??0)/1000;a.playbackRate=rate;setActive(i);onCue?.(i);if(auto){void a.play();setPlaying(true)}}
 const time=()=>{const a=ref.current;if(!a)return;const ms=a.currentTime*1000;if(loop!=null){const end=sentences[loop]?.endMs??(Number.isFinite(a.duration)?a.duration*1000:undefined);if(end&&ms>=end){seek(loop);return}}let i=0;for(let n=0;n<sentences.length;n++){if((sentences[n].startMs??0)<=ms)i=n;else break};if(i!==active){setActive(i);onCue?.(i)}}
 const toggle=()=>{const a=ref.current;if(!a)return;if(a.paused){a.playbackRate=rate;void a.play();setPlaying(true)}else{a.pause();setPlaying(false)}}
 return <div class="cued-player"><audio ref={ref} src={url} onTimeUpdate={time} onEnded={()=>{if(loop!=null)seek(loop);else setPlaying(false)}}/><div class="player"><button class="play" onClick={toggle}>{playing?'■':'▶'}</button><div><b>{playing?'正在播放':'播放原音'}</b><small>{rate}× · 第 {active+1}/{sentences.length} 句</small></div></div><div class="cue-list">{sentences.map((s,i)=><button class={i===active?'active':''} onClick={()=>seek(i)}><span>{i+1}</span>{s.text}<i onClick={e=>{e.stopPropagation();setLoop(loop===i?null:i);seek(i)}}>{loop===i?'停止循环':'循环'}</i></button>)}</div></div>
}
