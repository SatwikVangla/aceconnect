import { fetchProfile } from './profile.js';
import { spinnerRender } from '../utilities/spinner.js';

const profileContainerEl = document.querySelector('.profile-container');
const profileEditorContainerEl = document.querySelector('.profile-editor-container');
const params = new URLSearchParams(window.location.search);
const rollNumber = params.get('rollNumber') ?? '22AG1A0501';
const departmentId = params.get('departmentId') ?? 'cse';
const batchStart = Number(params.get('batchStart')) || 2022;
const section = params.get('section') ?? 'A';

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

function renderEditor(profile) {
  profileEditorContainerEl.innerHTML = `
    <section class="profile-editor">
      <div class="card">
        <div class="card-body">
          <h2 class="h4 mb-4">Edit Profile</h2>
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
        </div>
      </div>
    </section>
  `;

  const formEl = profileEditorContainerEl.querySelector('.profile-form');
  const statusEl = profileEditorContainerEl.querySelector('.save-status');

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
        throw new Error(`Save failed: ${response.status}`);
      }

      const updatedProfile = await response.json();
      profileRender(updatedProfile);
      renderEditor(updatedProfile);
      statusEl.textContent = 'Saved to backend JSON store.';
    } catch (error) {
      console.error(error);
      statusEl.textContent = 'Save failed.';
    }
  });
}

async function init() {
  spinnerRender(profileContainerEl);
  spinnerRender(profileEditorContainerEl);

  try {
    const profile = await fetchProfile(rollNumber, {
      departmentId,
      batchStart,
      section,
    });
    profileRender(profile);
    renderEditor(profile);
  } catch (error) {
    console.error(error);
    profileContainerEl.innerHTML = '<p class="text-center">Unable to load the profile right now.</p>';
    profileEditorContainerEl.innerHTML = '';
  }
}

init();
