// main.js

// Inicjalizacja AudioContext i buforów dźwiękowych
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const buffers = {};
const soundFiles = {
    'kick': 'sounds/kick.wav',
    'boom': 'sounds/boom.wav',
    'clap': 'sounds/clap.wav',
    'hihat': 'sounds/hihat.wav',
    'openhat': 'sounds/openhat.wav',
    'ride': 'sounds/ride.wav',
    'snare': 'sounds/snare.wav',
    'tink': 'sounds/tink.wav',
    'tom': 'sounds/tom.wav'
};

// Mapowanie klawiszy do nazw dźwięków
const keyMap = {
    'A': 'kick',
    'S': 'boom',
    'D': 'clap',
    'F': 'hihat',
    'G': 'openhat',
    'H': 'ride',
    'J': 'snare',
    'K': 'tink',
    'L': 'tom'
};

// Zmienne globalne
let channels = [];                    // Tablica kanałów
let currentRecordChannel = null;      // Kanał, który jest obecnie nagrywany
let metronomeInterval = null;         // ID interwału metronomu
let channelIdCounter = 0;             // Do generowania unikalnych ID kanałów
let loopAllEnabled = false;           // Flaga dla "Odtwórz wszystko" (loop globalny)

// Ładowanie wszystkich próbek do buforów
async function loadSounds() {
    const names = Object.keys(soundFiles);
    for (const name of names) {
        const url = soundFiles[name];
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            buffers[name] = audioBuffer;
        } catch (err) {
            console.error(`Błąd wczytywania dźwięku "${name}":`, err);
        }
    }
}

// Odtwarza pojedynczy dźwięk z bufora
function playSound(name) {
    if (!buffers[name]) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffers[name];
    source.connect(audioCtx.destination);
    source.start();
}

// Obsługa naciśnięcia klawisza (odtwarzanie i nagrywanie)
function handleKey(key) {
    const sound = keyMap[key.toUpperCase()];
    if (sound) {
        playSound(sound);

        // Jeśli trwa nagrywanie, zapisz wydarzenie w bieżącym kanale
        if (currentRecordChannel !== null) {
            const ch = currentRecordChannel;
            const eventTime = audioCtx.currentTime - ch.recordStartTime;
            if (eventTime <= ch.length) {
                ch.events.push({ time: eventTime, sound: sound });
            }
        }
    }
}

// Dodaje nowy kanał do tablicy i renderuje UI
function addChannel() {
    const chId = channelIdCounter++;
    const channel = {
        id: chId,
        bpm: 120,
        bars: 1,
        length: 4 * (60 / 120), // 4 (beatów) * (60/BPM)
        events: [],             // Tablica obiektów { time, sound }
        isRecording: false,
        isPlaying: false,
        playTimeout: null,
        recTimeout: null
    };
    channels.push(channel);
    renderChannels();
}

// Rozpoczyna nagrywanie na kanale ch
function startRecord(ch) {
    // Jeśli inny kanał nagrywa, zatrzymaj go najpierw
    if (currentRecordChannel !== null) {
        stopRecord(currentRecordChannel);
    }
    // Czyścimy poprzednie nagranie i ustawiamy start czasu
    ch.events = [];
    ch.recordStartTime = audioCtx.currentTime;
    ch.isRecording = true;
    currentRecordChannel = ch;
    document.getElementById(`rec-${ch.id}`).disabled = true;
    document.getElementById(`stop-${ch.id}`).disabled = false;

    // Po upływie długości pętli automatycznie zatrzymaj nagrywanie
    ch.recTimeout = setTimeout(() => {
        if (ch.isRecording) {
            stopRecord(ch);
        }
    }, ch.length * 1000);
}

// Zatrzymuje nagrywanie na kanale ch
function stopRecord(ch) {
    if (!ch.isRecording) return;
    ch.isRecording = false;
    clearTimeout(ch.recTimeout);
    currentRecordChannel = null;
    document.getElementById(`rec-${ch.id}`).disabled = false;
    document.getElementById(`stop-${ch.id}`).disabled = true;
}

// Odtwarza pętlę zapisaną w kanale ch, z opcjonalnym parametrem startAt (timestamp)
function playChannel(ch, startAt = audioCtx.currentTime) {
    if (ch.events.length === 0) return;
    ch.isPlaying = true;

    // Odtwarzamy wszystkie zdarzenia zapisane w zdarzeniach kanału
    ch.events.forEach(ev => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[ev.sound];
        source.connect(audioCtx.destination);
        source.start(startAt + ev.time);
    });

    // Zaplanuj kolejne odtworzenie pętli po zakończeniu obecnej
    ch.playTimeout = setTimeout(() => {
        if (ch.isPlaying) {
            playChannel(ch, audioCtx.currentTime + 0.1);
        }
    }, ch.length * 1000);
}

// Zatrzymuje pętlę kanału ch
function stopChannel(ch) {
    ch.isPlaying = false;
    clearTimeout(ch.playTimeout);
}

// Usuwa kanał ch z listy i przerywa jego nagrywanie/odtwarzanie
function deleteChannel(ch) {
    if (ch.isRecording) stopRecord(ch);
    if (ch.isPlaying) stopChannel(ch);
    channels = channels.filter(c => c.id !== ch.id);
    renderChannels();
}

// ─── FUNKCJE DLA „ODTWÓRZ WSZYSTKIE” ─────────────────────────────────────────────

// Pomocnicza funkcja do zaplanowania pętli kanału ch w punkcie startTime
function scheduleLoop(ch, startTime) {
    // Utwórz źródła dla wszystkich zdarzeń w kanale, planując start w startTime + ev.time
    ch.events.forEach(ev => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[ev.sound];
        source.connect(audioCtx.destination);
        source.start(startTime + ev.time);
    });

    // Jeśli nadal mamy zaznaczoną pętlę globalną i kanał jest zapisany jako odtwarzany
    if (loopAllEnabled && ch.events.length > 0) {
        ch.playTimeout = setTimeout(() => {
            if (loopAllEnabled) {
                // Zaplanuj kolejną iterację pętli
                scheduleLoop(ch, audioCtx.currentTime + 0.1);
            }
        }, ch.length * 1000);
    }
}

// Funkcja wywoływana po kliknięciu przycisku „Odtwórz wszystko”
function playAllChannels() {
    // Jeżeli globalny loop jeszcze nie jest włączony, włączamy
    if (!loopAllEnabled) {
        loopAllEnabled = true;
        const startTime = audioCtx.currentTime + 0.2; // buffer czasowy 200ms
        channels.forEach(ch => {
            if (ch.events.length > 0) {
                ch.isPlaying = true;
                scheduleLoop(ch, startTime);
            }
        });
        document.getElementById('play-all').textContent = '⏹️ Zatrzymaj wszystko';
    } else {
        // Wyłączamy globalny loop – bieżące pętle dolecą do końca, ale nie zaplanujemy kolejnych
        loopAllEnabled = false;
        channels.forEach(ch => { ch.isPlaying = false; });
        document.getElementById('play-all').textContent = '▶️ Odtwórz wszystko';
    }
}

// ─── GENEROWANIE UI DLA KANAŁÓW ────────────────────────────────────────────────

// Renderuje sekcje wszystkich kanałów w HTML
function renderChannels() {
    const container = document.getElementById('channels');
    container.innerHTML = ''; // Wyczyść istniejące

    channels.forEach((ch, index) => {
        // Tworzymy div dla danego kanału
        const div = document.createElement('div');
        div.className = 'channel';
        div.id = `channel-${ch.id}`;

        // Nagłówek: numer kanału
        const title = document.createElement('h3');
        title.textContent = `Kanał ${index + 1}`;
        div.appendChild(title);

        // Input BPM
        const bpmLabel = document.createElement('label');
        bpmLabel.textContent = 'BPM:';
        const bpmInput = document.createElement('input');
        bpmInput.type = 'number';
        bpmInput.id = `bpm-${ch.id}`;
        bpmInput.value = ch.bpm;
        bpmInput.min = 1;
        bpmInput.addEventListener('change', () => {
            ch.bpm = parseInt(bpmInput.value) || 1;
            ch.length = ch.bars * 4 * (60 / ch.bpm);
        });
        div.appendChild(bpmLabel);
        div.appendChild(bpmInput);

        // Input taktów (bars)
        const barsLabel = document.createElement('label');
        barsLabel.textContent = ' Taktów:';
        const barsInput = document.createElement('input');
        barsInput.type = 'number';
        barsInput.id = `bars-${ch.id}`;
        barsInput.value = ch.bars;
        barsInput.min = 1;
        barsInput.addEventListener('change', () => {
            ch.bars = parseInt(barsInput.value) || 1;
            ch.length = ch.bars * 4 * (60 / ch.bpm);
        });
        div.appendChild(barsLabel);
        div.appendChild(barsInput);

        // Przycisk Nagrywaj
        const recBtn = document.createElement('button');
        recBtn.id = `rec-${ch.id}`;
        recBtn.textContent = 'Nagrywaj';
        recBtn.addEventListener('click', () => startRecord(ch));
        div.appendChild(recBtn);

        // Przycisk Stop (nagrywania)
        const stopBtn = document.createElement('button');
        stopBtn.id = `stop-${ch.id}`;
        stopBtn.textContent = 'Stop';
        stopBtn.disabled = true;
        stopBtn.addEventListener('click', () => stopRecord(ch));
        div.appendChild(stopBtn);

        // Przycisk Odtwarzaj/Zatrzymaj dla pojedynczego kanału
        const playBtn = document.createElement('button');
        playBtn.id = `play-${ch.id}`;
        playBtn.textContent = 'Odtwarzaj';
        playBtn.addEventListener('click', () => {
            if (ch.isPlaying) {
                stopChannel(ch);
                playBtn.textContent = 'Odtwarzaj';
            } else {
                playChannel(ch);
                playBtn.textContent = 'Zatrzymaj';
            }
        });
        div.appendChild(playBtn);

        // Przycisk Usuń kanał
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Usuń kanał';
        delBtn.addEventListener('click', () => deleteChannel(ch));
        div.appendChild(delBtn);

        container.appendChild(div);
    });
}

// ─── METRONOM ────────────────────────────────────────────────────────────────

// Uruchamia metronom dźwiękowy „tink” z ustawionym BPM
function startMetronome() {
    const bpmVal = parseInt(document.getElementById('metronome-bpm').value) || 120;
    if (metronomeInterval) clearInterval(metronomeInterval);
    metronomeInterval = setInterval(() => playSound('tink'), (60 / bpmVal) * 1000);
}

// Zatrzymuje metronom
function stopMetronome() {
    if (metronomeInterval) clearInterval(metronomeInterval);
}

// ─── INICJALIZACJA PO ZAŁADOWANIU STRONY ────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
    loadSounds();

    // Dodaj kanał
    document.getElementById('add-channel').addEventListener('click', addChannel);

    // Przycisk „Odtwórz wszystko”
    document.getElementById('play-all').addEventListener('click', playAllChannels);

    // Toggle metronomu
    document.getElementById('metronome-toggle').addEventListener('change', (e) => {
        if (e.target.checked) startMetronome();
        else stopMetronome();
    });

    // React na zmianę BPM metronomu
    document.getElementById('metronome-bpm').addEventListener('change', () => {
        if (document.getElementById('metronome-toggle').checked) {
            startMetronome();
        }
    });

    // Obsługa klawiatury (A–L)
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName.toLowerCase() === 'input') return;
        handleKey(e.key);
    });

    // Obsługa klikania w wirtualne pady (jeśli są w HTML)
    document.querySelectorAll('.key').forEach(keyDiv => {
        keyDiv.addEventListener('mousedown', () => {
            const key = keyDiv.dataset.key;
            handleKey(key);
        });
    });
});
