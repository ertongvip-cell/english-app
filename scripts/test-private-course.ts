const assertEqual=(actual:unknown,expected:unknown)=>{if(actual!==expected)throw new Error(`Expected ${String(expected)}, got ${String(actual)}`)}
import { validateLearningPlan, validatePrivateLesson } from '../src/private-course/validate.ts'
import type { PrivateLesson } from '../src/private-course/schema.ts'
import { parseLrc, parseNceLrc } from '../src/private-course/adapters/lrc.ts'
import { parseText } from '../src/private-course/adapters/text.ts'
import { matchNceAssets, parseNceAssetName } from '../src/private-course/match.ts'

const lesson:PrivateLesson={schemaVersion:1,id:'nce1-015',source:{type:'nce',title:'Sample',book:'1',lesson:'015&016',language:'en'},sentences:[{id:'s1',text:'Your passports, please.',startMs:1000,endMs:2500}],concepts:[{id:'c1',prompt:'What does the officer ask for?',options:['Passports','Tickets'],answer:0,sentenceIds:['s1']}],vocabulary:[{id:'w1',word:'passport',definitionEn:'an official document for international travel',collocations:['show a passport'],examples:['Here is my passport.']}],grammar:[{id:'g1',title:'Polite requests',explanationEn:'Please makes a request polite.',examples:['Your passport, please.']}],chunks:[{id:'r1',chunk:'..., please',meaningEn:'a polite request',scenario:'Ask for a passport.',acceptableAnswers:['Your passport, please.'],targetMs:3000,grammarId:'g1'}],retell:[{id:'rt1',prompt:'Retell the exchange.',keywords:['passport'],targetSeconds:20}],transfers:[{id:'t1',scene:'travel',role:'officer',situation:'Ask a traveller for a passport.',acceptableAnswers:['Your passport, please.'],keywords:['passport']}],media:{fileName:'015.mp3'},generatedAt:new Date().toISOString()}
assertEqual(validatePrivateLesson(lesson).valid,true)
assertEqual(validatePrivateLesson({...lesson,sentences:[{...lesson.sentences[0],endMs:500}]}).valid,false)
assertEqual(validatePrivateLesson({...lesson,chunks:[{...lesson.chunks[0],targetMs:200}]}).valid,false)
assertEqual(validateLearningPlan({schemaVersion:1,id:'p1',title:'Plan',lessonIds:['nce1-015'],startLessonId:'nce1-015',createdAt:new Date().toISOString()},new Set(['nce1-015'])).valid,true)
console.log('private course schema checks passed')

const lrc='[ti:Test]\n[00:00.50]Lesson 15\n[00:02.89]Test\n[00:06.37]Listen to the tape then answer this question.\n[00:12.30]Is it ready?\n[00:18.83]Yes, it is.\n[00:21.40]Thank you.'
const parsed=parseLrc(lrc)
assertEqual(parsed.cues.length,6);assertEqual(parsed.cues[0].startMs,500);assertEqual(parsed.cues[0].endMs,2890)
const nce=parseNceLrc(lrc);assertEqual(nce.lesson,'15');assertEqual(nce.leadQuestion,'Is it ready?');assertEqual(nce.content.length,2)
assertEqual(parseText('WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nHello there.','x.vtt').cues[0].endMs,2500)
const asset=parseNceAssetName("073&074－The Way to King Street.lrc")!;assertEqual(asset.lessonLabel,'073&074');assertEqual(asset.title,'The Way to King Street')
const groups=matchNceAssets(['015&016－Your Passports, Please..lrc','015&016－Your Passports, Please..mp3','052－End.mp3.baiduyun.p.downloading'])
assertEqual(groups[0].audio,'015&016－Your Passports, Please..mp3');assertEqual(groups[1].incompleteAudio,'052－End.mp3.baiduyun.p.downloading')
console.log('LRC, subtitle and asset matching checks passed')