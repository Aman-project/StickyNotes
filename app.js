let color = document.getElementById("color");
let createBtn = document.getElementById("createBtn");
let clearBtn = document.getElementById("clearBtn");
let list = document.getElementById("list");

// Popup elements
const confirmationPopup = document.getElementById("confirmationPopup");
const popupMessage = document.getElementById("popupMessage");
const popupConfirmBtn = document.querySelector(".popup-confirm");
const popupCancelBtn = document.querySelector(".popup-cancel");
const popupCloseBtn = document.querySelector(".popup-close");

// For tracking pending actions
let pendingAction = null;
let pendingNoteToDelete = null;

// Keep track of notes for positioning
let noteCount = 0;

// Array to store note data
let notes = [];

// Load notes from localStorage when page loads
document.addEventListener('DOMContentLoaded', loadNotes);

function loadNotes() {
    try {
        // Try to get notes from localStorage
        const savedNotes = localStorage.getItem('notes');
        
        if (savedNotes) {
            // Parse the JSON string back to an array
            notes = JSON.parse(savedNotes);
            
            // If we have saved notes, recreate them in the DOM
            if (notes.length > 0) {
                notes.forEach(noteData => {
                    createNoteFromData(noteData);
                });
                
                // Update noteCount
                noteCount = notes.length;
            }
        }
        
        // Load saved color preference if exists
        const savedColor = localStorage.getItem('preferredColor');
        if (savedColor) {
            color.value = savedColor;
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        // If there's an error, clear localStorage to prevent future issues
        clearNotes(false); // Don't confirm, just clear
    }
}

function createNoteFromData(noteData) {
    // Create new note element
    let newNote = document.createElement("div");
    newNote.classList.add("note");
    newNote.innerHTML = `
        <button class="close" aria-label="Delete note">×</button>
        <textarea placeholder="Write Content..." rows="10" cols="30">${noteData.content || ''}</textarea>
    `;
    
    // Set properties from saved data
    newNote.style.borderColor = noteData.color || color.value;
    newNote.style.position = 'absolute';
    newNote.style.left = noteData.x + "px";
    newNote.style.top = noteData.y + "px";
    newNote.style.zIndex = noteData.zIndex || '1';
    
    // Add data-id attribute for identifying the note
    newNote.dataset.id = noteData.id;
    
    // Add to DOM
    list.appendChild(newNote);
}

function saveNotes() {
    try {
        // Clear the notes array before repopulating
        notes = [];
        
        // Get all notes from the DOM
        const noteElements = document.querySelectorAll('.note');
        
        // Populate the notes array with current note data
        noteElements.forEach((noteEl, index) => {
            const textarea = noteEl.querySelector('textarea');
            const rect = noteEl.getBoundingClientRect();
            
            // Create a unique ID if it doesn't exist
            if (!noteEl.dataset.id) {
                noteEl.dataset.id = Date.now() + '-' + index;
            }
            
            // Create note data object
            const noteData = {
                id: noteEl.dataset.id,
                content: textarea ? textarea.value : '',
                color: noteEl.style.borderColor,
                x: parseInt(noteEl.style.left) || rect.left,
                y: parseInt(noteEl.style.top) || rect.top,
                zIndex: noteEl.style.zIndex || '1'
            };
            
            // Add to notes array
            notes.push(noteData);
        });
        
        // Save to localStorage
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Save color preference
        localStorage.setItem('preferredColor', color.value);
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

function clearNotes(shouldConfirm = true) {
    if (shouldConfirm) {
        // Show confirmation popup for clearing all notes
        popupMessage.textContent = "Are you sure you want to delete all notes?";
        pendingAction = "clearAll";
        showPopup();
        return;
    }
    
    // If no confirmation needed or confirmation was given
    // Remove all notes from the DOM
    list.innerHTML = '';
    
    // Clear the notes array
    notes = [];
    
    // Reset note count
    noteCount = 0;
    
    // Update localStorage
    localStorage.removeItem('notes');
}

function deleteNote(noteElement) {
    // Show confirmation popup for deleting single note
    popupMessage.textContent = "Are you sure you want to delete this note?";
    pendingNoteToDelete = noteElement;
    pendingAction = "deleteOne";
    showPopup();
}

// Popup functions
function showPopup() {
    // Reset focus trap and keyboard handling
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    confirmationPopup.classList.add('active');
    
    // Focus on the first interactive element (close button)
    setTimeout(() => {
        popupCloseBtn.focus();
    }, 50);
}

function hidePopup() {
    confirmationPopup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    pendingAction = null;
    pendingNoteToDelete = null;
}

// Event handlers for popup buttons
popupConfirmBtn.addEventListener('click', () => {
    if (pendingAction === "clearAll") {
        clearNotes(false);
    } else if (pendingAction === "deleteOne" && pendingNoteToDelete) {
        pendingNoteToDelete.remove();
        saveNotes();
    }
    hidePopup();
});

popupCancelBtn.addEventListener('click', hidePopup);
popupCloseBtn.addEventListener('click', hidePopup);

// Close popup when clicking outside the popup content
confirmationPopup.addEventListener('click', (e) => {
    if (e.target === confirmationPopup) {
        hidePopup();
    }
});

// Clear button click handler
clearBtn.addEventListener('click', () => {
    clearNotes(true);
});

createBtn.onclick = function () {
    // Generate a unique ID for the new note
    const noteId = Date.now() + '-' + noteCount;
    
    // Create new note element
    let newNote = document.createElement("div");
    newNote.classList.add("note");
    newNote.innerHTML = `
        <button class="close" aria-label="Delete note">×</button>
        <textarea placeholder="Write Content..." rows="10" cols="30"></textarea>
    `;
    
    // Set initial properties
    newNote.style.borderColor = color.value;
    newNote.style.position = 'absolute';
    
    // Position notes in a staggered pattern
    const offsetX = (noteCount % 3) * 20;
    const offsetY = (noteCount % 5) * 20;
    
    // Set initial position, accounting for smaller screens
    const isMobile = window.innerWidth <= 768;
    const initialX = isMobile ? 20 + offsetX : 50 + offsetX;
    const initialY = 70 + offsetY;
    
    newNote.style.left = initialX + "px";
    newNote.style.top = initialY + "px";
    
    // Add data-id attribute
    newNote.dataset.id = noteId;
    
    // Add to DOM
    list.appendChild(newNote);
    noteCount++;
    
    // Focus the textarea
    setTimeout(() => {
        const textarea = newNote.querySelector('textarea');
        if (textarea) textarea.focus();
    }, 100);
    
    // Save to localStorage
    saveNotes();
}

// Save notes when content changes (debounced to avoid too many saves)
let saveTimeout;
document.addEventListener('input', (e) => {
    if (e.target.tagName.toLowerCase() === 'textarea') {
        // Clear previous timeout
        clearTimeout(saveTimeout);
        
        // Set new timeout (300ms debounce)
        saveTimeout = setTimeout(() => {
            saveNotes();
        }, 300);
    }
});

// Save when color input changes
color.addEventListener('change', saveNotes);

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("close")) {
        // Show confirmation before deleting
        deleteNote(e.target.closest('.note'));
    }
});

// Bring note to front when interacting with it
document.addEventListener("mousedown", (e) => {
    const note = e.target.closest('.note');
    if (note) {
        // Bring to front by setting higher z-index
        const notes = document.querySelectorAll('.note');
        notes.forEach(n => n.style.zIndex = '1');
        note.style.zIndex = '10';
        
        // Save the z-index changes
        saveNotes();
    }
});

let cursor = {
    x: null,
    y: null
};

let note = {
    dom: null,
    x: null,
    y: null
};

function startDragging(e) {
    // Skip if we're interacting with textarea or close button
    if (e.target.tagName.toLowerCase() === 'textarea' || 
        e.target.classList.contains('close')) return;
    
    const targetNote = e.target.closest('.note');
    if (!targetNote) return;

    e.preventDefault();

    // Get correct positions for both mouse and touch events
    cursor = {
        x: e.clientX || (e.touches && e.touches[0].clientX),
        y: e.clientY || (e.touches && e.touches[0].clientY)
    };

    note = {
        dom: targetNote,
        x: targetNote.getBoundingClientRect().left,
        y: targetNote.getBoundingClientRect().top
    };
    
    // Add dragging class
    if (note.dom) {
        note.dom.classList.add('dragging');
        note.dom.style.cursor = "grabbing";
    }
}

function dragNote(e) {
    if (note.dom == null) return;

    e.preventDefault();

    // Get current cursor position for both mouse and touch
    let currentCursor = {
        x: e.clientX || (e.touches && e.touches[0].clientX),
        y: e.clientY || (e.touches && e.touches[0].clientY)
    };

    let distance = {
        x: currentCursor.x - cursor.x,
        y: currentCursor.y - cursor.y
    };

    // Calculate new position with bounds checking
    const newLeft = note.x + distance.x;
    const newTop = note.y + distance.y;
    
    // Apply new position
    note.dom.style.left = newLeft + "px";
    note.dom.style.top = newTop + "px";
}

function stopDragging() {
    if (note.dom == null) return;
    
    note.dom.classList.remove('dragging');
    note.dom.style.cursor = "grab";
    
    // Save the new position
    saveNotes();
    
    note.dom = null;
}

// Mouse events
document.addEventListener("mousedown", startDragging);
document.addEventListener("mousemove", dragNote);
document.addEventListener("mouseup", stopDragging);

// Touch events
document.addEventListener("touchstart", startDragging, { passive: false });
document.addEventListener("touchmove", dragNote, { passive: false });
document.addEventListener("touchend", stopDragging);

// Handle window resize
window.addEventListener('resize', function() {
    // Make sure notes stay visible when window is resized
    const notes = document.querySelectorAll('.note');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    notes.forEach(noteElement => {
        const rect = noteElement.getBoundingClientRect();
        
        // If note is offscreen after resize, move it back into view
        if (rect.right > windowWidth) {
            noteElement.style.left = (windowWidth - rect.width - 10) + 'px';
        }
        
        if (rect.bottom > windowHeight) {
            noteElement.style.top = (windowHeight - rect.height - 10) + 'px';
        }
        
        if (rect.left < 0) {
            noteElement.style.left = '10px';
        }
        
        if (rect.top < 60) { // Accounting for the form at the top
            noteElement.style.top = '60px';
        }
    });
    
    // Save the repositioned notes
    saveNotes();
});

// Add focus trap for the popup
document.addEventListener('keydown', (e) => {
    // If popup is active
    if (confirmationPopup.classList.contains('active')) {
        // Escape key to close popup
        if (e.key === 'Escape') {
            hidePopup();
        }
        // Enter key to confirm
        else if (e.key === 'Enter') {
            popupConfirmBtn.click();
        }
        // Tab key for focus trap
        else if (e.key === 'Tab') {
            // Get all focusable elements
            const focusableElements = confirmationPopup.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            // If shift+tab pressed and first element is focused, move to last element
            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
            // If tab pressed and last element is focused, move to first element
            else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
});
