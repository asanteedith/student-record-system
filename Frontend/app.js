// ===== CONFIG =====
const API_BASE_URL = 'https://nqsop00q9b.execute-api.us-east-1.amazonaws.com/prod';

// ===== STATE =====
let students = [];
let currentPage = 1;
let rowsPerPage = 25;
let deleteTargetId = null;

// ===== TOAST =====
function showToast(message, type = 'default') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== AVATAR HELPERS =====
const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ede9fe', text: '#5b21b6' },
  { bg: '#fee2e2', text: '#991b1b' },
  { bg: '#e0f2fe', text: '#0369a1' },
  { bg: '#f0fdf4', text: '#166534' },
];

function getAvatarColor(name) {
  const i = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

function getInitials(name) {
  return name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
}

const MAJOR_COLORS = {
  'Computer Science':     { bg: '#ede9fe', text: '#5b21b6' },
  'Software Engineering': { bg: '#dbeafe', text: '#1e40af' },
  'Information Technology': { bg: '#d1fae5', text: '#065f46' },
  'Data Science':         { bg: '#fef3c7', text: '#92400e' },
  'Cybersecurity':        { bg: '#fce7f3', text: '#9d174d' },
  'Business':             { bg: '#ffedd5', text: '#9a3412' },
  'Engineering':          { bg: '#e0f2fe', text: '#0369a1' },
  'Mathematics':          { bg: '#f3e8ff', text: '#6b21a8' },
  'Physics':              { bg: '#ecfdf5', text: '#047857' },
};

function getMajorColor(major) {
  return MAJOR_COLORS[major] || { bg: '#f3f4f6', text: '#374151' };
}

// ===== STATS =====
function updateStats() {
  document.getElementById('statTotal').textContent = students.length;

  if (students.length === 0) {
    document.getElementById('statAvgGpa').textContent = '—';
    document.getElementById('statMajors').textContent = '0';
    return;
  }

  const avg = students.reduce((s, st) => s + (parseFloat(st.gpa) || 0), 0) / students.length;
  document.getElementById('statAvgGpa').textContent = avg.toFixed(2);

  const uniqueMajors = new Set(students.map(s => s.major)).size;
  document.getElementById('statMajors').textContent = uniqueMajors;
}

// ===== TABLE RENDERING =====
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const emptyRow = document.getElementById('emptyRow');

  if (data.length === 0) {
    tbody.innerHTML = '';
    tbody.appendChild(emptyRow);
    emptyRow.style.display = '';
    updatePagination(0);
    return;
  }

  emptyRow.style.display = 'none';
  tbody.innerHTML = '';
  tbody.appendChild(emptyRow); // keep it in DOM but hidden

  data.forEach(student => {
    const av = getAvatarColor(student.name);
    const mc = getMajorColor(student.major);
    const initials = getInitials(student.name);
    const gpa = parseFloat(student.gpa);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="avatar" style="background:${av.bg};color:${av.text};">${initials}</div>
        <span class="student-name">${escHtml(student.name)}</span>
      </td>
      <td><span class="student-id-cell">${escHtml(student.studentId)}</span></td>
      <td>${escHtml(student.email)}</td>
      <td><span class="major-badge" style="background:${mc.bg};color:${mc.text};">${escHtml(student.major)}</span></td>
      <td><span class="gpa-cell">${isNaN(gpa) ? '—' : gpa.toFixed(2)}</span></td>
      <td class="actions-cell">
        <div class="actions-container">
          <button class="actions-btn" onclick="toggleMenu(event,'${escAttr(student.studentId)}')" aria-label="Actions">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
          <div class="actions-dropdown" id="menu-${escAttr(student.studentId)}">
            <button onclick="closeMenu('${escAttr(student.studentId)}'); viewStudent('${escAttr(student.studentId)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </button>
            <button onclick="closeMenu('${escAttr(student.studentId)}'); editStudent('${escAttr(student.studentId)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="danger" onclick="closeMenu('${escAttr(student.studentId)}'); promptDelete('${escAttr(student.studentId)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              Delete
            </button>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updatePagination(students.length);
}

// Escape helpers to prevent XSS
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
  return String(str).replace(/'/g,"\\'");
}

// ===== PAGINATION =====
function updatePagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

function goToPage(page) {
  const totalPages = Math.max(1, Math.ceil(students.length / rowsPerPage));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  const start = (page - 1) * rowsPerPage;
  renderTable(students.slice(start, start + rowsPerPage));
}

// ===== ACTIONS MENU =====
function toggleMenu(e, id) {
  e.stopPropagation();
  const menu = document.getElementById(`menu-${id}`);
  const isOpen = menu.classList.contains('open');
  closeAllMenus();
  if (!isOpen) menu.classList.add('open');
}

function closeMenu(id) {
  document.getElementById(`menu-${id}`)?.classList.remove('open');
}

function closeAllMenus() {
  document.querySelectorAll('.actions-dropdown.open').forEach(m => m.classList.remove('open'));
}

document.addEventListener('click', closeAllMenus);

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal when clicking backdrop
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});

// ===== VIEW STUDENT =====
function viewStudent(studentId) {
  const student = students.find(s => s.studentId === studentId);
  if (!student) { showToast('Student not found', 'error'); return; }

  const av = getAvatarColor(student.name);
  const mc = getMajorColor(student.major);
  const gpa = parseFloat(student.gpa);

  const avatar = document.getElementById('viewAvatar');
  avatar.textContent = getInitials(student.name);
  avatar.style.background = av.bg;
  avatar.style.color = av.text;

  document.getElementById('viewName').textContent = student.name;
  document.getElementById('viewId').textContent = student.studentId;
  document.getElementById('viewEmail').textContent = student.email;
  document.getElementById('viewMajor').innerHTML = `<span class="major-badge" style="background:${mc.bg};color:${mc.text};">${escHtml(student.major)}</span>`;
  document.getElementById('viewGPA').textContent = isNaN(gpa) ? '—' : gpa.toFixed(2);

  openModal('viewModal');
}

// ===== EDIT STUDENT =====
function editStudent(studentId) {
  const student = students.find(s => s.studentId === studentId);
  if (!student) { showToast('Student not found', 'error'); return; }

  document.getElementById('formMode').value = 'update';
  document.getElementById('modalTitle').textContent = 'Edit Student';
  document.getElementById('formStudentId').value = student.studentId;
  document.getElementById('formStudentId').disabled = true;
  document.getElementById('formName').value = student.name;
  document.getElementById('formEmail').value = student.email;
  document.getElementById('formMajor').value = student.major;
  document.getElementById('formGPA').value = student.gpa;

  openModal('studentModal');
}

// ===== OPEN ADD MODAL =====
function openAddModal() {
  document.getElementById('studentForm').reset();
  document.getElementById('formMode').value = 'create';
  document.getElementById('modalTitle').textContent = 'Add New Student';
  document.getElementById('formStudentId').disabled = false;
  openModal('studentModal');
}

// ===== PROMPT DELETE =====
function promptDelete(studentId) {
  const student = students.find(s => s.studentId === studentId);
  deleteTargetId = studentId;
  document.getElementById('deleteStudentName').textContent = student ? student.name : studentId;
  openModal('deleteModal');
}

// ===== FORM SUBMIT (CREATE / UPDATE) =====
async function handleFormSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById('formMode').value;

  const studentId = document.getElementById('formStudentId').value.trim();
  const name      = document.getElementById('formName').value.trim();
  const email     = document.getElementById('formEmail').value.trim();
  const major     = document.getElementById('formMajor').value.trim();
  const gpa       = parseFloat(document.getElementById('formGPA').value);

  if (mode === 'create') {
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, name, email, major, gpa })
      });
      const data = await res.json();
      if (res.ok) {
        // Add to local list
        students.unshift({ studentId, name, email, major, gpa });
        updateStats();
        renderTable(students.slice(0, rowsPerPage));
        closeModal('studentModal');
        showToast('Student added successfully', 'success');
      } else {
        showToast('Error: ' + (data.error || 'Failed to add student'), 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }

  } else {
    // UPDATE
    const updates = { name, email, major, gpa };
    try {
      const res = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok) {
        const idx = students.findIndex(s => s.studentId === studentId);
        if (idx >= 0) students[idx] = { ...students[idx], ...updates };
        updateStats();
        renderTable(students.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage));
        closeModal('studentModal');
        showToast('Student updated successfully', 'success');
      } else {
        showToast('Error: ' + (data.error || 'Failed to update student'), 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }
  }
}

// ===== DELETE =====
async function handleDelete() {
  if (!deleteTargetId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/students/${deleteTargetId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      students = students.filter(s => s.studentId !== deleteTargetId);
      deleteTargetId = null;
      updateStats();
      renderTable(students.slice(0, rowsPerPage));
      closeModal('deleteModal');
      showToast('Student deleted', 'success');
    } else {
      showToast('Error: ' + (data.error || 'Failed to delete'), 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

// ===== SEARCH =====
async function handleSearch() {
  const term = document.getElementById('searchInput').value.trim();
  if (!term) { showToast('Please enter a Student ID', 'error'); return; }

  try {
    const res = await fetch(`${API_BASE_URL}/students/${term}`);
    const data = await res.json();
    if (res.ok) {
      // Update local cache
      const idx = students.findIndex(s => s.studentId === term);
      if (idx >= 0) students[idx] = data;
      else students.unshift(data);
      renderTable([data]);
      showToast('Student found', 'success');
    } else {
      renderTable([]);
      showToast('Student not found', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

// ===== LOAD ALL STUDENTS =====
async function loadStudents() {
  try {
    const res = await fetch(`${API_BASE_URL}/students`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      students = data;
      updateStats();
      renderTable(students.slice(0, rowsPerPage));
    } else {
      showToast('Failed to load students', 'error');
      renderTable([]);
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    renderTable([]);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadStudents();

  document.getElementById('btnAddStudent').addEventListener('click', openAddModal);

  document.getElementById('btnSearch').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSearch();
  });

  document.getElementById('btnClear').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    renderTable(students.slice(0, rowsPerPage));
  });

  document.getElementById('studentForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('confirmDeleteBtn').addEventListener('click', handleDelete);

  document.getElementById('rowsSelect').addEventListener('change', e => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable(students.slice(0, rowsPerPage));
  });

  document.getElementById('prevPage').addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('nextPage').addEventListener('click', () => goToPage(currentPage + 1));
});