const links = document.querySelectorAll('a[href^="#"]');

links.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const tabs = document.querySelectorAll('.viz-tab');
const panels = document.querySelectorAll('.viz-panel');

const setActiveTab = (target) => {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.target === target;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  panels.forEach((panel) => {
    const isActive = panel.id === `viz-${target}`;
    panel.classList.toggle('active', isActive);
    panel.toggleAttribute('hidden', !isActive);
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setActiveTab(tab.dataset.target);
  });
});

const audioItems = document.querySelectorAll('.audio-item');
const players = [];

const ensureAudio = (item, src) => {
  let audio = item.querySelector('audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.className = 'audio-native';
    audio.preload = 'metadata';
    item.appendChild(audio);
  }
  audio.src = src;
  return audio;
};

audioItems.forEach((item) => {
  const src = item.dataset.src;
  const waveContainer = item.querySelector('.waveform');
  const playBtn = item.querySelector('.audio-play');

  if (!src || !waveContainer || !playBtn) {
    return;
  }

  const audioEl = ensureAudio(item, src);
  let ws = null;

  playBtn.disabled = true;
  playBtn.textContent = 'Loading...';

  if (window.WaveSurfer) {
    ws = WaveSurfer.create({
      container: waveContainer,
      media: audioEl,
      waveColor: '#c9c9c9',
      progressColor: '#0b57d0',
      cursorColor: '#0b57d0',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 64,
      normalize: true,
    });
    ws.on('ready', () => {
      playBtn.disabled = false;
      playBtn.textContent = 'Play';
    });
    ws.on('error', () => {
      playBtn.disabled = true;
      playBtn.textContent = 'Load failed';
    });
  } else {
    audioEl.addEventListener('canplay', () => {
      playBtn.disabled = false;
      playBtn.textContent = 'Play';
    }, { once: true });
    audioEl.addEventListener('error', () => {
      playBtn.disabled = true;
      playBtn.textContent = 'Load failed';
    }, { once: true });
  }

  const pauseItem = (player) => {
    if (player.ws) {
      player.ws.pause();
    } else {
      player.audio.pause();
    }
    player.playBtn.classList.remove('is-playing');
    player.playBtn.textContent = 'Play';
  };

  playBtn.addEventListener('click', () => {
    players.forEach((player) => {
      if (player.playBtn !== playBtn) {
        pauseItem(player);
      }
    });

    if (ws) {
      ws.playPause();
    } else if (audioEl.paused) {
      audioEl.play();
    } else {
      audioEl.pause();
    }
  });

  if (ws) {
    ws.on('play', () => {
      playBtn.classList.add('is-playing');
      playBtn.textContent = 'Pause';
    });

    ws.on('pause', () => {
      playBtn.classList.remove('is-playing');
      playBtn.textContent = 'Play';
    });

    ws.on('finish', () => {
      playBtn.classList.remove('is-playing');
      playBtn.textContent = 'Play';
      ws.seekTo(0);
    });
  } else {
    audioEl.addEventListener('play', () => {
      playBtn.classList.add('is-playing');
      playBtn.textContent = 'Pause';
    });
    audioEl.addEventListener('pause', () => {
      playBtn.classList.remove('is-playing');
      playBtn.textContent = 'Play';
    });
    audioEl.addEventListener('ended', () => {
      playBtn.classList.remove('is-playing');
      playBtn.textContent = 'Play';
      audioEl.currentTime = 0;
    });
  }

  players.push({ ws, audio: audioEl, playBtn });
});
