import { fetchProfile } from './profile.js';
import { spinnerRender } from '../utilities/spinner.js';

const profileContainerEl = document.querySelector('.profile-container');
const profileEditorContainerEl = document.querySelector('.profile-editor-container');
const params = new URLSearchParams(window.location.search);
const rollNumber = params.get('rollNumber') ?? '22AG1A0501';
const departmentId = params.get('departmentId') ?? 'cse';
const batchStart = Number(params.get('batchStart')) || 2022;
const section = params.get('section') ?? 'A';
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

  return response.json();
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

function profileRender(profile) {
  profileContainerEl.innerHTML = `
    <div class="main-body">
      <nav aria-label="breadcrumb" class="main-breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="sections.html">Sections</a></li>
          <li class="breadcrumb-item"><a href="rollnumber.html">Roll Numbers</a></li>
          <li class="breadcrumb-item active" aria-current="page">User Profile</li>
        </ol>
      </nav>

      <div class="row gutters-sm">
        <div class="col-md-4 mb-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex flex-column align-items-center text-center">
                <img src="${profile.imageSrc}" alt="Profile avatar" class="rounded-circle" width="150">
                <div class="mt-3">
                  <h4>${profile.name}</h4>
                  <p class="text-secondary mb-1">${profile.qualifications}</p>
                  <p class="text-muted font-size-sm">${profile.address}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="card mt-3">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                <h6 class="mb-0">Website</h6>
                <span class="text-secondary">${profile.website}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                <h6 class="mb-0">Github</h6>
                <span class="text-secondary">${profile.github}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                <h6 class="mb-0">Twitter</h6>
                <span class="text-secondary">${profile.twitter}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                <h6 class="mb-0">Instagram</h6>
                <span class="text-secondary">${profile.instagram}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                <h6 class="mb-0">Facebook</h6>
                <span class="text-secondary">${profile.facebook}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="col-md-8 profile-card">
          <div class="card mb-3">
            <div class="card-body">
              <div class="row">
                <div class="col-sm-3"><h6 class="mb-0">Full Name</h6></div>
                <div class="col-sm-9 text-secondary">${profile.fullName}</div>
              </div>
              <hr>
              <div class="row">
                <div class="col-sm-3"><h6 class="mb-0">Email</h6></div>
                <div class="col-sm-9 text-secondary">${profile.email}</div>
              </div>
              <hr>
              <div class="row">
                <div class="col-sm-3"><h6 class="mb-0">Phone</h6></div>
                <div class="col-sm-9 text-secondary">${profile.phone}</div>
              </div>
              <hr>
              <div class="row">
                <div class="col-sm-3"><h6 class="mb-0">Mobile</h6></div>
                <div class="col-sm-9 text-secondary">${profile.mobile}</div>
              </div>
              <hr>
              <div class="row">
                <div class="col-sm-3"><h6 class="mb-0">Address</h6></div>
                <div class="col-sm-9 text-secondary">${profile.address}</div>
              </div>
              <hr>
              <div class="row">
                <div class="col-sm-3"><h6 class="mb-0">Bio</h6></div>
                <div class="col-sm-9 text-secondary">${profile.bio ?? ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEditor(profile, authState) {
  if (authState.authEnabled && !authState.user) {
    profileEditorContainerEl.innerHTML = `
      <section class="profile-editor">
        <div class="card">
          <div class="card-body">
            <h2 class="h4 mb-3">Login Required</h2>
            <p class="text-muted">Sign in with a backend user account to edit and save profiles.</p>
            <form class="auth-login-form row g-3">
              <div class="col-md-8">
                <label class="form-label" for="username">Username</label>
                <input class="form-control" id="username" name="username" autocomplete="username" value="admin">
              </div>
              <div class="col-md-8">
                <label class="form-label" for="password">Password</label>
                <input class="form-control" id="password" name="password" type="password" autocomplete="current-password">
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <button type="submit" class="btn btn-primary w-100">Sign In</button>
              </div>
              <div class="col-12">
                <span class="save-status text-muted"></span>
              </div>
            </form>
          </div>
        </div>
      </section>
    `;

    const loginFormEl = profileEditorContainerEl.querySelector('.auth-login-form');
    const statusEl = profileEditorContainerEl.querySelector('.save-status');

    loginFormEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusEl.textContent = 'Signing in...';

      const formData = new FormData(loginFormEl);
      const username = String(formData.get('username') ?? '').trim();
      const password = String(formData.get('password') ?? '');

      try {
        const result = await login(username, password);
        renderEditor(profile, {
          ...authState,
          user: result.user,
        });
      } catch (error) {
        console.error(error);
        statusEl.textContent = 'Invalid username or password.';
      }
    });

    return;
  }

  profileEditorContainerEl.innerHTML = `
    <section class="profile-editor">
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h2 class="h4 mb-0">Edit Profile</h2>
            ${
              authState.user
                ? `<div class="d-flex align-items-center gap-2 flex-wrap">
                     <span class="text-muted small">Signed in as ${authState.user.fullName} (${authState.user.role})</span>
                     <button type="button" class="btn btn-outline-secondary btn-sm change-password">Change Password</button>
                     <button type="button" class="btn btn-outline-secondary btn-sm logout-user">Logout</button>
                   </div>`
                : ''
            }
          </div>
          <form class="profile-form row g-3">
            <div class="col-md-6">
              <label class="form-label" for="fullName">Full Name</label>
              <input class="form-control" id="fullName" name="fullName" value="${profile.fullName ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="name">Display Name</label>
              <input class="form-control" id="name" name="name" value="${profile.name ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="email">Email</label>
              <input class="form-control" id="email" name="email" value="${profile.email ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="qualifications">Qualification</label>
              <input class="form-control" id="qualifications" name="qualifications" value="${profile.qualifications ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="phone">Phone</label>
              <input class="form-control" id="phone" name="phone" value="${profile.phone ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="mobile">Mobile</label>
              <input class="form-control" id="mobile" name="mobile" value="${profile.mobile ?? ''}">
            </div>
            <div class="col-12">
              <label class="form-label" for="address">Address</label>
              <input class="form-control" id="address" name="address" value="${profile.address ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="website">Website</label>
              <input class="form-control" id="website" name="website" value="${profile.website ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="imageSrc">Image URL</label>
              <input class="form-control" id="imageSrc" name="imageSrc" value="${profile.imageSrc ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="github">GitHub</label>
              <input class="form-control" id="github" name="github" value="${profile.github ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="twitter">Twitter</label>
              <input class="form-control" id="twitter" name="twitter" value="${profile.twitter ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="instagram">Instagram</label>
              <input class="form-control" id="instagram" name="instagram" value="${profile.instagram ?? ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="facebook">Facebook</label>
              <input class="form-control" id="facebook" name="facebook" value="${profile.facebook ?? ''}">
            </div>
            <div class="col-12">
              <label class="form-label" for="bio">Bio</label>
              <textarea class="form-control" id="bio" name="bio" rows="4">${profile.bio ?? ''}</textarea>
            </div>
            <div class="col-12 d-flex gap-3 align-items-center">
              <button type="submit" class="btn btn-primary">Save Profile</button>
              <span class="save-status text-muted"></span>
            </div>
          </form>
          <form class="password-form row g-3 mt-3">
            <div class="col-md-8">
              <label class="form-label" for="newPassword">New Password</label>
              <input class="form-control" id="newPassword" name="newPassword" type="password" minlength="8" autocomplete="new-password">
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button type="submit" class="btn btn-outline-primary w-100">Update Password</button>
            </div>
            <div class="col-12">
              <span class="password-status text-muted"></span>
            </div>
          </form>
          ${
            authState.user?.role === 'admin'
              ? `
                <section class="user-management mt-4">
                  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h3 class="h5 mb-0">User Management</h3>
                    <span class="text-muted small">Admins can create, edit, and remove user accounts.</span>
                  </div>
                  <form class="user-create-form row g-3 mb-4">
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
                      <button type="submit" class="btn btn-outline-primary w-100">Create User</button>
                    </div>
                    <div class="col-12">
                      <span class="user-create-status text-muted"></span>
                    </div>
                  </form>
                  <div class="user-list-container">
                    <p class="text-muted mb-0">Loading users...</p>
                  </div>
                </section>
              `
              : ''
          }
        </div>
      </div>
    </section>
  `;

  const formEl = profileEditorContainerEl.querySelector('.profile-form');
  const statusEl = profileEditorContainerEl.querySelector('.save-status');
  const logoutButtonEl = profileEditorContainerEl.querySelector('.logout-user');
  const passwordFormEl = profileEditorContainerEl.querySelector('.password-form');
  const passwordStatusEl = profileEditorContainerEl.querySelector('.password-status');
  const changePasswordButtonEl = profileEditorContainerEl.querySelector('.change-password');
  const userCreateFormEl = profileEditorContainerEl.querySelector('.user-create-form');
  const userCreateStatusEl = profileEditorContainerEl.querySelector('.user-create-status');
  const userListContainerEl = profileEditorContainerEl.querySelector('.user-list-container');

  async function refreshUsers() {
    if (!userListContainerEl) {
      return;
    }

    try {
      const users = await fetchUsers();
      userListContainerEl.innerHTML = `
        <div class="user-list">
          ${users
            .map(
              (user) => `
                <form class="user-row row g-2 align-items-end" data-user-id="${user.id}">
                  <div class="col-md-3">
                    <label class="form-label">Username</label>
                    <input class="form-control" value="${user.username}" disabled>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Full Name</label>
                    <input class="form-control" name="fullName" value="${user.fullName}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Role</label>
                    <select class="form-select" name="role">
                      <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
                      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <button type="submit" class="btn btn-outline-secondary w-100">Update</button>
                  </div>
                  <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger w-100 delete-user">Delete</button>
                  </div>
                  <div class="col-12">
                    <span class="user-row-status text-muted small"></span>
                  </div>
                </form>
              `,
            )
            .join('')}
        </div>
      `;

      for (const rowEl of userListContainerEl.querySelectorAll('.user-row')) {
        const statusRowEl = rowEl.querySelector('.user-row-status');
        const deleteButtonEl = rowEl.querySelector('.delete-user');
        const userId = rowEl.dataset.userId;

        rowEl.addEventListener('submit', async (event) => {
          event.preventDefault();
          statusRowEl.textContent = 'Updating...';

          const formData = new FormData(rowEl);

          try {
            const updatedUser = await updateUser(userId, {
              fullName: String(formData.get('fullName') ?? ''),
              role: String(formData.get('role') ?? ''),
            });
            statusRowEl.textContent = `Updated ${updatedUser.username}.`;
          } catch (error) {
            console.error(error);
            statusRowEl.textContent = 'Update failed.';
          }
        });

        deleteButtonEl.addEventListener('click', async () => {
          statusRowEl.textContent = 'Deleting...';

          try {
            await deleteUser(userId);
            await refreshUsers();
          } catch (error) {
            console.error(error);
            statusRowEl.textContent = 'Delete failed.';
          }
        });
      }
    } catch (error) {
      console.error(error);
      userListContainerEl.innerHTML = '<p class="text-muted mb-0">Unable to load users.</p>';
    }
  }

  if (logoutButtonEl) {
    logoutButtonEl.addEventListener('click', async () => {
      await logout();
      renderEditor(profile, {
        ...authState,
        user: null,
      });
    });
  }

  if (changePasswordButtonEl) {
    changePasswordButtonEl.addEventListener('click', () => {
      passwordFormEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const newPasswordField = passwordFormEl.querySelector('#newPassword');
      newPasswordField.focus();
    });
  }

  passwordFormEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    passwordStatusEl.textContent = 'Updating password...';

    const formData = new FormData(passwordFormEl);
    const newPassword = String(formData.get('newPassword') ?? '');

    try {
      await changePassword(newPassword);
      passwordFormEl.reset();
      passwordStatusEl.textContent = 'Password updated.';
    } catch (error) {
      console.error(error);
      passwordStatusEl.textContent = 'Password update failed. Use at least 8 characters.';
    }
  });

  if (userCreateFormEl) {
    userCreateFormEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      userCreateStatusEl.textContent = 'Creating user...';

      const formData = new FormData(userCreateFormEl);

      try {
        const user = await createUser({
          username: String(formData.get('username') ?? ''),
          fullName: String(formData.get('fullName') ?? ''),
          role: String(formData.get('role') ?? ''),
          password: String(formData.get('password') ?? ''),
        });
        userCreateFormEl.reset();
        userCreateStatusEl.textContent = `Created ${user.username}.`;
        await refreshUsers();
      } catch (error) {
        console.error(error);
        userCreateStatusEl.textContent = 'Create user failed.';
      }
    });

    refreshUsers();
  }

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = 'Saving...';

    const formData = new FormData(formEl);
    const payload = Object.fromEntries(formData.entries());
    payload.departmentId = departmentId;
    payload.batchStart = batchStart;
    payload.section = section;

    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(rollNumber)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          renderEditor(profile, {
            ...authState,
            user: null,
          });
          throw new Error('Unauthorized');
        }

        throw new Error(`Save failed: ${response.status}`);
      }

      const updatedProfile = await response.json();
      profileRender(updatedProfile);
      renderEditor(updatedProfile, authState);
      statusEl.textContent = 'Saved to SQLite-backed backend.';
    } catch (error) {
      console.error(error);
      statusEl.textContent = error.message === 'Unauthorized' ? 'Your session expired. Sign in again.' : 'Save failed.';
    }
  });
}

async function init() {
  spinnerRender(profileContainerEl);
  spinnerRender(profileEditorContainerEl);

  try {
    const [profile, authConfig, authSession] = await Promise.all([
      fetchProfile(rollNumber, {
        departmentId,
        batchStart,
        section,
      }),
      fetchAuthConfig(),
      fetchCurrentUser(),
    ]);

    profileRender(profile);
    renderEditor(profile, {
      ...authConfig,
      user: authSession.user,
    });
  } catch (error) {
    console.error(error);
    profileContainerEl.innerHTML = '<p class="text-center">Unable to load the profile right now.</p>';
    profileEditorContainerEl.innerHTML = '';
  }
}

init();
