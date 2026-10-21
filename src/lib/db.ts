// IndexedDB 封装：所有学习数据只存在本机
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SrsState } from './srs.ts'
import { addCard, emptyDay, type DayRecord } from './daily.ts'
import { dayStr } from './date.ts'
import type { LearningPlan, PrivateLesson } from '../private-course/schema.ts'

export interface CardProgress {
  id: string // 卡片 key，例如 listen:w1l1
  done: boolean
  step: number // 卡片内进行到第几步，用于中断续学
  updatedAt: number
  doneAt?: string
  reactionMs?: number
  correctStreak?: number
  chineseHints?: number
  direct?: boolean
}

export interface ImportedLesson {
  id: string
  title: string
  sentences: string[]
  privateLesson?: PrivateLesson
  audio?: Blob
  audioName?: string
  createdAt: number
}

export interface AssessmentRecord {
  id: string // 日期 + 时间戳
  date: string
  kind: 'initial' | 'retest'
  listening: number // 0~1
  grammar: number // 0~1
  readAloud: number // 0~1 朗读准确率
  speakingWords: number // 自由表达总词数
  speakingWpm: number // 自由表达语速（词/分钟）
  transcripts: string[]
}

export interface Settings {
  dailyGoal: number
  rate: number // 默认语速
  voiceName: string // 空字符串表示自动
  newWordsPerDay: number
  onboarded: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 4,
  rate: 0.85,
  voiceName: '',
  newWordsPerDay: 5,
  onboarded: false,
}

interface AppDB extends DBSchema {
  kv: { key: string; value: unknown }
  srs: { key: string; value: SrsState }
  daily: { key: string; value: DayRecord }
  progress: { key: string; value: CardProgress }
  imports: { key: string; value: ImportedLesson }
  assessments: { key: string; value: AssessmentRecord }
  plans: { key: string; value: LearningPlan }
}

export const STORES = ['kv', 'srs', 'daily', 'progress', 'imports', 'assessments', 'plans'] as const
export type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

export function db(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('english-app', 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore('kv')
          d.createObjectStore('srs', { keyPath: 'id' })
          d.createObjectStore('daily', { keyPath: 'date' })
          d.createObjectStore('progress', { keyPath: 'id' })
          d.createObjectStore('imports', { keyPath: 'id' })
          d.createObjectStore('assessments', { keyPath: 'id' })
        }
        if (oldVersion < 2) d.createObjectStore('plans', { keyPath: 'id' })
      },
    })
    // 申请持久化存储，降低被 Safari 自动清理的概率
    navigator.storage?.persist?.().catch(() => {})
  }
  return dbPromise
}

// ---------- 设置 ----------
export async function getSettings(): Promise<Settings> {
  const v = (await (await db()).get('kv', 'settings')) as Partial<Settings> | undefined
  return { ...DEFAULT_SETTINGS, ...(v ?? {}) }
}

export async function saveSettings(s: Settings): Promise<void> {
  await (await db()).put('kv', s, 'settings')
}

// ---------- 进度 ----------
export async function getProgress(id: string): Promise<CardProgress | undefined> {
  return (await db()).get('progress', id)
}

export async function allProgress(): Promise<Map<string, CardProgress>> {
  const list = await (await db()).getAll('progress')
  return new Map(list.map((p) => [p.id, p]))
}

export async function saveStep(id: string, step: number): Promise<void> {
  const d = await db()
  const old = await d.get('progress', id)
  await d.put('progress', { ...(old ?? { id, done: false }), id, step, updatedAt: Date.now() })
}

/** 完成一张卡片：写进度 + 记入当天统计 */
export async function completeCard(id: string, kind: string, seconds: number, keepDone = true): Promise<void> {
  const d = await db()
  const today = dayStr()
  const old = await d.get('progress', id)
  await d.put('progress', {
    id,
    done: keepDone || (old?.done ?? false),
    step: 0,
    updatedAt: Date.now(),
    doneAt: today,
  })
  const rec = (await d.get('daily', today)) ?? emptyDay(today)
  await d.put('daily', addCard(rec, kind, seconds))
}

// ---------- 统计 ----------
export async function allDays(): Promise<Map<string, DayRecord>> {
  const list = await (await db()).getAll('daily')
  return new Map(list.map((r) => [r.date, r]))
}

// ---------- 词汇 ----------
export async function allSrs(): Promise<Map<string, SrsState>> {
  const list = await (await db()).getAll('srs')
  return new Map(list.map((s) => [s.id, s]))
}

export async function putSrs(s: SrsState): Promise<void> {
  await (await db()).put('srs', s)
}

// ---------- 导入资料 ----------
export async function allImports(): Promise<ImportedLesson[]> {
  const list = await (await db()).getAll('imports')
  return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }))
}

export async function getImport(id: string): Promise<ImportedLesson | undefined> {
  return (await db()).get('imports', id)
}

export async function putImport(l: ImportedLesson): Promise<void> {
  await (await db()).put('imports', l)
}

export async function deleteImport(id: string): Promise<void> {
  await (await db()).delete('imports', id)
}

// ---------- 测评 ----------
export async function allAssessments(): Promise<AssessmentRecord[]> {
  const list = await (await db()).getAll('assessments')
  return list.sort((a, b) => a.id.localeCompare(b.id))
}

export async function putAssessment(a: AssessmentRecord): Promise<void> {
  await (await db()).put('assessments', a)
}

// ---------- 学习计划 ----------
export async function allPlans(): Promise<LearningPlan[]> {
  return (await (await db()).getAll('plans')).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function putPlan(plan: LearningPlan): Promise<void> {
  const d = await db()
  await d.put('plans', plan)
  const active = await d.get('kv', 'activePlanId')
  if (!active) {
    await d.put('kv', plan.id, 'activePlanId')
    await d.put('kv', plan.startLessonId, 'currentPrivateLessonId')
  }
}

export async function getActivePlan(): Promise<LearningPlan | undefined> {
  const d = await db()
  const id = await d.get('kv', 'activePlanId')
  return typeof id === 'string' ? d.get('plans', id) : undefined
}

export async function setActivePlan(planId: string): Promise<void> {
  const d = await db()
  const plan = await d.get('plans', planId)
  if (!plan) throw new Error('找不到学习计划')
  await d.put('kv', planId, 'activePlanId')
  await d.put('kv', plan.startLessonId, 'currentPrivateLessonId')
}

export async function getCurrentPrivateLessonId(): Promise<string | undefined> {
  const value = await (await db()).get('kv', 'currentPrivateLessonId')
  return typeof value === 'string' ? value : undefined
}

export async function setCurrentPrivateLessonId(id: string): Promise<void> {
  await (await db()).put('kv', id, 'currentPrivateLessonId')
}

/** 原子写入一批私有课程和计划；任一写入失败会整体回滚 */
export async function putPrivateBatch(items: ImportedLesson[], plans: LearningPlan[]): Promise<void> {
  const d = await db()
  const tx = d.transaction(['imports', 'plans', 'kv'], 'readwrite')
  for (const item of items) await tx.objectStore('imports').put(item)
  for (const plan of plans) await tx.objectStore('plans').put(plan)
  const active = await tx.objectStore('kv').get('activePlanId')
  if (!active && plans[0]) {
    await tx.objectStore('kv').put(plans[0].id, 'activePlanId')
    await tx.objectStore('kv').put(plans[0].startLessonId, 'currentPrivateLessonId')
  }
  await tx.done
}

export async function clearCurrentPrivateLesson(): Promise<void> {
  await (await db()).delete('kv', 'currentPrivateLessonId')
}
