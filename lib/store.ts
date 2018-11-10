import * as fs from 'fs'
import * as path from 'path'
import {promisify} from 'util'

export interface Settings {
  apiToken?: string
}

interface Store {
  getSettings(): Settings
  setSettings(newSettings: Partial<Settings>): Promise<Settings>
}

export const store = (() => {
  let settings: Settings
  const settingsPath = path.resolve(__dirname, 'settings.json')
  try {
    settings = require('./settings.json') as Settings
  } catch (err) {
    settings = {}
    fs.writeFileSync(settingsPath, '{}')
  }
  
  const store: Store = {
    getSettings: () => {
      return settings
    },
    setSettings: (newSettings: Partial<Settings>) => {
      settings = {
        ...settings,
        ...newSettings,
      }
      return promisify(fs.writeFile)(
        settingsPath,
        JSON.stringify(settings),
      ).then(() => settings)
    },
  }
  return store
})()
