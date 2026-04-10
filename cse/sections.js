import { spinnerRender } from '../utilities/spinner.js';

const btnContainerEl = document.querySelector('.btn-container');
const headingEl = document.querySelector('.heading h1');
const params = new URLSearchParams(window.location.search);
const departmentId = params.get('department') ?? 'cse';
const batchStart = params.get('batchStart');
const batchEnd = params.get('batchEnd');

async function fetchSections() {
  const search = new URLSearchParams();

  if (batchStart) {
    search.set('batchStart', batchStart);
  }

  if (batchEnd) {
    search.set('batchEnd', batchEnd);
  }

  const response = await fetch(`/api/departments/${departmentId}/sections?${search.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to load sections: ${response.status}`);
  }

  return response.json();
}

function renderSections({ sections, batchLabel }) {
  headingEl.textContent = `Sections${batchLabel ? ` for ${batchLabel}` : ''}`;
  btnContainerEl.innerHTML = sections
    .map((section) => {
      const search = new URLSearchParams({
        department: departmentId,
        section: section.id,
      });

      if (batchStart) {
        search.set('batchStart', batchStart);
      }

      if (batchEnd) {
        search.set('batchEnd', batchEnd);
      }

      return `
        <a class="no-decoration" href="rollnumber.html?${search.toString()}">
          <button type="button" class="btn btn-outline-primary cse-button">${section.name}</button>
        </a>
      `;
    })
    .join('');
}

async function init() {
  spinnerRender(btnContainerEl);

  try {
    const data = await fetchSections();
    renderSections(data);
  } catch (error) {
    console.error(error);
    btnContainerEl.innerHTML = '<p class="text-center">Unable to load sections right now.</p>';
  }
}

init();
