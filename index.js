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

async function fetchCurrentUser() {
  const response = await fetch('/api/auth/me');

  if (!response.ok) {
    throw new Error(`Failed to load current user: ${response.status}`);
  }

  return response.json();
}

function renderPage(departments, session) {
  const quickLinks = [
    {
      href: './cse/cse.html?department=cse',
      label: 'Browse CSE Cohorts',
      detail: 'Start the student browsing flow from the homepage.',
    },
    {
      href: './cse/profile.html?rollNumber=22AG1A0501&departmentId=cse&batchStart=2022&section=A',
      label: 'Open Sample Profile',
      detail: 'Jump directly to the seeded profile and editor screen.',
    },
    {
      href: './cse/admin.html',
      label: 'Open Admin Dashboard',
      detail: session?.user?.role === 'admin'
        ? `Signed in as ${session.user.fullName}. Open student and user management.`
        : 'Go straight to login, user management, and student CRUD.',
    },
  ];

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
        <p class="subheading">Frontend repaired and connected to a backend API with sessions, admin tools, and student CRUD.</p>
      </section>

      <section class="quick-links-shell">
        <div class="quick-links-header">
          <div>
            <h2>Quick Access</h2>
            <p>${session?.user ? `Signed in as ${session.user.fullName} (${session.user.role}).` : 'Use these shortcuts to reach the main app flows.'}</p>
          </div>
        </div>
        <div class="quick-links-grid">
          ${quickLinks
            .map(
              (link) => `
                <a class="quick-link-card no-decoration" href="${link.href}">
                  <strong>${link.label}</strong>
                  <span>${link.detail}</span>
                </a>
              `,
            )
            .join('')}
        </div>
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
    const [departments, session] = await Promise.all([
      fetchDepartments(),
      fetchCurrentUser().catch(() => ({ user: null })),
    ]);
    renderPage(departments, session);
  } catch (error) {
    console.error(error);
    renderPage(fallbackDepartments, { user: null });
  }
}

init();
