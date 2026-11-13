const audio = document.querySelector('#audio');
const play = document.querySelector('#play');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const seek = document.querySelector('#seek');
const list = document.querySelector('#track-list');
const tracks = [];
let current = -1;
const time = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00';
function syncPlay() {
  play.textContent = audio.paused ? '▶︎' : 'Ⅱ';
  play.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
}
async function startPlayback() {
  try { await audio.play(); }
  catch (error) {
    if (error.name === 'AbortError') return;
    document.querySelector('#current-subtitle').textContent = 'Unable to play this file. Try another audio format.';
    syncPlay();
  }
}
function selectTrack(index, autoplay = true) {
  if (!tracks.length) return;
  current = (index + tracks.length) % tracks.length;
  audio.src = tracks[current].url;
  document.querySelector('#current-title').textContent = tracks[current].name;
  document.querySelector('#current-subtitle').textContent = 'LOCAL TRACK / HANATEKK LISTENING ROOM';
  document.querySelector('#elapsed').textContent = '0:00';
  document.querySelector('#duration').textContent = '0:00';
  seek.value = 0;
  seek.disabled = true;
  list.querySelectorAll('button').forEach((button, i) => {
    button.classList.toggle('active', i === current);
    if (i === current) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  [play, previous, next].forEach(button => { button.disabled = false; });
  if (autoplay) startPlayback();
}
document.querySelector('#audio-files').addEventListener('change', event => {
  const files = Array.from(event.target.files).filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|m4a|aac|aiff|opus)$/i.test(file.name));
  if (!files.length) {
    document.querySelector('#import-status').textContent = 'Select an audio file such as MP3, WAV, or OGG.';
    return;
  }
  document.querySelector('#import-status').textContent = '';
  const oldLength = tracks.length;
  for (const file of files) {
    const index = tracks.length;
    const name = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
    tracks.push({ name, url: URL.createObjectURL(file) });
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'track';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('strong');
    title.textContent = name;
    const icon = document.createElement('span');
    icon.textContent = '↗';
    button.append(number, title, icon);
    button.addEventListener('click', () => selectTrack(index));
    li.append(button);
    list.append(li);
  }
  document.querySelector('#empty-state').hidden = true;
  document.querySelector('#track-count').textContent = `${String(tracks.length).padStart(2, '0')} TRACK${tracks.length === 1 ? '' : 'S'}`;
  if (oldLength === 0) selectTrack(0, false);
  event.target.value = '';
});
play.addEventListener('click', () => audio.paused ? startPlayback() : audio.pause());
previous.addEventListener('click', () => selectTrack(current - 1));
next.addEventListener('click', () => selectTrack(current + 1));
audio.addEventListener('play', syncPlay);
audio.addEventListener('pause', syncPlay);
audio.addEventListener('ended', () => selectTrack(current + 1));
audio.addEventListener('error', () => { document.querySelector('#current-subtitle').textContent = 'This audio format could not be loaded. Try another file.'; });
audio.addEventListener('loadedmetadata', () => {
  document.querySelector('#duration').textContent = time(audio.duration);
  seek.disabled = !Number.isFinite(audio.duration) || audio.duration <= 0;
});
audio.addEventListener('timeupdate', () => {
  document.querySelector('#elapsed').textContent = time(audio.currentTime);
  seek.value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration * 100 : 0;
});
seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 100 * audio.duration; });
audio.volume = 0.8;
document.querySelector('#volume').addEventListener('input', event => { audio.volume = Number(event.target.value); });
