import { spinnerRender } from '../utilities/spinner.js';

const adminContainerEl = document.querySelector('.admin-container');

async function fetchAuthConfig() {
  const response = await fetch('/api/auth/config');

  if (!response.ok) {
    throw new Error(`Failed to load auth config: ${response.status}`);
  }

  return response.json();
}

async function fetchCurrentUser() {
  const response = await fetch('/api/auth/me');

  if (!response.ok) {
    throw new Error(`Failed to load current user: ${response.status}`);
  }

  return response.json();
}

async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return response.json();
}

async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }
}

async function changePassword(newPassword) {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    throw new Error(`Password change failed: ${response.status}`);
  }
}

async function fetchUsers() {
  const response = await fetch('/api/users');

  if (!response.ok) {
    throw new Error(`Failed to load users: ${response.status}`);
  }

  return response.json();
}

async function createUser(payload) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Create user failed: ${response.status}`);
  }

  return response.json();
}

async function updateUser(userId, payload) {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Update user failed: ${response.status}`);
  }

  return response.json();
}

async function deleteUser(userId) {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Delete user failed: ${response.status}`);
  }
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
      statusEl.textContent = 'Invalid username or password.';
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

function renderDashboard(user, users) {
  const adminCount = users.filter((item) => item.role === 'admin').length;
  const editorCount = users.filter((item) => item.role === 'editor').length;

  adminContainerEl.innerHTML = `
    <section class="dashboard-card card mb-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h2 class="admin-section-title h4 mb-1">Welcome, ${user.fullName}</h2>
            <p class="text-muted mb-0">Use this dashboard to manage user accounts and admin access.</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
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

    <section class="dashboard-card card">
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
  `;

  const createFormEl = adminContainerEl.querySelector('.user-create-form');
  const createStatusEl = adminContainerEl.querySelector('.user-create-status');

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
        window.alert('Password update failed.');
      });
  });

  createFormEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    createStatusEl.textContent = 'Creating user...';

    const formData = new FormData(createFormEl);

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
      createStatusEl.textContent = 'Create user failed.';
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
        statusEl.textContent = 'Update failed.';
      }
    });

    deleteButtonEl.addEventListener('click', async () => {
      statusEl.textContent = 'Deleting...';

      try {
        await deleteUser(userId);
        await init();
      } catch (error) {
        console.error(error);
        statusEl.textContent = 'Delete failed.';
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

    const users = await fetchUsers();
    renderDashboard(session.user, users);
  } catch (error) {
    console.error(error);
    adminContainerEl.innerHTML = '<p class="text-center">Unable to load the admin dashboard right now.</p>';
  }
}

init();
