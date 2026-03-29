import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

export interface DotConfig {
  cloudflare: {
    api_token: string
    account_id: string
    kv_namespace_id: string
    worker: {
      name: string
      domain: string
    }
  }
  discord: {
    webhook_url: string
  }
}

export function loadConfig(): DotConfig {
  const configPath = path.join(os.homedir(), '.config', 'dot', 'main.toml')
  const content = fs.readFileSync(configPath, 'utf-8')
  return parseToml(content)
}

function parseToml(content: string): DotConfig {
  const config = {
    cloudflare: {
      api_token: '',
      account_id: '',
      kv_namespace_id: '',
      worker: {
        name: '',
        domain: '',
      },
    },
    discord: {
      webhook_url: '',
    },
  }

  let currentSection = ''
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const sectionMatch = trimmed.match(/^\[(.+)]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      continue
    }

    const kvMatch = trimmed.match(/^(\w+)\s*=\s*"(.*)"$/)
    if (!kvMatch) continue
    const [, key, value] = kvMatch

    if (currentSection === 'cloudflare') {
      if (key === 'api_token') config.cloudflare.api_token = value
      if (key === 'account_id') config.cloudflare.account_id = value
      if (key === 'kv_namespace_id') config.cloudflare.kv_namespace_id = value
    }
    if (currentSection === 'cloudflare.worker') {
      if (key === 'name') config.cloudflare.worker.name = value
      if (key === 'domain') config.cloudflare.worker.domain = value
    }
    if (currentSection === 'discord') {
      if (key === 'webhook_url') config.discord.webhook_url = value
    }
  }

  return config
}
