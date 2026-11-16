// 로그인 화면 연출: 타이프라이터 문구와 타이핑하는 고양이

(function() {
  const steps = [
    { action: 'type', text: '\u201c당신이 써 내려갈 이야기\u201d', delay: 90 },
    { action: 'pause', delay: 600 },
    { action: 'delete', count: 15, delay: 50 },
    { action: 'pause', delay: 300 },
    { action: 'type', text: '\u201c당신이 써 내려갈 이야기\u201d', delay: 90 },
  ];
  const el = document.getElementById('tagline-text');
  let current = '';
  let stepIdx = 0;
  function run() {
    if (stepIdx >= steps.length) return;
    const s = steps[stepIdx];
    if (s.action === 'pause') {
      stepIdx++;
      setTimeout(run, s.delay);
    } else if (s.action === 'type') {
      let i = 0;
      const iv = setInterval(() => {
        current += s.text[i];
        el.textContent = current;
        i++;
        if (i >= s.text.length) { clearInterval(iv); stepIdx++; run(); }
      }, s.delay);
    } else if (s.action === 'delete') {
      let c = 0;
      const iv = setInterval(() => {
        current = current.slice(0, -1);
        el.textContent = current;
        c++;
        if (c >= s.count) { clearInterval(iv); stepIdx++; run(); }
      }, s.delay);
    }
  }
  setTimeout(run, 500);
})();

(function() {
  const catImg = document.getElementById('login-cat-img');
  let frame = 2;
  let pressing = 0;
  let inputIdleTimer = null;

  function onDown() {
    pressing++;
    catImg.src = frame + '.png';
    frame = frame === 2 ? 3 : 2;
  }

  function onUp() {
    pressing = Math.max(0, pressing - 1);
    if (pressing === 0) catImg.src = '1.png';
  }

  function onInput(e) {
    const t = e.target;
    const isTextField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    if (!isTextField) return;

    catImg.src = frame + '.png';
    frame = frame === 2 ? 3 : 2;

    clearTimeout(inputIdleTimer);
    inputIdleTimer = setTimeout(function() {
      if (pressing === 0) catImg.src = '1.png';
    }, 140);
  }

  document.addEventListener('keydown', function(e) { if (!e.repeat) onDown(); });
  document.addEventListener('keyup', onUp);
  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  document.addEventListener('input', onInput);
})();
