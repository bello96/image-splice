#!/usr/bin/env node
// 一键部署：npm run deploy
//
// 本机公司代理对 api.cloudflare.com 不稳定，wrangler 检测到代理环境变量
// 会强制走代理并报 fetch failed，因此这里清除代理变量后直连部署。
// 构建无需单独执行：wrangler.jsonc 的 build.command 会自动先跑 npm run build。
//
// 支持透传参数，例如试运行：npm run deploy -- --dry-run
import { spawnSync } from 'node:child_process'

const env = { ...process.env }
for (const key of Object.keys(env)) {
  if (/^(https?|all)_proxy$/i.test(key)) delete env[key]
}

const result = spawnSync('npx', ['wrangler', 'deploy', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)
