// تخزين الامتحانات والبطاقات على جهاز الطالب (localStorage)
const KEY = 'rafeeq_study_v1'

function readAll() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    return { quizzes: data?.quizzes || [], decks: data?.decks || [] }
  } catch {
    return { quizzes: [], decks: [] }
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false // الذاكرة ممتلئة
  }
}

export function saveItem(kind, item) { // kind: 'quizzes' | 'decks'
  const all = readAll()
  all[kind].unshift({ id: Date.now().toString(), savedAt: new Date().toISOString(), ...item })
  return writeAll(all)
}

export const listItems = (kind) => readAll()[kind]

export function deleteItem(kind, id) {
  const all = readAll()
  all[kind] = all[kind].filter((x) => x.id !== id)
  writeAll(all)
}