import { useEffect, useState } from 'preact/hooks'
import { Home } from './pages/Home.tsx'
import { CardRoute } from './pages/Cards.tsx'
import { Assessment, Library, SettingsPage, Stats } from './pages/Management.tsx'

const tabs=[['/','⌂','学习'],['/stats','▦','统计'],['/library','▤','资料'],['/settings','⚙','设置']] as const
function route(){return location.hash.replace(/^#/,'')||'/'}
function safeDecode(value:string){try{return decodeURIComponent(value)}catch{return value}}
export function App(){const [path,setPath]=useState(route());useEffect(()=>{const fn=()=>{window.scrollTo(0,0);setPath(route())};addEventListener('hashchange',fn);return()=>removeEventListener('hashchange',fn)},[]);const parts=path.split('/').filter(Boolean);let page;if(parts[0]==='card')page=<CardRoute kind={parts[1]??''} id={safeDecode(parts.slice(2).join('/'))}/>;else if(path==='/stats')page=<Stats/>;else if(path==='/library')page=<Library/>;else if(path==='/settings')page=<SettingsPage/>;else if(path==='/assessment')page=<Assessment/>;else page=<Home/>;const showNav=parts[0]!=='card';return <div class="app-shell">{page}{showNav&&<nav>{tabs.map(t=><a href={`#${t[0]}`} class={path===t[0]?'active':''}><i>{t[1]}</i><span>{t[2]}</span></a>)}<a href="#/assessment" class={path==='/assessment'?'active':''}><i>◎</i><span>测评</span></a></nav>}</div>}
