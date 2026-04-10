import { spinnerRender } from '../utilities/spinner.js';

const btnContainerEl = document.querySelector('.btn-container');
const headingEl = document.querySelector('.heading h1');
const params = new URLSearchParams(window.location.search);
const departmentId = params.get('department') ?? 'cse';
const batchStart = params.get('batchStart');
const batchEnd = params.get('batchEnd');
const section = params.get('section') ?? 'A';

async function fetchRollNumbers() {
  const search = new URLSearchParams({ section });

  if (batchStart) {
    search.set('batchStart', batchStart);
  }

  if (batchEnd) {
    search.set('batchEnd', batchEnd);
  }

  const response = await fetch(`/api/departments/${departmentId}/rollnumbers?${search.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to load roll numbers: ${response.status}`);
  }

  return response.json();
}

function renderRollNumbers({ rollNumbers, batchLabel }) {
  headingEl.textContent = `Roll Numbers${batchLabel ? ` for ${batchLabel}` : ''} ${section}`.trim();
  btnContainerEl.innerHTML = rollNumbers
    .map(
      (student) => `
        <a class="no-decoration" href="profile.html?rollNumber=${encodeURIComponent(student.rollNumber)}">
          <button type="button" class="btn btn-outline-primary cse-button">${student.rollNumber}</button>
        </a>
      `,
    )
    .join('');
}

async function init() {
  spinnerRender(btnContainerEl);

  try {
    const data = await fetchRollNumbers();
    renderRollNumbers(data);
  } catch (error) {
    console.error(error);
    btnContainerEl.innerHTML = '<p class="text-center">Unable to load roll numbers right now.</p>';
  }
}

init();
