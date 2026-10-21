// 跟读评分：归一化 + 按词 LCS 比对

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function numToWords(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
  if (n < 1000) {
    const rest = n % 100
    return ONES[Math.floor(n / 100)] + ' hundred' + (rest ? ' ' + numToWords(rest) : '')
  }
  if (n < 10000 && n % 100 === 0 && n % 1000 !== 0) {
    return numToWords(n / 100) + ' hundred'
  }
  if (n >= 1900 && n < 2100) {
    // 年份读法：2018 → twenty eighteen
    const hi = Math.floor(n / 100)
    const lo = n % 100
    if (lo === 0) return numToWords(hi) + ' hundred'
    return numToWords(hi) + ' ' + (lo < 10 ? 'oh ' + ONES[lo] : numToWords(lo))
  }
  return String(n)
}

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/\bshan't\b/g, 'shall not'],
  [/\blet's\b/g, 'let us'],
  [/\bi'm\b/g, 'i am'],
  [/n't\b/g, ' not'],
  [/'re\b/g, ' are'],
  [/'ve\b/g, ' have'],
  [/'ll\b/g, ' will'],
  [/'d\b/g, ' would'],
  [/'s\b/g, ' is'],
]

const SYNONYMS: Record<string, string> = {
  okay: 'ok',
  'o.k.': 'ok',
  mr: 'mister',
  mrs: 'missus',
  ms: 'miss',
  percent: 'percent',
}

/** 把一段文本归一化成单词数组。目标句和识别结果走同一套规则，保证可比 */
export function normalize(text: string): string[] {
  let t = text.toLowerCase().replace(/[’‘`]/g, "'")
  // 时间 2:30 → two thirty，2:00 → two
  t = t.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) =>
    m === '00' ? ` ${h} ` : ` ${h} ${Number(m) < 10 ? 'oh ' + Number(m) : m} `)
  t = t.replace(/(\d+)%/g, '$1 percent')
  t = t.replace(/\$(\d+)/g, '$1 dollars')
  t = t.replace(/(\d+)(st|nd|rd|th)\b/g, '$1')
  t = t.replace(/\b(\d+)\b/g, (_, n) => ' ' + numToWords(Number(n)) + ' ')
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep)
  t = t.replace(/[-–—/]/g, ' ')
  t = t.replace(/[^a-z' ]+/g, ' ').replace(/'/g, '')
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => SYNONYMS[w] ?? w)
}

/** LCS，返回 a 中每个位置是否被匹配 */
function lcsMatch(a: string[], b: string[]): boolean[] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const matched = new Array(n).fill(false)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      matched[i] = true
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return matched
}

function editDistance(a: string[], b: string[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = next
  }
  return prev[b.length]
}

const POLARITY = new Set(['not', 'no', 'never', 'without'])

export interface WordMark {
  text: string // 原句中的展示词（带标点）
  ok: boolean
}

export interface SentenceScore {
  score: number // 0~1
  marks: WordMark[]
}

/** 对目标句和识别结果打分，heard 可传多个候选，取最高分 */
export function scoreSentence(target: string, heard: string | string[]): SentenceScore {
  const candidates = Array.isArray(heard) ? heard : [heard]
  const display = target.split(/\s+/).filter(Boolean)
  const groups = display.map((d) => normalize(d))
  const flat = groups.flat()
  let best: SentenceScore = { score: 0, marks: display.map((text) => ({ text, ok: false })) }
  if (flat.length === 0) return { score: 1, marks: [] }
  for (const h of candidates) {
    const heardWords = normalize(h)
    const matched = lcsMatch(flat, heardWords)
    let k = 0
    const marks = display.map((text, idx) => {
      const len = groups[idx].length
      // 纯标点 token（归一化后为空）视为正确
      const ok = matched.slice(k, k + len).every(Boolean)
      k += len
      return { text, ok }
    })
    let score = 1 - editDistance(flat, heardWords) / Math.max(flat.length, heardWords.length, 1)
    // 否定/极性词的增删会改变句义，不能仅当普通发音小错处理
    const targetPolarity = flat.filter((w) => POLARITY.has(w))
    const heardPolarity = heardWords.filter((w) => POLARITY.has(w))
    if (targetPolarity.join('|') !== heardPolarity.join('|')) score = Math.min(score, 0.4)
    score = Math.max(0, score)
    if (score > best.score) best = { score, marks }
  }
  return best
}

/** 判断 heard 中是否按顺序连续包含 phrase */
function containsPhrase(heard: string[], phrase: string[]): boolean {
  if (phrase.length === 0) return true
  outer: for (let i = 0; i + phrase.length <= heard.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (heard[i + j] !== phrase[j]) continue outer
    return true
  }
  return false
}

export interface JudgeResult {
  pass: boolean
  score: number
  missing: string[] // 未说出的关键表达
  bestAnswer: string // 最接近的参考答案
}

/**
 * 判定一句回答是否通过：
 * - 提供了关键表达：必须全部命中
 * - 未提供关键表达：与任一参考答案的相似度 >= threshold
 */
export function judge(
  answers: string[],
  heard: string | string[],
  keywords: string[] = [],
  threshold = 0.8,
): JudgeResult {
  const candidates = Array.isArray(heard) ? heard : [heard]
  let best: JudgeResult = { pass: false, score: 0, missing: keywords, bestAnswer: answers[0] ?? '' }
  for (const h of candidates) {
    const hw = normalize(h)
    // 关键表达支持 "a|b" 多选一
    const missing = keywords.filter(
      (k) => !k.split('|').some((alt) => containsPhrase(hw, normalize(alt))),
    )
    for (const a of answers) {
      const s = scoreSentence(a, h).score
      // 有关键表达时必须全部命中（防止语序错误靠相似度蒙混过关）
      const pass = keywords.length > 0 ? missing.length === 0 : s >= threshold
      const better =
        (pass && !best.pass) || (pass === best.pass && s > best.score)
      if (better) best = { pass, score: s, missing, bestAnswer: a }
    }
  }
  return best
}
