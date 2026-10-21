import { parseLrc, type LrcCue } from './lrc.ts'

export type TimedTextKind='lrc'|'srt'|'vtt'|'plain'
export interface ParsedText { kind:TimedTextKind; title?:string; cues:LrcCue[] }
const stamp=(s:string)=>{const m=s.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})/);return m?(Number(m[1]??0)*3600+Number(m[2])*60+Number(m[3]))*1000+Number(m[4]):0}

export function parseText(raw:string,fileName='material.txt'):ParsedText{
 const ext=fileName.split('.').pop()?.toLowerCase()
 if(ext==='lrc'){const p=parseLrc(raw);return{kind:'lrc',title:p.metadata.ti,cues:p.cues}}
 if(ext==='srt'||ext==='vtt'){
  const body=raw.replace(/^WEBVTT[^\n]*\n/i,'').trim(),cues:LrcCue[]=[]
  for(const block of body.split(/\r?\n\s*\r?\n/)){
   const lines=block.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const timeIndex=lines.findIndex(x=>x.includes('-->'));if(timeIndex<0)continue
   const [a,b]=lines[timeIndex].split('-->');const text=lines.slice(timeIndex+1).join(' ').replace(/<[^>]+>/g,'').trim();if(text)cues.push({startMs:stamp(a),endMs:stamp(b),text,sourceLine:0})
  }
  return{kind:ext,cues}
 }
 const lines=raw.replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),title=lines.shift()
 return{kind:'plain',title,cues:lines.map((text,i)=>({startMs:i*1000,text,sourceLine:i+2}))}
}
