# Quota Monitor Quick Start (Sync + Continue)

## 0) 项目共存或删除

- 推荐先共存：保留 `~/monit` 作为开发源，`~/xin_wiki/projects/quota-monitor` 作为同步副本。
- 确认 wiki 侧运行稳定后，再决定是否删除 `~/monit`。

## 1) 本地启动

```bash
cd ~/monit
npm install
npm start
```

- 默认前端地址：`http://localhost:3001`

## 2) Codex 登录（无需 codexbar）

- 设置页点击 `Start Login`，后端会：
1. 先尝试连接你当前 Chrome（CDP: `http://127.0.0.1:9222`）。
2. 连不上再启动独立 Playwright 浏览器。

- 若要优先复用当前 Chrome，请先用调试端口启动 Chrome：

```bash
open -na "Google Chrome" --args --remote-debugging-port=9222
```

- 登录成功后，会话写入：`data/codex_web_session.json`

## 3) 同步到 Wiki 项目（已排除敏感信息和依赖）

```bash
cd ~/monit
./scripts/sync-to-wiki.sh
```

- 默认同步到：`~/xin_wiki/projects/quota-monitor`
- 默认排除：
1. `config.json`
2. `data/`
3. `.env*`
4. `node_modules/`
5. `dist/`
6. `*.log`

## 4) 在公司继续开发

```bash
cd ~/xin_wiki/projects/quota-monitor
npm install
npm start
```

## 5) 可选：删除旧目录（确认稳定后）

```bash
rm -rf ~/monit
```

- 建议先确认：
1. `~/xin_wiki/projects/quota-monitor` 可正常启动
2. Codex 配额能正常读取
3. 你需要的本地配置已另行备份
