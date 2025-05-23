let dataMots, fusionThemes, fauxPhrases, trouPhrases, config, embeddings;

async function loadData() {
  [dataMots, fusionThemes, fauxPhrases, trouPhrases, config, embeddings] = await Promise.all([
    fetch('data/mots_riches.json').then(r => r.json()),
    fetch('data/fusion_themes.json').then(r => r.json()),
    fetch('data/phrases_faux.json').then(r => r.json()),
    fetch('data/phrases_trou.json').then(r => r.json()),
    fetch('data/config_global.json').then(r => r.json()),
    fetch('data/embeddings_local.json').then(r => r.json())
  ]);
  setupMenu();
}

function setupMenu() {
  const menuButtons = document.querySelectorAll('#menu button');
  menuButtons.forEach(btn => btn.addEventListener('click', () => loadMode(btn.dataset.mode)));
  loadMode('1');
}

function loadMode(mode) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  switch(mode) {
    case '1': renderMode1(); break;
    case '2': renderMode2(); break;
    case '3': renderMode3(); break;
    case '4': renderMode4(); break;
    case '5': renderMode5(); break;
    default: app.innerHTML = '<p>Sélectionne un mode</p>';
  }
}

function createLogArea(id) {
  const log = document.createElement('pre');
  log.id = id;
  log.className = 'mt-2 p-2 bg-gray-100 h-40 overflow-auto font-mono';
  return log;
}

// 🧩 Utilitaires
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickEntry(obj) {
  const keys = Object.keys(obj);
  const k = pick(keys);
  return [k, obj[k]];
}
function sanitize(id) { return document.getElementById(id).value.trim().toLowerCase(); }
function validWord(w) { return /^[a-zàâçéèêëîïôûùüÿñæœ]{2,24}$/i.test(w); }
function cosine(a,b) {
  let s = 0, na = 0, nb = 0;
  for(let i=0; i<a.length; i++){
    s += a[i]*b[i];
    na += a[i]**2;
    nb += b[i]**2;
  }
  return s / Math.sqrt(na*nb);
}
function calcScore(g, t) {
  return embeddings[g] && embeddings[t]
    ? Math.floor(cosine(embeddings[g], embeddings[t]) * 100)
    : 50;
}
function getTemp(s) {
  return s>80 ? '🔥'
       : s>60 ? '🌶️'
       : s>40 ? '😐'
       : '❄️';
}
function drawPendu(ctx, e) {
  ctx.clearRect(0,0,200,200);
  const steps = ['socle','potence','corde','tete','corps','bras','jambes','ko'];
  for(let i=0; i<Math.min(e, steps.length); i++){
    ctx.fillText(steps[i], 10, 20 + 20*i);
  }
}

// — Mode 1 : Cristal Cache —
function renderMode1() {
  const target = pick(dataMots);
  let tries = 0;
  const container = document.createElement('div');
  container.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">Cristal Cache</h2>
    <input id="guess1" class="border p-2 w-full" placeholder="Tape un mot..." />
    <button id="submit1" class="mt-2 px-3 py-1 bg-teal-500 text-white">Valider</button>
  `;
  document.getElementById('app').appendChild(container);
  const log = createLogArea('log1');
  document.getElementById('app').appendChild(log);

  document.getElementById('submit1').onclick = () => {
    const g = sanitize('guess1');
    if(!validWord(g)) return alert('Orthographe invalide');
    tries++;
    const score = calcScore(g, target);
    log.innerText += `\n🔹 ${g} → ${getTemp(score)} (${score}°)`;
    if(g === target) {
      log.innerText += `\n🎯 Bravo ! Trouvé en ${tries} tentatives.`;
    }
  };
}

// → Reste des modes (2 à 5), structure similaire à renderMode1…

// Démarrage
loadData();
