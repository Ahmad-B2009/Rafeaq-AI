// src/lib/studyStore.js - حفظ الاختبارات والبطاقات محليا

export function saveItem(key, data) {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw? JSON.parse(raw) : []
    arr.unshift({ ...data, id: Date.now(), savedAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)))
    return true
  } catch (e) {
    console.error('saveItem failed', e)
    return false
  }
}

export function getItems(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function removeItem(key, id) {
  try {
    const arr = getItems(key).filter(x => x.id!== id)
    localStorage.setItem(key, JSON.stringify(arr))
    return true
  } catch {
    return false
  }
}