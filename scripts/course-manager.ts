import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { parseNceLrc } from '../src/private-course/adapters/lrc.ts'
import { matchNceAssets } from '../src/private-course/match.ts'
import { validateLearningPlan, validatePrivateLesson } from '../src/private-course/validate.ts'
import type { LearningPlan, PrivateLesson } from '../src/private-course/schema.ts'

const argv=process.argv.slice(2),command=argv[0]
const arg=(name:string)=>{const i=argv.indexOf(`--${name}`);return i>=0?argv[i+1]:undefined}
const required=(name:string)=>{const v=arg(name);if(!v)throw new Error(`缺少 --${name}`);return resolve(v)}
async function files(dir:string):Promise<string[]>{const out:string[]=[];for(const x of await readdir(dir,{withFileTypes:true})){const p=join(dir,x.name);if(x.isDirectory())out.push(...await files(p));else out.push(p)}return out}
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex')

async function scan(source:string){
 const paths=await files(source),groups=matchNceAssets(paths.map(x=>basename(x))),complete=groups.filter(x=>x.lrc&&x.audio),missingAudio=groups.filter(x=>x.lrc&&!x.audio),orphanAudio=groups.filter(x=>x.audio&&!x.lrc)
 console.log(`扫描目录：${source}`);console.log(`识别课程：${groups.length}；完整配对：${complete.length}；缺音频：${missingAudio.length}；缺字幕：${orphanAudio.length}`)
 missingAudio.slice(0,20).forEach(x=>console.log(`  缺音频 ${x.lessonLabel} ${x.title}${x.incompleteAudio?'（下载未完成）':''}`));orphanAudio.slice(0,20).forEach(x=>console.log(`  缺字幕 ${x.lessonLabel} ${x.title}`))
}

async function build(source:string,output:string){
 const paths=await files(source),byName=new Map(paths.map(x=>[basename(x),x])),groups=matchNceAssets(paths.map(x=>basename(x))),wanted=(arg('lessons')??'').split(',').map(x=>Number(x.trim())).filter(Number.isFinite)
 const selected=groups.filter(x=>wanted.length===0||wanted.includes(Number(x.lessonLabel.slice(0,3)))).filter(x=>x.lrc&&x.audio)
 if(!selected.length)throw new Error('没有找到可生成的完整课程')
 await mkdir(output,{recursive:true});const ids:string[]=[]
 for(const g of selected){
  const lrcPath=byName.get(g.lrc!)!,audioPath=byName.get(g.audio!)!,parsed=parseNceLrc(await readFile(lrcPath,'utf8')),id=`nce1-${g.lessonLabel.slice(0,3)}`
  const lesson:PrivateLesson={schemaVersion:1,id,source:{type:'nce',title:parsed.title??g.title,book:'1',lesson:g.lessonLabel,language:'en-US'},sentences:parsed.content.map((c,i)=>({id:`s${i+1}`,text:c.text,startMs:c.startMs,endMs:c.endMs})),concepts:[],vocabulary:[],grammar:[],chunks:[],retell:[],transfers:[],media:{fileName:g.audio!,checksum:await hash(audioPath)},generatedAt:new Date().toISOString()}
  const check=validatePrivateLesson(lesson);if(!check.valid)throw new Error(`${id}: ${check.errors.join('；')}`)
  await writeFile(join(output,`${id}.lesson.json`),JSON.stringify(lesson,null,2));await copyFile(audioPath,join(output,g.audio!));ids.push(id)
 }
 const start=arg('start')??ids[0],plan:LearningPlan={schemaVersion:1,id:`plan-${Date.now()}`,title:arg('title')??'英语直接反应学习计划',lessonIds:ids,startLessonId:ids.includes(start)?start:ids[0],createdAt:new Date().toISOString()}
 const result=validateLearningPlan(plan,new Set(ids));if(!result.valid)throw new Error(result.errors.join('；'))
 await writeFile(join(output,'learning-plan.json'),JSON.stringify(plan,null,2));console.log(`已生成 ${ids.length} 课：${output}`)
}

async function validatePackages(source:string){
 const paths=await files(source),lessonPaths=paths.filter(x=>x.endsWith('.lesson.json')),known=new Set<string>();let mediaChecked=0
 for(const path of lessonPaths){const lesson=JSON.parse(await readFile(path,'utf8')) as PrivateLesson,result=validatePrivateLesson(lesson);if(!result.valid)throw new Error(`${basename(path)}: ${result.errors.join('；')}`);known.add(lesson.id);if(lesson.media){const media=join(source,lesson.media.fileName);const actual=await hash(media);if(lesson.media.checksum&&actual!==lesson.media.checksum)throw new Error(`${lesson.id}: 音频校验值不匹配`);mediaChecked++}}
 const planPath=paths.find(x=>basename(x)==='learning-plan.json');if(planPath){const plan=JSON.parse(await readFile(planPath,'utf8')) as LearningPlan,result=validateLearningPlan(plan,known);if(!result.valid)throw new Error(result.errors.join('；'))}
 console.log(`课程包校验通过：${known.size} 课，${mediaChecked} 个媒体文件${planPath?'，学习计划有效':''}`)
}

try{
 if(command==='scan')await scan(required('source'))
 else if(command==='build')await build(required('source'),required('output'))
 else if(command==='validate')await validatePackages(required('source'))
 else console.log('用法：\n  npm run course-manager -- scan --source <目录>\n  npm run course-manager -- build --source <目录> --output <目录> --lessons 015,031 --start nce1-015\n  npm run course-manager -- validate --source <课程包目录>')
}catch(e){console.error((e as Error).message);process.exitCode=1}
