
let rounds = []; // 全部輪次資料
let currentRoundIdx = -1; // 當前輪次索引

function getNowTs() {
  const d = new Date();
  return d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0');
}
function nowISO() {
  return new Date().toISOString();
}

function saveRounds() {
  localStorage.setItem('rounds', JSON.stringify(rounds));
}

function loadRounds() {
  const stored = localStorage.getItem('rounds');
  if (stored) {
    try {
      rounds = JSON.parse(stored);
      if (!Array.isArray(rounds)) rounds = [];
    } catch {
      rounds = [];
    }
  }
}

// 新增一輪
function newRound() {
  const input = document.getElementById('participants').value
    .split('\n').map(n => n.trim()).filter(n => n !== '');
  if (input.length === 0) {
    alert('請先輸入完整參與者清單');
    return;
  }
  const newOne = {
    roundId: getNowTs(),
    createdAt: nowISO(),
    participantsInit: [...input],
    participantsCurrent: [...input],
    spokenOrder: [],
    note: ''
  };
  rounds.push(newOne);
  currentRoundIdx = rounds.length - 1;
  saveRounds();
  refreshUI();
}

// 當前輪次快取
function getCurrentRound() {
  if (currentRoundIdx < 0 || currentRoundIdx >= rounds.length) return null;
  return rounds[currentRoundIdx];
}

// 刷新參與者人數顯示
function updateParticipantCount() {
  const r = getCurrentRound();
  if (!r) {
    document.getElementById('participantCount').textContent = '目前參與者 0 人';
    return;
  }
  document.getElementById('participantCount').textContent =
    '目前參與者 ' + r.participantsCurrent.length + ' 人';
  document.getElementById('participants').value = r.participantsCurrent.join('\n');
}

// 渲染已發言順序（最多6名）
function renderSpokenList(limit = 6) {
  const ul = document.getElementById('spokenList');
  ul.innerHTML = '';
  const r = getCurrentRound();
  if (!r) return;
  const startIdx = Math.max(0, r.spokenOrder.length - limit);
  r.spokenOrder.slice(startIdx).forEach((name, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = (startIdx + idx + 1) + '. ' + name;
    ul.appendChild(li);
  });
  ul.scrollTop = ul.scrollHeight;
}

// 倒數動畫
async function showCountdownAnimation() {
  return new Promise(async resolve => {
    const overlay = document.getElementById('overlay');
    const container = document.getElementById('countdownContainer');
    container.innerHTML = '';
    overlay.classList.remove('fade-out');
    overlay.classList.add('show');
    for (let c = 3; c > 0; c--) {
      const div = document.createElement('div');
      div.className = 'countdown-number';
      div.textContent = c;
      container.appendChild(div);
      void div.offsetWidth;
      await new Promise(r => setTimeout(r, 1000));
      container.removeChild(div);
    }
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.remove('show', 'fade-out');
      resolve();
    }, 1000);
  });
}

// 抽取發言人
async function selectSpeaker() {
  const btn = document.getElementById('drawBtn');
  btn.disabled = true;
  btn.textContent = '抽取中…';

  const r = getCurrentRound();
  if (!r) {
    alert('請先建立新一輪');
    btn.disabled = false;
    btn.textContent = '抽取發言者';
    return;
  }
  if (r.participantsCurrent.length === 0) {
    alert('所有人已發言完畢');
    btn.disabled = false;
    btn.textContent = '抽取發言者';
    return;
  }
  await showCountdownAnimation();
  const idx = Math.floor(Math.random() * r.participantsCurrent.length);
  const chosen = r.participantsCurrent.splice(idx, 1)[0];
  r.spokenOrder.push(chosen);
  saveRounds();
  updateParticipantCount();

  const wrapper = document.getElementById('currentSpeakerWrapper');
  wrapper.innerHTML = `
    <div class="selected-speaker-wrapper">
      <h2 class="selected-speaker">🎤 ${chosen}</h2>
      <p class="speaker-note">請發言人準備發言</p>
    </div>
  `;
  const speakerElem = document.querySelector('.selected-speaker');
  speakerElem.classList.add('glow-animation');
  speakerElem.addEventListener('animationend', () => {
    speakerElem.classList.remove('glow-animation');
  }, { once: true });

  renderSpokenList();
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = '抽取發言者';
  }, 2000);
}

// 重置目前輪
function resetAll() {
  if (currentRoundIdx < 0) return;
  if (confirm('確定要重置目前這一輪？')) {
    const r = getCurrentRound();
    if (!r) return;
    r.participantsCurrent = [...r.participantsInit];
    r.spokenOrder = [];
    saveRounds();
    updateParticipantCount();
    renderSpokenList();
    document.getElementById('currentSpeakerWrapper').innerHTML = '';
    resetToast.show();
  }
}

// 畫面刷新（切換輪、建立新輪等）
function refreshUI() {
  // 輪次下拉
  const select = document.getElementById('roundSelect');
  select.innerHTML = '';
  rounds.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `第${i+1}輪 (${r.roundId})`;
    select.appendChild(opt);
  });
  if (currentRoundIdx < 0 && rounds.length > 0) currentRoundIdx = rounds.length - 1;
  if (currentRoundIdx >= 0 && select.options.length > 0)
    select.value = currentRoundIdx;

  // 顯示輪次時間
  const meta = document.getElementById('roundMeta');
  if (currentRoundIdx >= 0) {
    const r = getCurrentRound();
    meta.textContent = '建立時間：' + (r.createdAt ? r.createdAt.replace('T',' ').slice(0,19) : '');
  } else {
    meta.textContent = '';
  }

  updateParticipantCount();
  renderSpokenList();
  document.getElementById('currentSpeakerWrapper').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
  loadRounds();
  refreshUI();

  document.getElementById('participants').addEventListener('input', () => {
    const val = document.getElementById('participants').value
      .split('\n').map(n => n.trim()).filter(n => n !== '');
    // 動態同步目前參與者（只針對尚未抽出前才生效）
    const r = getCurrentRound();
    if (r && r.spokenOrder.length === 0) {
      r.participantsInit = [...val];
      r.participantsCurrent = [...val];
      saveRounds();
      updateParticipantCount();
    }
  });
  document.getElementById('drawBtn').addEventListener('click', selectSpeaker);
  document.getElementById('resetBtn').addEventListener('click', resetAll);
  document.getElementById('newRoundBtn').addEventListener('click', newRound);
  document.getElementById('roundSelect').addEventListener('change', e => {
    currentRoundIdx = parseInt(e.target.value);
    refreshUI();
  });

  // 初始化 Toast
  window.resetToast = new bootstrap.Toast(document.getElementById('resetToast'), { delay: 2000 });

  // 初始化 collapse 功能
  const spokenContainer = document.getElementById('spokenContainer');
  new bootstrap.Collapse(spokenContainer, { toggle: false });

  // 綁定收合／展開按鈕
  const toggleBtn = document.getElementById('toggleListBtn');
  toggleBtn.addEventListener('click', () => {
    if (spokenContainer.classList.contains('show')) {
      new bootstrap.Collapse(spokenContainer, { toggle: true });
      toggleBtn.textContent = '展開';
    } else {
      new bootstrap.Collapse(spokenContainer, { toggle: true });
      toggleBtn.textContent = '收起';
    }
  });
});
