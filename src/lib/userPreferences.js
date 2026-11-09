const PREFERENCES_KEY = 'rafeaq_preferences_v1'

export const DEFAULT_PREFERENCES = {
  theme: 'light',
  fontSize: 'medium',
  reduceMotion: false,
  speechRate: 1,
  voiceURI: '',
  responseStyle: 'balanced',
}

export function readUserPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')
    return {
      ...DEFAULT_PREFERENCES,
      ...stored,
      theme: ['light', 'dark'].includes(stored.theme) ? stored.theme : 'light',
      fontSize: ['small', 'medium', 'large'].includes(stored.fontSize) ? stored.fontSize : 'medium',
      reduceMotion: stored.reduceMotion === true,
      speechRate: Number.isFinite(stored.speechRate)
        ? Math.min(1.4, Math.max(0.7, stored.speechRate))
        : DEFAULT_PREFERENCES.speechRate,
      voiceURI: typeof stored.voiceURI === 'string' ? stored.voiceURI : '',
      responseStyle: ['concise', 'balanced', 'detailed'].includes(stored.responseStyle)
        ? stored.responseStyle
        : 'balanced',
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function saveUserPreferences(updates) {
  const preferences = { ...readUserPreferences(), ...updates }
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent('rafeeq-preferences-change', { detail: preferences }))
  return preferences
}
