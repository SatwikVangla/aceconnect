const departments = [
  {
    id: 'cse',
    name: 'Computer Science and Engineering',
    shortName: 'CSE',
    image: '/images/CSE-230x230.jpeg',
    route: '/cse/cse.html?department=cse',
    description: 'Batch browser with sections, roll numbers, and profile data.',
  },
];

const sections = [
  { id: 'A', name: 'Section A' },
  { id: 'B', name: 'Section B' },
  { id: 'C', name: 'Section C' },
];

function getDepartment(departmentId) {
  return departments.find((department) => department.id === departmentId);
}

function getBatches() {
  const currentYear = new Date().getFullYear();
  const startYear = 2007;
  const batches = [];

  for (let year = currentYear - 1; year >= startYear; year -= 1) {
    batches.push({
      startYear: year,
      endYear: year + 4,
      label: `${year} - ${year + 4}`,
    });
  }

  return batches;
}

function getRollNumbers(batchStart, section = 'A') {
  const safeBatchStart = Number(batchStart) || 2022;
  const yearCode = String(safeBatchStart).slice(-2);
  const baseCode = `${yearCode}AG1A0`;
  const lateralCode = `${(safeBatchStart + 1).toString().slice(-2)}AG1A0`;
  const students = [];

  for (let index = 0; index < 70; index += 1) {
    const sequence = 501 + (index < 64 ? index : index - 64);
    const value = `${index < 64 ? baseCode : lateralCode}${sequence}`;

    students.push({
      rollNumber: value,
      section,
    });
  }

  return students;
}

function getProfile(rollNumber) {
  const section = rollNumber?.includes('B') ? 'B' : rollNumber?.includes('C') ? 'C' : 'A';

  return {
    imageSrc: 'https://bootdey.com/img/Content/avatar/avatar7.png',
    name: rollNumber ?? 'John Doe',
    qualifications: 'Full Stack Developer',
    address: 'Bay Area, San Francisco, CA',
    website: 'https://bootdey.com',
    github: 'bootdey',
    twitter: '@bootdey',
    instagram: 'bootdey',
    facebook: 'bootdey',
    fullName: `Student ${rollNumber ?? 'Profile'}`,
    email: `${(rollNumber ?? 'student').toLowerCase()}@aceconnect.dev`,
    phone: '(239) 816-9029',
    mobile: '(320) 380-4539',
    rollNumber,
    section,
  };
}

export { departments, getDepartment, getBatches, getRollNumbers, getProfile, sections };
