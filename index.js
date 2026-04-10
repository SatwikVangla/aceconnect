import { spinnerRender } from './utilities/spinner.js';

const bodyEl = document.body;

const fallbackDepartments = [
  {
    id: 'cse',
    name: 'Computer Science and Engineering',
    shortName: 'CSE',
    image: './images/CSE-230x230.jpeg',
    route: './cse/cse.html?department=cse',
    description: 'Browse batches, sections, roll numbers, and sample alumni profiles.',
  },
];

async function fetchDepartments() {
  const response = await fetch('/api/departments');

  if (!response.ok) {
    throw new Error(`Failed to load departments: ${response.status}`);
  }

  return response.json();
}

function renderPage(departments) {
  bodyEl.innerHTML = `
    <nav class="navbar bg-primary">
      <div class="container">
        <a class="navbar-brand" href="./index.html">
          <img src="./images/AceCollege.png" alt="Ace Connect logo" width="30" height="30" class="navbar-image">
          <span class="navbar-text">ACECONNECT</span>
        </a>
      </div>
    </nav>

    <main class="page-shell">
      <section class="heading">
        <h1>Departments</h1>
        <p class="subheading">Frontend repaired and connected to a backend API.</p>
      </section>

      <section class="department-container">
        ${departments
          .map(
            (department) => `
              <a class="department-card no-decoration" href="${department.route}">
                <img src="${department.image}" alt="${department.name}" class="department-image">
                <h2>${department.shortName}</h2>
                <p>${department.name}</p>
                <span>${department.description}</span>
              </a>
            `,
          )
          .join('')}
      </section>
    </main>

    <footer class="footer-class">
      Copyright &#169; Ace Connect
    </footer>
  `;
}

async function init() {
  spinnerRender(bodyEl);

  try {
    const departments = await fetchDepartments();
    renderPage(departments);
  } catch (error) {
    console.error(error);
    renderPage(fallbackDepartments);
  }
}

init();
