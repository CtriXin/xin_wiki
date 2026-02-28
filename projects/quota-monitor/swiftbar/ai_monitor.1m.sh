#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/Users/xin/.nvm/versions/node/v22.22.0/bin:${PATH:-}"

BASE_URL="${MONIT_API_BASE:-http://127.0.0.1:3001}"
PREF_FILE="${HOME}/.monit_swiftbar_top_mode"

if [[ "${1:-}" == "--set-top" ]]; then
  mode="${2:-auto}"
  case "$mode" in
    auto|kimi|minimax|codex|gemini|bailian) ;;
    *) mode="auto" ;;
  esac
  echo "$mode" > "$PREF_FILE"
  echo "Top mode set: $mode"
  exit 0
fi

TOP_MODE="auto"
if [[ -f "$PREF_FILE" ]]; then
  v="$(tr -d '[:space:]' < "$PREF_FILE" | tr '[:upper:]' '[:lower:]')"
  case "$v" in
    auto|kimi|minimax|codex|gemini|bailian) TOP_MODE="$v" ;;
  esac
fi

fetch_json() {
  local url="$1"
  if ! curl -sS --max-time 8 "$url" 2>/dev/null; then
    echo '{"error":"request failed","configured":false}'
  fi
}

if ! command -v node >/dev/null 2>&1; then
  echo "AI Monitor: node missing | color=#b91c1c"
  echo "---"
  echo "node not found in PATH"
  echo "PATH: $PATH"
  exit 0
fi

providers_json="$(fetch_json "$BASE_URL/api/providers")"
kimi_json="$(fetch_json "$BASE_URL/api/quota/kimi")"
minimax_json="$(fetch_json "$BASE_URL/api/quota/minimax")"
bailian_json="$(fetch_json "$BASE_URL/api/quota/bailian")"
codex_json="$(fetch_json "$BASE_URL/api/quota/codex")"
gemini_json="$(fetch_json "$BASE_URL/api/quota/gemini")"

node - "$providers_json" "$kimi_json" "$minimax_json" "$bailian_json" "$codex_json" "$gemini_json" "$BASE_URL" "$TOP_MODE" "$0" <<'NODE'
function parse(src) {
  try {
    return JSON.parse(src);
  } catch {
    return { error: "bad json", configured: false };
  }
}

function p1(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(1);
}

function bar(v, width = 6) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `[${"-".repeat(width)}]`;
  const clamped = Math.max(0, Math.min(100, n));
  const fill = Math.round((clamped / 100) * width);
  return `[${"#".repeat(fill)}${"-".repeat(width - fill)}]`;
}

function h(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(1)}h`;
}

function ok(d) {
  return d && !d.error;
}

function pickPercent(provider, d) {
  if (!ok(d)) return null;
  switch (provider) {
    case "kimi": return d.percentage ?? null;
    case "minimax": return d.percentage ?? null;
    case "bailian": return d.fiveHour?.percentage ?? null;
    case "codex": return d.periods?.fiveHour?.percent ?? null;
    case "gemini": return d.periods?.pro?.percent ?? null;
    default: return null;
  }
}

const [providersRaw, kimiRaw, minimaxRaw, bailianRaw, codexRaw, geminiRaw, baseUrl, topMode, scriptPath] = process.argv.slice(2);
const providersResp = parse(providersRaw);
const kimi = parse(kimiRaw);
const minimax = parse(minimaxRaw);
const bailian = parse(bailianRaw);
const codex = parse(codexRaw);
const gemini = parse(geminiRaw);

const pct = {
  kimi: pickPercent("kimi", kimi),
  minimax: pickPercent("minimax", minimax),
  bailian: pickPercent("bailian", bailian),
  codex5h: codex?.periods?.fiveHour?.percent ?? null,
  codex1w: codex?.periods?.week?.percent ?? null,
  geminiPro: gemini?.periods?.pro?.percent ?? null,
  geminiFlash: gemini?.periods?.flash?.percent ?? null,
};

const allOk = [kimi, minimax, bailian, codex, gemini].every(ok);
const color = allOk ? "color=#0f766e" : "color=#b91c1c";

let topTitle = "";
if (topMode === "kimi") {
  topTitle = `Kimi ${bar(pct.kimi)} ${p1(pct.kimi)}%`;
} else if (topMode === "minimax") {
  topTitle = `MiniMax ${bar(pct.minimax)} ${p1(pct.minimax)}%`;
} else if (topMode === "codex") {
  topTitle = `Codex 5h ${bar(pct.codex5h)} ${p1(pct.codex5h)}% | 1w ${bar(pct.codex1w)} ${p1(pct.codex1w)}%`;
} else if (topMode === "gemini") {
  topTitle = `Gemini P ${bar(pct.geminiPro)} ${p1(pct.geminiPro)}% | F ${bar(pct.geminiFlash)} ${p1(pct.geminiFlash)}%`;
} else if (topMode === "bailian") {
  const b1w = bailian?.weekly?.percentage ?? null;
  topTitle = `Bailian 5h ${bar(pct.bailian)} ${p1(pct.bailian)}% | 1w ${bar(b1w)} ${p1(b1w)}%`;
} else {
  topTitle = `AI K:${p1(pct.kimi)} M:${p1(pct.minimax)} C:${p1(pct.codex5h)} G:${p1(pct.geminiPro)} B:${p1(pct.bailian)}`;
}

console.log(`${topTitle} | ${color}`);
console.log("---");
console.log(`Open Dashboard | href=${baseUrl}`);
console.log(`Top Mode: ${topMode}`);
console.log(`Providers: ${(providersResp.providers || []).join(", ")}`);
if (scriptPath) {
  console.log(`Set Top: Auto | bash=${scriptPath} param1=--set-top param2=auto terminal=false refresh=true`);
  console.log(`Set Top: Kimi | bash=${scriptPath} param1=--set-top param2=kimi terminal=false refresh=true`);
  console.log(`Set Top: MiniMax | bash=${scriptPath} param1=--set-top param2=minimax terminal=false refresh=true`);
  console.log(`Set Top: Codex | bash=${scriptPath} param1=--set-top param2=codex terminal=false refresh=true`);
  console.log(`Set Top: Gemini | bash=${scriptPath} param1=--set-top param2=gemini terminal=false refresh=true`);
  console.log(`Set Top: Bailian | bash=${scriptPath} param1=--set-top param2=bailian terminal=false refresh=true`);
}
console.log("---");

if (ok(kimi)) {
  console.log(`Kimi: ${bar(kimi.percentage)} ${p1(kimi.percentage)}%  used=${kimi.used ?? "-"} remain=${kimi.remaining ?? "-"}`);
  if (kimi.rateLimit) {
    console.log(`  Rate: ${bar(kimi.rateLimit.percentage)} ${p1(kimi.rateLimit.percentage)}%`);
  }
} else {
  console.log(`Kimi error: ${kimi.error || "unknown"}`);
}
console.log("---");

if (ok(minimax)) {
  console.log(`MiniMax: ${bar(minimax.percentage)} ${p1(minimax.percentage)}%  used=${minimax.used ?? "-"} remain=${minimax.remaining ?? "-"}`);
  if (Array.isArray(minimax.models)) {
    for (const m of minimax.models.slice(0, 4)) {
      console.log(`  ${m.name}: ${bar(m.percentage)} ${p1(m.percentage)}%`);
    }
  }
} else {
  console.log(`MiniMax error: ${minimax.error || "unknown"}`);
}
console.log("---");

if (ok(codex)) {
  console.log(`Codex (${codex.source || "unknown"})`);
  console.log(`  5h: ${bar(codex.periods?.fiveHour?.percent)} ${p1(codex.periods?.fiveHour?.percent)}%`);
  console.log(`  5h reset: ${codex.periods?.fiveHour?.refreshAt || "-"} - ${h(codex.periods?.fiveHour?.refreshInHours)}`);
  console.log(`  1w: ${bar(codex.periods?.week?.percent)} ${p1(codex.periods?.week?.percent)}%`);
  console.log(`  1w reset: ${codex.periods?.week?.refreshAt || "-"} - ${h(codex.periods?.week?.refreshInHours)}`);
} else {
  console.log(`Codex error: ${codex.error || "unknown"}`);
}
console.log("---");

if (ok(gemini)) {
  console.log(`Gemini (${gemini.source || "unknown"})`);
  console.log(`  Pro: ${bar(gemini.periods?.pro?.percent)} ${p1(gemini.periods?.pro?.percent)}%`);
  console.log(`  Pro reset: ${gemini.periods?.pro?.refreshAt || "-"} - ${h(gemini.periods?.pro?.refreshInHours)}`);
  console.log(`  Flash: ${bar(gemini.periods?.flash?.percent)} ${p1(gemini.periods?.flash?.percent)}%`);
  console.log(`  Flash reset: ${gemini.periods?.flash?.refreshAt || "-"} - ${h(gemini.periods?.flash?.refreshInHours)}`);
} else {
  console.log(`Gemini error: ${gemini.error || "unknown"}`);
}
console.log("---");

if (ok(bailian)) {
  console.log(`Bailian (${bailian.instanceName || "Coding Plan"})`);
  console.log(`  5h: ${bar(bailian.fiveHour?.percentage)} ${p1(bailian.fiveHour?.percentage)}%`);
  console.log(`  5h reset: ${bailian.fiveHour?.refreshAt || "-"} - ${h(bailian.fiveHour?.refreshInHours)}`);
  console.log(`  1w: ${bar(bailian.weekly?.percentage)} ${p1(bailian.weekly?.percentage)}%`);
  console.log(`  1w reset: ${bailian.weekly?.refreshAt || "-"} - ${h(bailian.weekly?.refreshInHours)}`);
  console.log(`  1m: ${bar(bailian.monthly?.percentage)} ${p1(bailian.monthly?.percentage)}%`);
  console.log(`  1m reset: ${bailian.monthly?.refreshAt || "-"} - ${h(bailian.monthly?.refreshInHours)}`);
} else {
  console.log(`Bailian error: ${bailian.error || "unknown"}`);
}
NODE
