import dataMots from './data/mots_riches.json';
import fusionThemes from './data/fusion_themes.json';
import fauxPhrases from './data/phrases_faux.json';
import trouPhrases from './data/phrases_trou.json';
import config from './data/config_global.json';
import embeddings from './data/embeddings_local.json';

const app = document.getElementById('app');
const menuButtons = document.querySelectorAll('#menu button');

menuButtons.forEach(btn => {
  btn.addEventListener('click', () => loadMode(btn.dataset.mode));
});

function loadMode(mode) {
  app.innerHTML = '';
  switch(mode) {
    case '1': return renderMode1();
    case '2': return renderMode2();
    case '3': return renderMode3();
    case '4': return renderMode4();
    case '5': return renderMode5();
    default: app.innerHTML = '<p>Sélectionne un mode</p>';
  }
}

function createLogArea(id) {
  const log = document.createElement('pre');
  log.id = id;
  log.className = 'mt-2 p-2 bg-gray-100 h-40 overflow-auto font-mono';
  return log;
}

/* Mode 1: Cristal Cache */
function renderMode1() {
  const target = pick(dataMots);
  let tries=0, bestScore=-1;
  const container = document.createElement('div');
  container.innerHTML = \`
    <h2 class="text-2xl font-semibold mb-4">Cristal Cache</h2>
    <input id="guess1" class="border p-2 w-full" placeholder="Tape un mot..." />
    <button id="submit1" class="mt-2 px-3 py-1 bg-teal-500 text-white">Valider</button>
  \`;
  app.appendChild(container);
  const log = createLogArea('log1'); app.appendChild(log);
  document.getElementById('submit1').onclick = () => {
    const g = sanitize('guess1');
    if(!validWord(g)) return alert('Orthographe invalide');
    tries++;
    const score = calcScore(g,target);
    bestScore = Math.max(bestScore, score);
    log.innerText += \`\n🔹 \${g} → \${getTemp(score)} (\${score}°)\`;
    if(g===target) log.innerText += \`\n🎯 Bravo ! Trouvé en \${tries}\`;
  };
}

/* Mode 2: Fusion Sémantique */
function renderMode2() {
  const [theme, mots] = pickEntry(fusionThemes);
  let found=0;
  const container = document.createElement('div');
  container.innerHTML = \`
    <h2 class="text-2xl font-semibold mb-4">Fusion : \${theme}</h2>
    <input id="guess2" class="border p-2 w-full" placeholder="Tape un mot..." />
    <button id="submit2" class="mt-2 px-3 py-1 bg-teal-500 text-white">Valider</button>
  \`;
  app.appendChild(container);
  const log = createLogArea('log2'); app.appendChild(log);
  document.getElementById('submit2').onclick = () => {
    const g = sanitize('guess2');
    if(mots.includes(g)) { found++; log.innerText += \`\n✅ \${g}\`; }
    else log.innerText += \`\n❌ \${g}\`;
    if(found>=3) log.innerText += \`\n🎉 Thème complet !\`;
  };
}

/* Mode 3: Faux Vrai */
function renderMode3() {
  const {phrase,intrus,attendu} = pick(fauxPhrases);
  const container = document.createElement('div');
  container.innerHTML = \`
    <h2 class="text-2xl font-semibold mb-4">Faux Vrai</h2>
    <p class="italic mb-4">\${phrase.replace(intrus,'_____')}</p>
    <input id="guess3" class="border p-2 w-full" placeholder="Mot manquant..." />
    <button id="submit3" class="mt-2 px-3 py-1 bg-teal-500 text-white">Valider</button>
  \`;
  app.appendChild(container);
  const log = createLogArea('log3'); app.appendChild(log);
  document.getElementById('submit3').onclick = () => {
    const g = sanitize('guess3');
    if(g===attendu) log.innerText += \`\n🎯 Correct !\`;
    else log.innerText += \`\n❌ \${g}\`;
  };
}

/* Mode 4: Trou de Mémoire */
function renderMode4() {
  const {phrase,reponses} = pick(trouPhrases);
  const container = document.createElement('div');
  container.innerHTML = \`
    <h2 class="text-2xl font-semibold mb-4">Trou de Mémoire</h2>
    <p class="mb-4">\${phrase}</p>
    <input id="guess4" class="border p-2 w-full" placeholder="Tape le mot..." />
    <button id="submit4" class="mt-2 px-3 py-1 bg-teal-500 text-white">Valider</button>
  \`;
  app.appendChild(container);
  const log = createLogArea('log4'); app.appendChild(log);
  document.getElementById('submit4').onclick = () => {
    const g = sanitize('guess4');
    if(reponses.includes(g)) log.innerText += \`\n✅ \${g}\`;
    else log.innerText += \`\n❌ \${g}\`;
  };
}

/* Mode 5: Pendu Sémantique */
function renderMode5() {
  const {phrase,reponses} = pick(trouPhrases);
  let errs=0, maxErr=Math.ceil(phrase.replace(/[^\w]/g,'').length*config.pourcentage_erreur_pendu);
  const container = document.createElement('div');
  container.innerHTML = \`
    <h2 class="text-2xl font-semibold mb-4">Pendu Sémantique</h2>
    <canvas id="pendu" width="200" height="200" class="mb-4"></canvas>
    <input id="guess5" class="border p-2 w-full" placeholder="Lettre ou mot..." />
    <button id="submit5" class="mt-2 px-3 py-1 bg-teal-500 text-white">Valider</button>
  \`;
  app.appendChild(container);
  const log = createLogArea('log5'); app.appendChild(log);
  const ctx = document.getElementById('pendu').getContext('2d'); drawPendu(ctx,0);
  document.getElementById('submit5').onclick = () => {
    const g = sanitize('guess5');
    if(g.length>1) { if(g!==reponses.join(' ')) errs+=2; else log.innerText += \`\n🎯 Phrase trouvée !\`; }
    else if(!reponses.some(w=>w.includes(g))) errs++;
    drawPendu(ctx,errs);
    log.innerText += \`\n❌ Erreurs: \${errs}/\${maxErr}\`;
  };
}

/* Utils and initialization */
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function pickEntry(obj) { const keys=Object.keys(obj); const k=keys[Math.floor(Math.random()*keys.length)]; return [k,obj[k]]; }
function sanitize(id) { return document.getElementById(id).value.trim().toLowerCase(); }
function validWord(w) { return /^[a-zàâçéèêëîïôûùüÿñæœ]{2,24}$/i.test(w); }
function calcScore(g,t) { return embeddings[g]&&embeddings[t] ? Math.floor(cosine(embeddings[g],embeddings[t])*100) : 50; }
function cosine(a,b){let s=0,na=0,nb=0; for(let i=0;i<a.length;i++){s+=a[i]*b[i];na+=a[i]**2;nb+=b[i]**2;} return s/Math.sqrt(na*nb);} 
function getTemp(s){return s>80?'🔥':s>60?'🌶️':s>40?'😐':'❄️';}
function drawPendu(ctx,e){ctx.clearRect(0,0,200,200); const steps=['socle','potence','corde','tete','corps','bras','jambes','ko']; for(let i=0;i<Math.min(e,steps.length);i++){ctx.fillText(steps[i],10,20+20*i);} }

// Init default
loadMode('1');
