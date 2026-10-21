// 语音：iOS 自带英文发音（TTS）+ Safari 语音识别

let preferredVoiceName = ''
let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return []
  const v = speechSynthesis.getVoices()
  if (v.length) cachedVoices = v
  return cachedVoices
}

if (typeof speechSynthesis !== 'undefined') {
  loadVoices()
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined'
}

/** 可选的英文发音人（只列 en-US / en-GB） */
export function englishVoices(): SpeechSynthesisVoice[] {
  return loadVoices().filter((v) => /^en[-_](US|GB)/i.test(v.lang))
}

export function setPreferredVoice(name: string): void {
  preferredVoiceName = name
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const list = englishVoices()
  if (preferredVoiceName) {
    const v = list.find((x) => x.name === preferredVoiceName)
    if (v) return v
  }
  // 优先挑高质量美音
  const prefer = ['Samantha', 'Ava', 'Allison', 'Susan', 'Nicky', 'Karen', 'Daniel']
  for (const name of prefer) {
    const v = list.find((x) => x.name.startsWith(name) && /en[-_]US/i.test(x.lang))
    if (v) return v
  }
  return list.find((x) => /en[-_]US/i.test(x.lang)) ?? list[0]
}

/** 朗读一句话，读完后 resolve */
export function speak(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve()
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice()
    if (v) u.voice = v
    u.lang = v?.lang ?? 'en-US'
    u.rate = rate
    u.onend = () => resolve()
    u.onerror = () => resolve()
    speechSynthesis.speak(u)
  })
}

/** 依次朗读多句，可通过返回的 stop 中断 */
export function speakAll(sentences: string[], rate: number, onIndex?: (i: number) => void) {
  let stopped = false
  const done = (async () => {
    for (let i = 0; i < sentences.length && !stopped; i++) {
      onIndex?.(i)
      await speak(sentences[i], rate)
      if (!stopped) await new Promise((r) => setTimeout(r, 250))
    }
    onIndex?.(-1)
  })()
  return {
    done,
    stop() {
      stopped = true
      if (canSpeak()) speechSynthesis.cancel()
    },
  }
}

export function stopSpeaking(): void {
  if (canSpeak()) speechSynthesis.cancel()
}

// ---------- 语音识别 ----------

type Rec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

function recCtor(): (new () => Rec) | undefined {
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function canRecognize(): boolean {
  return !!recCtor()
}

export interface ListenResult {
  alternatives: string[] // 多个候选，评分时取最好
  error?: string // 'not-allowed' | 'no-speech' | 'network' ...
}

export interface ListenSession {
  result: Promise<ListenResult>
  stop(): void // 说完了，主动结束
  onInterim?: (text: string) => void
}

/**
 * 开始识别。用户说完后点"完成"调用 stop()，或停顿后自动结束。
 * 最长 30 秒（自由表达时可传更长）。
 */
export function listen(onInterim?: (text: string) => void, maxMs = 30000, continuous = false): ListenSession {
  const Ctor = recCtor()
  if (!Ctor) {
    return { result: Promise.resolve({ alternatives: [], error: 'unsupported' }), stop() {} }
  }
  stopSpeaking()
  const rec = new Ctor()
  rec.lang = 'en-US'
  rec.continuous = continuous
  rec.interimResults = true
  rec.maxAlternatives = 3

  // 连续模式下，多段结果按顺序拼接
  const finals: string[][] = []
  let interim = ''
  let error: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let settled = false
  let finish!: (forcedError?: string) => void

  const result = new Promise<ListenResult>((resolve) => {
    finish = (forcedError?: string) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      const parts = finals.filter(Boolean)
      let alternatives: string[]
      if (parts.length === 0) alternatives = interim.trim() ? [interim.trim()] : []
      else if (parts.length === 1) alternatives = parts[0]
      else alternatives = [parts.map((a) => a[0]).join(' ')]
      if (interim.trim() && parts.length) alternatives = alternatives.map((a) => a + ' ' + interim.trim())
      resolve({ alternatives, error: alternatives.length ? undefined : forcedError ?? error ?? 'no-speech' })
    }
    rec.onresult = (e: any) => {
      interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) {
          const alts: string[] = []
          for (let k = 0; k < r.length; k++) alts.push(r[k].transcript.trim())
          finals[i] = alts
        } else interim += r[0].transcript
      }
      const shown = finals.map((a) => a?.[0] ?? '').join(' ') + ' ' + interim
      onInterim?.(shown.trim())
    }
    rec.onerror = (e: any) => {
      error = e?.error ?? 'error'
      try { rec.abort() } catch { /* 已结束 */ }
      finish(error)
    }
    rec.onend = () => finish()
  })

  try {
    rec.start()
  } catch {
    finish('start-failed')
  }
  if (!settled) timer = setTimeout(() => {
    try { rec.abort() } catch { /* 已结束 */ }
    finish('timeout')
  }, maxMs + 1500)
  return {
    result,
    stop: () => {
      try { rec.stop() } catch { finish() }
      // Safari 偶尔不派发 onend，给主动停止一个短兜底
      setTimeout(() => finish(), 1200)
    },
  }
}

export function errorText(code?: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '没有麦克风或语音识别权限。请在 iPhone「设置 → Safari → 麦克风」中允许，并确认「设置 → 通用 → 键盘 → 启用听写」已打开。'
    case 'no-speech':
      return '没听到声音，再试一次，靠近一点说。'
    case 'network':
      return '语音识别需要联网，请检查网络。'
    case 'unsupported':
      return '当前浏览器不支持语音识别，请用 iPhone 的 Safari 打开。'
    default:
      return '识别出错了，再试一次。'
  }
}

// ---------- 录音（识别不可用时的降级方案） ----------

export interface Recording {
  stop(): Promise<string> // 返回可播放的 blob URL
}

export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mr = new MediaRecorder(stream)
  const chunks: Blob[] = []
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  mr.start()
  return {
    stop: () =>
      new Promise((resolve) => {
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          resolve(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })))
        }
        mr.stop()
      }),
  }
}
