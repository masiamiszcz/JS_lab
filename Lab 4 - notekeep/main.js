// main.js
document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const tytulInput = document.getElementById('tytul');
    const trescInput = document.getElementById('tresc');
    const tagiInput = document.getElementById('tagi');
    const kolorInput = document.getElementById('kolor');
    const przypomnienieInput = document.getElementById('przypomnienie');
    const przypietaInput = document.getElementById('przypieta');
    const addTaskBtn = document.getElementById('add-task');
    const tasksList = document.getElementById('tasks-list');
    const zapiszBtn = document.getElementById('zapisz-notatke');
    const notesContainer = document.getElementById('notes-container');
    const searchInput = document.getElementById('search');
    const tagFilterInput = document.getElementById('tag-filter');

    let notatki = [];
    let editingId = null;

    // Load notes from localStorage
    if (localStorage.getItem('notatki')) {
        notatki = JSON.parse(localStorage.getItem('notatki'));
    }

    // Function to save notes to localStorage
    function saveNotes() {
        localStorage.setItem('notatki', JSON.stringify(notatki));
    }

    // Generate unique ID
    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add a task input field
    addTaskBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-input';
        input.placeholder = 'Zadanie';
        tasksList.appendChild(input);
    });

    // Render notes to the page
    function renderNotes() {
        notesContainer.innerHTML = '';
        const searchValue = searchInput.value.toLowerCase();
        const tagFilterValue = tagFilterInput.value.toLowerCase();

        // Sort notes: pinned first
        const sortedNotatki = notatki.slice().sort((a, b) => (b.przypieta ? 1 : 0) - (a.przypieta ? 1 : 0));

        sortedNotatki.forEach(note => {
            // Filter by tag if provided
            if (tagFilterValue) {
                const tagsStr = note.tagi ? note.tagi.join(' ').toLowerCase() : '';
                if (!tagsStr.includes(tagFilterValue)) {
                    return;
                }
            }
            // Filter by search query
            if (searchValue) {
                const valuesToSearch = [
                    note.tytul.toLowerCase(),
                    note.tresc.toLowerCase(),
                    (note.tagi || []).join(' ').toLowerCase(),
                    note.kolor.toLowerCase(),
                    note.przypieta ? 'tak' : 'nie'
                ];
                const found = valuesToSearch.some(val => val.includes(searchValue));
                if (!found) return;
            }

            // Create note card
            const card = document.createElement('div');
            card.className = 'note-card';
            card.style.background = note.kolor || '#fff';

            // Pin icon
            const pinIcon = document.createElement('div');
            pinIcon.className = 'pin';
            pinIcon.textContent = note.przypieta ? '📌' : '📍';
            pinIcon.addEventListener('click', () => {
                note.przypieta = !note.przypieta;
                saveNotes();
                renderNotes();
            });
            card.appendChild(pinIcon);

            // Title
            const titleEl = document.createElement('div');
            titleEl.className = 'title';
            titleEl.textContent = note.tytul;
            card.appendChild(titleEl);

            // Tasks list
            if (note.zadania && note.zadania.length) {
                const ul = document.createElement('ul');
                ul.className = 'tasks';
                note.zadania.forEach(task => {
                    const li = document.createElement('li');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = task.done;
                    const span = document.createElement('span');
                    span.textContent = task.text;
                    if (task.done) {
                        span.style.textDecoration = 'line-through';
                    }
                    checkbox.addEventListener('change', function() {
                        task.done = checkbox.checked;
                        if (task.done) span.style.textDecoration = 'line-through';
                        else span.style.textDecoration = 'none';
                        saveNotes();
                    });
                    li.appendChild(checkbox);
                    li.appendChild(span);
                    ul.appendChild(li);
                });
                card.appendChild(ul);
            }

            // Content
            const contentEl = document.createElement('div');
            contentEl.className = 'content';
            contentEl.textContent = note.tresc;
            card.appendChild(contentEl);

            // Tags display
            if (note.tagi && note.tagi.length) {
                const tagsEl = document.createElement('div');
                tagsEl.className = 'tags';
                tagsEl.textContent = 'Tagi: ' + note.tagi.join(', ');
                card.appendChild(tagsEl);
            }

            // Reminder display
            if (note.przypomnienie) {
                const remDate = new Date(note.przypomnienie);
                const remEl = document.createElement('div');
                remEl.className = 'reminder';
                remEl.textContent = '⏰ ' + remDate.toLocaleString();
                card.appendChild(remEl);
            }

            // Action buttons (Edit, Delete)
            const actions = document.createElement('div');
            actions.className = 'actions';
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edytuj';
            editBtn.addEventListener('click', () => {
                loadNoteIntoForm(note.id);
            });
            actions.appendChild(editBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Usuń';
            deleteBtn.addEventListener('click', () => {
                notatki = notatki.filter(n => n.id !== note.id);
                saveNotes();
                renderNotes();
            });
            actions.appendChild(deleteBtn);
            card.appendChild(actions);

            notesContainer.appendChild(card);
        });
    }

    // Load note data into form for editing
    function loadNoteIntoForm(id) {
        const note = notatki.find(n => n.id === id);
        if (!note) return;
        editingId = id;
        tytulInput.value = note.tytul;
        trescInput.value = note.tresc;
        tagiInput.value = note.tagi ? note.tagi.join(',') : '';
        kolorInput.value = note.kolor;
        przypomnienieInput.value = note.przypomnienie ? note.przypomnienie.slice(0, 16) : '';
        przypietaInput.checked = note.przypieta;
        // Populate tasks in form
        tasksList.innerHTML = '';
        if (note.zadania) {
            note.zadania.forEach(task => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'task-input';
                input.value = task.text;
                tasksList.appendChild(input);
            });
        }
    }

    // Save or update note
    zapiszBtn.addEventListener('click', () => {
        const tytul = tytulInput.value.trim();
        const tresc = trescInput.value.trim();
        if (!tytul && !tresc) {
            alert('Podaj tytuł lub treść notatki.');
            return;
        }
        const tagi = tagiInput.value.split(',').map(t => t.trim()).filter(t => t);
        const kolor = kolorInput.value;
        const przypieta = przypietaInput.checked;
        const przypomnienie = przypomnienieInput.value ? new Date(przypomnienieInput.value).toISOString() : null;
        const zadaniaInputs = tasksList.querySelectorAll('.task-input');
        const zadania = [];
        zadaniaInputs.forEach(input => {
            const text = input.value.trim();
            if (text) {
                zadania.push({ text: text, done: false });
            }
        });

        if (editingId) {
            const note = notatki.find(n => n.id === editingId);
            note.tytul = tytul;
            note.tresc = tresc;
            note.tagi = tagi;
            note.kolor = kolor;
            note.przypomnienie = przypomnienie;
            note.przypieta = przypieta;
            note.zadania = zadania;
            editingId = null;
        } else {
            const note = {
                id: generateId(),
                tytul: tytul,
                tresc: tresc,
                tagi: tagi,
                kolor: kolor,
                przypieta: przypieta,
                dataUtworzenia: new Date().toISOString(),
                przypomnienie: przypomnienie,
                przypomnienieWyswietlone: false,
                zadania: zadania
            };
            notatki.push(note);
        }

        // Reset form fields
        tytulInput.value = '';
        trescInput.value = '';
        tagiInput.value = '';
        kolorInput.value = '#ffffff';
        przypomnienieInput.value = '';
        przypietaInput.checked = false;
        tasksList.innerHTML = '';

        saveNotes();
        renderNotes();
    });

    // Search and tag filter
    searchInput.addEventListener('input', renderNotes);
    tagFilterInput.addEventListener('input', renderNotes);

    // Check reminders
    function checkReminders() {
        const now = new Date();
        notatki.forEach(note => {
            if (note.przypomnienie && !note.przypomnienieWyswietlone) {
                const remDate = new Date(note.przypomnienie);
                if (now >= remDate) {
                    alert('Przypomnienie dla notatki: ' + note.tytul);
                    note.przypomnienieWyswietlone = true;
                    saveNotes();
                }
            }
        });
    }
    setInterval(checkReminders, 60000);
    checkReminders();
    renderNotes();
});
