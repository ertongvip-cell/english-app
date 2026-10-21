export interface NceAssetName { original:string; startLesson:number; endLesson:number; lessonLabel:string; title:string; extension:string; incomplete:boolean; key:string }

export function normalizeTitle(value:string):string{return value.normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim()}

export function parseNceAssetName(name:string):NceAssetName|null{
 const clean=name.replace(/\.baiduyun\.p\.downloading$/i,'.mp3.downloading')
 const m=clean.match(/^(\d{1,3})(?:\s*&\s*(\d{1,3}))?\s*[－—-]\s*(.+?)\.(lrc|mp3|mp3\.downloading)$/i)
 if(!m)return null
 const start=Number(m[1]),end=Number(m[2]??m[1]),title=m[3].replace(/\.+$/,'').trim(),extension=m[4].toLowerCase(),incomplete=extension.endsWith('downloading')
 return{original:name,startLesson:start,endLesson:end,lessonLabel:start===end?String(start).padStart(3,'0'):`${String(start).padStart(3,'0')}&${String(end).padStart(3,'0')}`,title,extension,incomplete,key:`${start}-${end}:${normalizeTitle(title)}`}
}

export interface AssetGroup { key:string; lessonLabel:string; title:string; lrc?:string; audio?:string; incompleteAudio?:string; duplicates:string[] }
export function matchNceAssets(names:string[]):AssetGroup[]{
 const map=new Map<string,AssetGroup>()
 for(const name of names){const p=parseNceAssetName(name);if(!p)continue;const g=map.get(p.key)??{key:p.key,lessonLabel:p.lessonLabel,title:p.title,duplicates:[]};const field=p.extension==='lrc'?'lrc':p.incomplete?'incompleteAudio':'audio';if(g[field])g.duplicates.push(name);else g[field]=name;map.set(p.key,g)}
 return[...map.values()].sort((a,b)=>Number(a.lessonLabel.slice(0,3))-Number(b.lessonLabel.slice(0,3)))
}
