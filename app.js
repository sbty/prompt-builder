/* ===== DOM ===== */
const $templateText = document.getElementById("templateText");
const $variablesText = document.getElementById("variablesText");
const $generateBtn = document.getElementById("generateBtn");
const $clearBtn = document.getElementById("clearBtn");
const $copyBtn = document.getElementById("copyBtn");
const $resultText = document.getElementById("resultText");
const $resultSection = document.getElementById("resultSection");
const $varListSection = document.getElementById("varListSection");
const $varList = document.getElementById("varList");
const $fileA = document.getElementById("fileA");
const $fileB = document.getElementById("fileB");

/* ===== File Load ===== */
function loadFile(input, target) {
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      target.value = ev.target.result;
    };
    reader.readAsText(file);
  });
}
loadFile($fileA, $templateText);
loadFile($fileB, $variablesText);

/* ===== Parse Variables (Text B) ===== */
function parseVariables(text) {
  const vars = {};
  text.split("\n").forEach((line) => {
    line = line.trim();
    if (!line) return;

    // 区切り文字の優先順位: = , タブ, 全角スペース2つ以上, 半角スペース2つ以上
    const separators = [/\s*=\s*/, /\s*,\s*/, /\t+/, /\u3000{2,}/, / {2,}/];
    for (const sep of separators) {
      const idx = line.search(sep);
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx).replace(sep, "").trim();
        if (key) vars[key] = val;
        return;
      }
    }
  });
  return vars;
}

/* ===== Detect Placeholders in Template ===== */
function detectPlaceholders(template) {
  const regex = /\{\{(.+?)\}\}/g;
  const found = [];
  let m;
  while ((m = regex.exec(template)) !== null) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  return found;
}

/* ===== Show Variable Tags ===== */
function showVarTags(placeholders, vars) {
  $varList.innerHTML = "";
  if (placeholders.length === 0) {
    $varListSection.style.display = "none";
    return;
  }
  $varListSection.style.display = "";
  placeholders.forEach((p) => {
    const tag = document.createElement("span");
    tag.className = "var-tag" + (vars[p] == null ? " missing" : "");
    tag.textContent = vars[p] != null ? `${p} → ${vars[p]}` : `${p} (未定義)`;
    $varList.appendChild(tag);
  });
}

/* ===== Generate ===== */
$generateBtn.addEventListener("click", () => {
  const template = $templateText.value;
  const vars = parseVariables($variablesText.value);
  const placeholders = detectPlaceholders(template);

  showVarTags(placeholders, vars);

  // Replace {{変数名}} with value
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    // Replace both {{key}} and bare key on its own line
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, "g"), val);
  }

  $resultText.textContent = result;
  $resultSection.style.display = "";
});

/* ===== Clear ===== */
$clearBtn.addEventListener("click", () => {
  $templateText.value = "";
  $variablesText.value = "";
  $resultText.textContent = "";
  $resultSection.style.display = "none";
  $varListSection.style.display = "none";
});

/* ===== Copy ===== */
$copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($resultText.textContent);
    $copyBtn.textContent = "✅ コピー済";
    setTimeout(() => ($copyBtn.textContent = "📋 コピー"), 1500);
  } catch {
    // fallback
    const range = document.createRange();
    range.selectNodeContents($resultText);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
  }
});

/* ===== Auto-detect on template input ===== */
$templateText.addEventListener("input", () => {
  const placeholders = detectPlaceholders($templateText.value);
  const vars = parseVariables($variablesText.value);
  showVarTags(placeholders, vars);
});