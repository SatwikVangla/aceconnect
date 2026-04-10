import { spinnerRender } from '../utilities/spinner.js';

const adminContainerEl = document.querySelector('.admin-container');

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // Ignore invalid JSON error payloads.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function fetchAuthConfig() {
  return requestJson('/api/auth/config');
}

async function fetchCurrentUser() {
  return requestJson('/api/auth/me');
}

async function login(username, password) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
}

async function logout() {
  await requestJson('/api/auth/logout', {
    method: 'POST',
  });
}

async function changePassword(newPassword) {
  await requestJson('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });
}

async function fetchUsers() {
  return requestJson('/api/users');
}

async function createUser(payload) {
  return requestJson('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function updateUser(userId, payload) {
  return requestJson(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function deleteUser(userId) {
  await requestJson(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

async function fetchStudents() {
  return requestJson('/api/students?departmentId=cse&batchStart=2022&section=A');
}

async function createStudent(payload) {
  return requestJson('/api/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function updateStudent(rollNumber, payload) {
  return requestJson(`/api/students/${encodeURIComponent(rollNumber)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function deleteStudent(rollNumber) {
  await requestJson(`/api/students/${encodeURIComponent(rollNumber)}`, {
    method: 'DELETE',
  });
}

function renderLogin() {
  adminContainerEl.innerHTML = `
    <section class="auth-card card">
      <div class="card-body p-4">
        <h2 class="h4 mb-3">Admin Login Required</h2>
        <p class="text-muted">Sign in as an admin to open the dashboard.</p>
        <form class="auth-login-form row g-3">
          <div class="col-md-6">
            <label class="form-label" for="username">Username</label>
            <input class="form-control" id="username" name="username" autocomplete="username" value="admin">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="password">Password</label>
            <input class="form-control" id="password" name="password" type="password" autocomplete="current-password">
          </div>
          <div class="col-12 d-flex gap-3 align-items-center">
            <button type="submit" class="btn btn-primary">Sign In</button>
            <span class="status-line text-muted"></span>
          </div>
        </form>
      </div>
    </section>
  `;

  const formEl = adminContainerEl.querySelector('.auth-login-form');
  const statusEl = adminContainerEl.querySelector('.status-line');

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = 'Signing in...';

    const formData = new FormData(formEl);

    try {
      await login(
        String(formData.get('username') ?? '').trim(),
        String(formData.get('password') ?? ''),
      );
      await init();
    } catch (error) {
      console.error(error);
      statusEl.textContent = error instanceof Error ? error.message : 'Invalid username or password.';
    }
  });
}

function renderForbidden(user) {
  adminContainerEl.innerHTML = `
    <section class="auth-card card">
      <div class="card-body p-4">
        <h2 class="h4 mb-3">Admin Access Required</h2>
        <p class="text-muted mb-3">Signed in as ${user.fullName} (${user.role}). This dashboard is only available to admins.</p>
        <div class="d-flex gap-3">
          <a class="btn btn-outline-primary" href="profile.html">Back to Profile</a>
          <button type="button" class="btn btn-outline-secondary logout-user">Logout</button>
        </div>
      </div>
    </section>
  `;

  adminContainerEl.querySelector('.logout-user').addEventListener('click', async () => {
    await logout();
    renderLogin();
  });
}

function renderDashboard(user, users, students) {
  const adminCount = users.filter((item) => item.role === 'admin').length;
  const editorCount = users.filter((item) => item.role === 'editor').length;

  adminContainerEl.innerHTML = `
    <section class="dashboard-card card mb-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h2 class="admin-section-title h4 mb-1">Welcome, ${user.fullName}</h2>
            <p class="text-muted mb-0">Use this dashboard to manage users, students, and profile-ready cohorts.</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <a class="btn btn-outline-primary" href="../index.html">Home</a>
            <a class="btn btn-outline-primary" href="profile.html">Profile Page</a>
            <button type="button" class="btn btn-outline-secondary change-password">Change Password</button>
            <button type="button" class="btn btn-outline-secondary logout-user">Logout</button>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-label">Total Users</div>
        <div class="stat-value">${users.length}</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Admins</div>
        <div class="stat-value">${adminCount}</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Editors</div>
        <div class="stat-value">${editorCount}</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Students In Seeded Cohort</div>
        <div class="stat-value">${students.length}</div>
      </article>
    </section>

    <section class="dashboard-card card mb-4">
      <div class="card-body p-4">
        <h3 class="admin-section-title h5 mb-3">Create User</h3>
        <form class="user-create-form row g-3">
          <div class="col-md-4">
            <label class="form-label" for="newUsername">Username</label>
            <input class="form-control" id="newUsername" name="username" autocomplete="username">
          </div>
          <div class="col-md-4">
            <label class="form-label" for="newFullName">Full Name</label>
            <input class="form-control" id="newFullName" name="fullName">
          </div>
          <div class="col-md-4">
            <label class="form-label" for="newRole">Role</label>
            <select class="form-select" id="newRole" name="role">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="col-md-8">
            <label class="form-label" for="newUserPassword">Password</label>
            <input class="form-control" id="newUserPassword" name="password" type="password" minlength="8" autocomplete="new-password">
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button type="submit" class="btn btn-primary w-100">Create User</button>
          </div>
          <div class="col-12">
            <span class="status-line user-create-status text-muted"></span>
          </div>
        </form>
      </div>
    </section>

    <section class="dashboard-card card mb-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h3 class="admin-section-title h5 mb-0">Manage Users</h3>
          <span class="text-muted small">Admins cannot remove themselves or demote themselves.</span>
        </div>
        <div class="user-list">
          ${users
            .map(
              (item) => `
                <form class="user-row row g-2 align-items-end" data-user-id="${item.id}">
                  <div class="col-md-3">
                    <label class="form-label">Username</label>
                    <input class="form-control" value="${item.username}" disabled>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Full Name</label>
                    <input class="form-control" name="fullName" value="${item.fullName}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Role</label>
                    <select class="form-select" name="role">
                      <option value="editor" ${item.role === 'editor' ? 'selected' : ''}>Editor</option>
                      <option value="admin" ${item.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <button type="submit" class="btn btn-outline-secondary w-100">Update</button>
                  </div>
                  <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger w-100 delete-user">Delete</button>
                  </div>
                  <div class="col-12">
                    <span class="status-line user-row-status text-muted small"></span>
                  </div>
                </form>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="dashboard-card card mb-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 class="admin-section-title h5 mb-1">Student Cohort Management</h3>
            <p class="text-muted mb-0">Manage persisted students for the default seeded cohort. Profile updates stay in sync with these records.</p>
          </div>
          <a class="btn btn-outline-primary" href="rollnumber.html?department=cse&batchStart=2022&batchEnd=2026&section=A">Open Roll Numbers</a>
        </div>

        <form class="student-create-form row g-3 mb-4">
          <div class="col-md-3">
            <label class="form-label" for="studentRollNumber">Roll Number</label>
            <input class="form-control" id="studentRollNumber" name="rollNumber" placeholder="22AG1A0599">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="studentFullName">Full Name</label>
            <input class="form-control" id="studentFullName" name="fullName">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="studentEmail">Email</label>
            <input class="form-control" id="studentEmail" name="email">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="studentPhone">Phone</label>
            <input class="form-control" id="studentPhone" name="phone">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="studentDepartmentId">Department</label>
            <input class="form-control" id="studentDepartmentId" name="departmentId" value="cse">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="studentBatchStart">Batch Start</label>
            <input class="form-control" id="studentBatchStart" name="batchStart" type="number" value="2022">
          </div>
          <div class="col-md-2">
            <label class="form-label" for="studentSection">Section</label>
            <input class="form-control" id="studentSection" name="section" value="A">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <div class="form-check">
              <input class="form-check-input" id="studentLateralEntry" name="lateralEntry" type="checkbox">
              <label class="form-check-label" for="studentLateralEntry">Lateral Entry</label>
            </div>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="submit" class="btn btn-primary w-100">Create Student</button>
          </div>
          <div class="col-12">
            <span class="status-line student-create-status text-muted"></span>
          </div>
        </form>

        <div class="student-list">
          ${students
            .map(
              (student) => `
                <form class="student-row row g-2 align-items-end" data-roll-number="${student.rollNumber}">
                  <div class="col-md-2">
                    <label class="form-label">Roll Number</label>
                    <input class="form-control" value="${student.rollNumber}" disabled>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Full Name</label>
                    <input class="form-control" name="fullName" value="${student.fullName}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Email</label>
                    <input class="form-control" name="email" value="${student.email}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Phone</label>
                    <input class="form-control" name="phone" value="${student.phone}">
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Dept</label>
                    <input class="form-control" name="departmentId" value="${student.departmentId}">
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Batch</label>
                    <input class="form-control" name="batchStart" type="number" value="${student.batchStart}">
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Section</label>
                    <input class="form-control" name="section" value="${student.section}">
                  </div>
                  <div class="col-md-1">
                    <div class="form-check mt-4">
                      <input class="form-check-input" name="lateralEntry" type="checkbox" ${student.lateralEntry ? 'checked' : ''}>
                      <label class="form-check-label">LE</label>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <a class="btn btn-outline-primary w-100" href="profile.html?rollNumber=${encodeURIComponent(student.rollNumber)}&departmentId=${encodeURIComponent(student.departmentId)}&batchStart=${student.batchStart}&section=${encodeURIComponent(student.section)}">Profile</a>
                  </div>
                  <div class="col-md-1">
                    <button type="submit" class="btn btn-outline-secondary w-100">Save</button>
                  </div>
                  <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger w-100 delete-student">Delete</button>
                  </div>
                  <div class="col-12">
                    <span class="status-line student-row-status text-muted small"></span>
                  </div>
                </form>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  const createUserFormEl = adminContainerEl.querySelector('.user-create-form');
  const createUserStatusEl = adminContainerEl.querySelector('.user-create-status');
  const createStudentFormEl = adminContainerEl.querySelector('.student-create-form');
  const createStudentStatusEl = adminContainerEl.querySelector('.student-create-status');

  adminContainerEl.querySelector('.logout-user').addEventListener('click', async () => {
    await logout();
    renderLogin();
  });

  adminContainerEl.querySelector('.change-password').addEventListener('click', () => {
    const password = window.prompt('Enter a new password (minimum 8 characters):');

    if (!password) {
      return;
    }

    changePassword(password)
      .then(() => {
        window.alert('Password updated.');
      })
      .catch((error) => {
        console.error(error);
        window.alert(error instanceof Error ? error.message : 'Password update failed.');
      });
  });

  createUserFormEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    createUserStatusEl.textContent = 'Creating user...';

    const formData = new FormData(createUserFormEl);

    try {
      await createUser({
        username: String(formData.get('username') ?? ''),
        fullName: String(formData.get('fullName') ?? ''),
        role: String(formData.get('role') ?? ''),
        password: String(formData.get('password') ?? ''),
      });
      await init();
    } catch (error) {
      console.error(error);
      createUserStatusEl.textContent = error instanceof Error ? error.message : 'Create user failed.';
    }
  });

  createStudentFormEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    createStudentStatusEl.textContent = 'Creating student...';

    const formData = new FormData(createStudentFormEl);

    try {
      await createStudent({
        rollNumber: String(formData.get('rollNumber') ?? ''),
        fullName: String(formData.get('fullName') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        departmentId: String(formData.get('departmentId') ?? 'cse'),
        batchStart: Number(formData.get('batchStart') ?? 2022),
        section: String(formData.get('section') ?? 'A'),
        lateralEntry: formData.get('lateralEntry') === 'on',
      });
      await init();
    } catch (error) {
      console.error(error);
      createStudentStatusEl.textContent = error instanceof Error ? error.message : 'Create student failed.';
    }
  });

  for (const rowEl of adminContainerEl.querySelectorAll('.user-row')) {
    const statusEl = rowEl.querySelector('.user-row-status');
    const deleteButtonEl = rowEl.querySelector('.delete-user');
    const userId = rowEl.dataset.userId;

    rowEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusEl.textContent = 'Updating...';

      const formData = new FormData(rowEl);

      try {
        await updateUser(userId, {
          fullName: String(formData.get('fullName') ?? ''),
          role: String(formData.get('role') ?? ''),
        });
        await init();
      } catch (error) {
        console.error(error);
        statusEl.textContent = error instanceof Error ? error.message : 'Update failed.';
      }
    });

    deleteButtonEl.addEventListener('click', async () => {
      statusEl.textContent = 'Deleting...';

      try {
        await deleteUser(userId);
        await init();
      } catch (error) {
        console.error(error);
        statusEl.textContent = error instanceof Error ? error.message : 'Delete failed.';
      }
    });
  }

  for (const rowEl of adminContainerEl.querySelectorAll('.student-row')) {
    const statusEl = rowEl.querySelector('.student-row-status');
    const deleteButtonEl = rowEl.querySelector('.delete-student');
    const rollNumber = rowEl.dataset.rollNumber;

    rowEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusEl.textContent = 'Saving student...';

      const formData = new FormData(rowEl);

      try {
        await updateStudent(rollNumber, {
          departmentId: String(formData.get('departmentId') ?? 'cse'),
          batchStart: Number(formData.get('batchStart') ?? 2022),
          section: String(formData.get('section') ?? 'A'),
          fullName: String(formData.get('fullName') ?? ''),
          email: String(formData.get('email') ?? ''),
          phone: String(formData.get('phone') ?? ''),
          lateralEntry: formData.get('lateralEntry') === 'on',
        });
        await init();
      } catch (error) {
        console.error(error);
        statusEl.textContent = error instanceof Error ? error.message : 'Student update failed.';
      }
    });

    deleteButtonEl.addEventListener('click', async () => {
      statusEl.textContent = 'Deleting student...';

      try {
        await deleteStudent(rollNumber);
        await init();
      } catch (error) {
        console.error(error);
        statusEl.textContent = error instanceof Error ? error.message : 'Student delete failed.';
      }
    });
  }
}

async function init() {
  spinnerRender(adminContainerEl);

  try {
    const [authConfig, session] = await Promise.all([
      fetchAuthConfig(),
      fetchCurrentUser(),
    ]);

    if (authConfig.authEnabled && !session.user) {
      renderLogin();
      return;
    }

    if (!session.user || session.user.role !== 'admin') {
      renderForbidden(session.user);
      return;
    }

    const [users, students] = await Promise.all([
      fetchUsers(),
      fetchStudents(),
    ]);
    renderDashboard(session.user, users, students);
  } catch (error) {
    console.error(error);
    adminContainerEl.innerHTML = '<p class="text-center">Unable to load the admin dashboard right now.</p>';
  }
}

init();
