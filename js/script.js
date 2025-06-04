let participants = [];
let spokenOrder = [];

function loadSpokenOrder() {
  const stored = localStorage.getItem('spokenOrder');
  if (stored) {
    try {
      spokenOrder = JSON.parse(stored);
    } catch {
      spokenOrder = [];
    }
  }
}

function saveSpokenOrder() {
  localStorage.setItem('spokenOrder', JSON.stringify(spokenOrder));
}

function updateParticipantCount() {
  const list = document.getElementById('participants').value
    .split('\n').map(n => n.trim()).filter(n => n !== '');
  participants = list;
  document.getElementById('participantCount').textContent = '目前參與者 ' + participants.length + ' 人';
}

// 只顯示最後六名，若人數不足則全部顯示
function renderSpokenList(limit = 6) {
  const ul = document.getElementById('spokenList');
  ul.innerHTML = '';
  const startIdx = Math.max(0, spokenOrder.length - limit);
  spokenOrder.slice(startIdx).forEach((name, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = (startIdx + idx + 1) + '. ' + name;
    ul.appendChild(li);
  });
  // 自動滾動到最新發言人
  ul.scrollTop = ul.scrollHeight;
}

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

async function selectSpeaker() {
  const btn = document.getElementById('drawBtn');
  btn.disabled = true;
  btn.textContent = '抽取中…';

  if (participants.length === 0) {
    alert('所有人已發言完畢或請先輸入參與者');
    btn.disabled = false;
    btn.textContent = '抽取發言者';
    return;
  }
  await showCountdownAnimation();

  const idx = Math.floor(Math.random() * participants.length);
  const chosen = participants.splice(idx, 1)[0];
  document.getElementById('participants').value = participants.join('\n');
  updateParticipantCount();

  const wrapper = document.getElementById('currentSpeakerWrapper');
  // 動畫結束立即顯示發言人與新提示文字
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

  spokenOrder.push(chosen);
  saveSpokenOrder();
  renderSpokenList();

  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = '抽取發言者';
  }, 2000);
}

function resetAll() {
  if (confirm('確定要重置所有資料？')) {
    participants = [];
    spokenOrder = [];
    document.getElementById('participants').value = '';
    document.getElementById('currentSpeakerWrapper').innerHTML = '';
    updateParticipantCount();
    localStorage.removeItem('spokenOrder');
    renderSpokenList();
    resetToast.show();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSpokenOrder();
  renderSpokenList();
  updateParticipantCount();

  document.getElementById('participants').addEventListener('input', updateParticipantCount);
  document.getElementById('drawBtn').addEventListener('click', selectSpeaker);
  document.getElementById('resetBtn').addEventListener('click', resetAll);

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
