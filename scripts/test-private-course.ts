const assertEqual=(actual:unknown,expected:unknown)=>{if(actual!==expected)throw new Error(`Expected ${String(expected)}, got ${String(actual)}`)}
import { validateLearningPlan, validatePrivateLesson } from '../src/private-course/validate.ts'
import type { PrivateLesson } from '../src/private-course/schema.ts'
import { parseLrc, parseNceLrc } from '../src/private-course/adapters/lrc.ts'
import { parseText } from '../src/private-course/adapters/text.ts'
import { matchNceAssets, parseNceAssetName } from '../src/private-course/match.ts'
import { canReview, canStartReviews, emptyMastery, masteryProgress, recordDictation, recordOriginalSpeed, recordReview, scoreDictation, startReviews } from '../src/lib/intensive.ts'
import { validateBackupData } from '../src/lib/backup.ts'

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

const dictation=scoreDictation('I did not go to the station at two.','I did go station at six.')
assertEqual(dictation.errorTypes.includes('polarity'),true);assertEqual(dictation.errorTypes.includes('number-time'),true);assertEqual(dictation.errorTypes.includes('preposition'),true)
assertEqual(scoreDictation('She walked home.','She walk home.').errorTypes.includes('word-ending'),true)
assertEqual(scoreDictation('They are playing.','They are play.').errorTypes.includes('word-ending'),true)
assertEqual(scoreDictation('She reads books.','She read book.').errorTypes.includes('word-ending'),true)
assertEqual(scoreDictation('He watches TV.','He watch TV.').errorTypes.includes('word-ending'),true)
let mastery=emptyMastery('lesson');const perfect=scoreDictation('Here they are.','Here they are.')
mastery=recordDictation(mastery,'s1',perfect);assertEqual(mastery.dictation.s1.passStreak,1)
mastery=recordDictation(mastery,'s1',perfect);assertEqual(masteryProgress(mastery,['s1']).dictation,1)
mastery=recordOriginalSpeed(mastery,.9,1.1);mastery=recordOriginalSpeed(mastery,.9,1.1);assertEqual(masteryProgress(mastery,['s1']).originalSpeed,true)
mastery={...mastery,shadowing:{s1:{ratesPassed:[.75,.9,1],bestScore:.9}},recall:{level:4,bestScore:.9,passStreak:4},retellCoverage:.8,transferPassed:1}
mastery=startReviews(mastery,['s1'],1,'2026-10-22');assertEqual(mastery.nextReview,'2026-10-23');assertEqual(canReview(mastery,['s1'],1,'2026-10-22'),false)
const allParts=['dictation','reaction','transfer'] as const
mastery=recordReview(mastery,{dictation:true,reaction:true,transfer:false},[...allParts],['s1'],1,'2026-10-23');assertEqual(mastery.nextReview,'2026-10-25')
let blocked=false;try{recordReview(mastery,{dictation:true},[...allParts],['s1'],1,'2026-10-25')}catch{blocked=true}assertEqual(blocked,true)
const failed=recordReview({...mastery,nextReview:'2026-10-25'},{dictation:false,reaction:true,transfer:false},[...allParts],['s1'],1,'2026-10-25');assertEqual(failed.reviewPending?.join(','),'dictation,transfer');assertEqual(failed.reviewIndex,1)
let retry=recordReview(failed,{dictation:true,transfer:true},['dictation','transfer'],['s1'],1,'2026-10-26');assertEqual(retry.nextReview,'2026-10-29')
retry=recordReview(retry,{dictation:true,reaction:true,transfer:true},[...allParts],['s1'],1,'2026-10-29');assertEqual(retry.nextReview,'2026-11-05')
retry=recordReview(retry,{dictation:true,reaction:true,transfer:true},[...allParts],['s1'],1,'2026-11-05');assertEqual(retry.nextReview,'2026-11-21')
retry=recordReview(retry,{dictation:true,reaction:true,transfer:true},[...allParts],['s1'],1,'2026-11-21');assertEqual(retry.stable,true);assertEqual(retry.nextReview,undefined)
const degraded={...mastery,originalSpeed:{...mastery.originalSpeed,passStreak:0},nextReview:'2026-10-25'};assertEqual(canReview(degraded,['s1'],1,'2026-10-25'),false)
console.log('intensive mastery checks passed')

assertEqual(canStartReviews(mastery,['s1'],1),true)
assertEqual(canStartReviews({...mastery,retellCoverage:0},['s1'],1),false)
assertEqual(canStartReviews({...mastery,recall:{...mastery.recall,level:3}},['s1'],1),false)
assertEqual(canStartReviews({...mastery,dictation:{}},['s1'],1),false)
const settings={dailyGoal:4,rate:.85,voiceName:'',newWordsPerDay:5,onboarded:true}
const stores={srs:[],daily:[],progress:[],imports:[],assessments:[],plans:[],lessonMastery:[retry]}
const backup={version:3,createdAt:new Date().toISOString(),settings,appState:{},stores}
assertEqual(validateBackupData(backup),true)
assertEqual(validateBackupData({...backup,stores:{...stores,lessonMastery:[{...retry,currentStage:8.5}]}}),false)
assertEqual(validateBackupData({...backup,stores:{...stores,lessonMastery:[{...retry,shadowing:{s1:{ratesPassed:['1'],bestScore:.9}}}]}}),false)
assertEqual(validateBackupData({...backup,stores:{...stores,lessonMastery:[{...retry,stable:false,reviewIndex:2,nextReview:'2026-99-99'}]}}),false)
console.log('backup invariants checks passed')