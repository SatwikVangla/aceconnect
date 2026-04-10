import { spinnerRender } from '../utilities/spinner.js';

const btnContainerEl = document.querySelector('.btn-container');
const params = new URLSearchParams(window.location.search);
const departmentId = params.get('department') ?? 'cse';

async function fetchBatches() {
  const response = await fetch(`/api/departments/${departmentId}/batches`);

  if (!response.ok) {
    throw new Error(`Failed to load batches: ${response.status}`);
  }

  return response.json();
}

function renderBatches({ batches }) {
  btnContainerEl.innerHTML = batches
    .map(
      (batch) => `
        <a class="no-decoration" href="sections.html?department=${departmentId}&batchStart=${batch.startYear}&batchEnd=${batch.endYear}">
          <button type="button" class="btn btn-outline-primary cse-button">${batch.label}</button>
        </a>
      `,
    )
    .join('');
}

async function init() {
  spinnerRender(btnContainerEl);

  try {
    const data = await fetchBatches();
    renderBatches(data);
  } catch (error) {
    console.error(error);
    btnContainerEl.innerHTML = '<p class="text-center">Unable to load batches right now.</p>';
  }
}

init();
