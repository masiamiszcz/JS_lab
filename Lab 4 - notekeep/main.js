
function getNotes() {
    const notes = localStorage.getItem('notes');
    return notes ? JSON.parse(notes) : [];
  }
  
  function saveNotes(notes) {
    localStorage.setItem('notes', JSON.stringify(notes));
  }
  
  function displayNotes() {
    const notesContainer = document.querySelector('#notesContainer');

    notesContainer.innerHTML = '';
    
    const notes = getNotes();
    const searchText = document.querySelector('#searchInput').value.toLowerCase();
    const colorFilter = document.querySelector('#colorFilter').value;
    
    notes.sort((a, b) => (b.pin - a.pin));
    
    notes.forEach(note => {
      const noteText = (note.title + ' ' + note.content + ' ' + note.tags).toLowerCase();
      if ((colorFilter && note.color !== colorFilter) || (searchText && !noteText.includes(searchText))) {
        return;
      }
      
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note' + (note.pin ? ' pinned' : '');
      noteDiv.style.setProperty("--note-color", note.color);

      
      
      const titleEl = document.createElement('h1');
      titleEl.textContent = note.title;
      titleEl.style.textTransform = 'uppercase';
      titleEl.style.fontSize = '2em';
      titleEl.style.fontWeight = 'bold';
      
      const dateEl = document.createElement('p');
      dateEl.textContent = new Date(note.creationDate).toLocaleString();
      dateEl.style.color = 'grey';
      dateEl.style.fontStyle = 'italic';
      dateEl.style.fontSize = '0.9em';
      
      const contentEl = document.createElement('p');
      contentEl.textContent = note.content;
      
      const tagsEl = document.createElement('p');
      tagsEl.textContent = note.tags;
      
      // Dodajemy elementy do notatki
      noteDiv.appendChild(titleEl);
      noteDiv.appendChild(dateEl);
      noteDiv.appendChild(contentEl);
      noteDiv.appendChild(tagsEl);
      
      notesContainer.appendChild(noteDiv);
    });
  }
  

  document.querySelector('#addNoteBtn').addEventListener('click', () => {
    document.querySelector('#noteFormModal').style.display = 'block';
  });
  
  document.querySelector('#cancelBtn').addEventListener('click', () => {
    document.querySelector('#noteFormModal').style.display = 'none';
    document.querySelector('#noteForm').reset();
  });
  
  document.querySelector('#noteForm').addEventListener('submit', e => {
    e.preventDefault();
  
    const title = document.querySelector('#noteTitle').value;
    const content = document.querySelector('#noteContent').value;
    const tags = document.querySelector('#noteTags').value;
    const color = document.querySelector('#noteColor').value;
    const pin = document.querySelector('#notePin').checked;
    const creationDate = new Date().toISOString();
  
    const newNote = { title, content, tags, color, pin, creationDate };
  
    const notes = getNotes();
    notes.push(newNote);
    saveNotes(notes);
  
    displayNotes();
    document.querySelector('#noteForm').reset();
    document.querySelector('#noteFormModal').style.display = 'none';
  });
  

  document.querySelector('#searchInput').addEventListener('input', displayNotes);
  document.querySelector('#colorFilter').addEventListener('change', displayNotes);
  

  displayNotes();
  