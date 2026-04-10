import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const defaultDb = {
  departments: [
    {
      id: 'cse',
      name: 'Computer Science and Engineering',
      shortName: 'CSE',
      image: '/images/CSE-230x230.jpeg',
      route: '/cse/cse.html?department=cse',
      description: 'Batch browser with sections, roll numbers, and profile data.',
      codePrefix: 'AG1A0',
      defaultBatchStart: 2022,
      defaultSection: 'A',
    },
  ],
  sections: [
    { id: 'A', name: 'Section A' },
    { id: 'B', name: 'Section B' },
    { id: 'C', name: 'Section C' },
  ],
  profiles: {
    '22AG1A0501': {
      imageSrc: 'https://bootdey.com/img/Content/avatar/avatar7.png',
      name: '22AG1A0501',
      qualifications: 'Full Stack Developer',
      address: 'Bay Area, San Francisco, CA',
      website: 'https://bootdey.com',
      github: 'bootdey',
      twitter: '@bootdey',
      instagram: 'bootdey',
      facebook: 'bootdey',
      fullName: 'Student 22AG1A0501',
      email: '22ag1a0501@aceconnect.dev',
      phone: '(239) 816-9029',
      mobile: '(320) 380-4539',
      section: 'A',
      departmentId: 'cse',
      batchStart: 2022,
      bio: 'Sample alumni profile stored in the backend JSON database.',
    },
  },
};

async function ensureDb() {
  try {
    await readFile(dbPath, 'utf8');
  } catch {
    await writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data) {
  await writeFile(dbPath, JSON.stringify(data, null, 2));
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

function createDefaultProfile({ rollNumber, section = 'A', departmentId = 'cse', batchStart = 2022 }) {
  return {
    imageSrc: 'https://bootdey.com/img/Content/avatar/avatar7.png',
    name: rollNumber,
    qualifications: 'Student',
    address: 'Update address',
    website: '',
    github: '',
    twitter: '',
    instagram: '',
    facebook: '',
    fullName: `Student ${rollNumber}`,
    email: `${rollNumber.toLowerCase()}@aceconnect.dev`,
    phone: '',
    mobile: '',
    section,
    departmentId,
    batchStart,
    bio: 'New backend-backed profile.',
  };
}

function normalizeProfile(rollNumber, input) {
  return {
    imageSrc: input.imageSrc?.trim() || 'https://bootdey.com/img/Content/avatar/avatar7.png',
    name: input.name?.trim() || rollNumber,
    qualifications: input.qualifications?.trim() || 'Student',
    address: input.address?.trim() || '',
    website: input.website?.trim() || '',
    github: input.github?.trim() || '',
    twitter: input.twitter?.trim() || '',
    instagram: input.instagram?.trim() || '',
    facebook: input.facebook?.trim() || '',
    fullName: input.fullName?.trim() || `Student ${rollNumber}`,
    email: input.email?.trim() || `${rollNumber.toLowerCase()}@aceconnect.dev`,
    phone: input.phone?.trim() || '',
    mobile: input.mobile?.trim() || '',
    section: input.section?.trim() || 'A',
    departmentId: input.departmentId?.trim() || 'cse',
    batchStart: Number(input.batchStart) || 2022,
    bio: input.bio?.trim() || '',
  };
}

async function getDepartments() {
  const db = await readDb();
  return db.departments;
}

async function getSections() {
  const db = await readDb();
  return db.sections;
}

async function getDepartment(departmentId) {
  const departments = await getDepartments();
  return departments.find((department) => department.id === departmentId);
}

async function getRollNumbers(departmentId, batchStart, section = 'A') {
  const department = await getDepartment(departmentId);

  if (!department) {
    return [];
  }

  const safeBatchStart = Number(batchStart) || department.defaultBatchStart || 2022;
  const yearCode = String(safeBatchStart).slice(-2);
  const baseCode = `${yearCode}${department.codePrefix}`;
  const lateralCode = `${String(safeBatchStart + 1).slice(-2)}${department.codePrefix}`;
  const students = [];

  for (let index = 0; index < 70; index += 1) {
    const sequence = 501 + (index < 64 ? index : index - 64);
    const rollNumber = `${index < 64 ? baseCode : lateralCode}${sequence}`;

    students.push({
      rollNumber,
      section,
      departmentId,
      batchStart: safeBatchStart,
    });
  }

  return students;
}

async function listProfiles({ departmentId, batchStart, section } = {}) {
  const db = await readDb();
  const entries = Object.entries(db.profiles).map(([rollNumber, profile]) => ({
    rollNumber,
    ...profile,
  }));

  return entries.filter((profile) => {
    if (departmentId && profile.departmentId !== departmentId) {
      return false;
    }

    if (batchStart && Number(profile.batchStart) !== Number(batchStart)) {
      return false;
    }

    if (section && profile.section !== section) {
      return false;
    }

    return true;
  });
}

async function getProfile(rollNumber, metadata = {}) {
  const db = await readDb();
  const existing = db.profiles[rollNumber];

  if (existing) {
    return {
      rollNumber,
      ...existing,
    };
  }

  const generated = createDefaultProfile({
    rollNumber,
    section: metadata.section,
    departmentId: metadata.departmentId,
    batchStart: metadata.batchStart,
  });

  return {
    rollNumber,
    ...generated,
  };
}

async function saveProfile(rollNumber, input) {
  const db = await readDb();
  const merged = normalizeProfile(rollNumber, {
    ...db.profiles[rollNumber],
    ...input,
  });

  db.profiles[rollNumber] = merged;
  await writeDb(db);

  return {
    rollNumber,
    ...merged,
  };
}

async function seedGeneratedProfiles({ departmentId = 'cse', batchStart = 2022, section = 'A' } = {}) {
  const db = await readDb();
  const students = await getRollNumbers(departmentId, batchStart, section);
  let created = 0;

  for (const student of students) {
    if (!db.profiles[student.rollNumber]) {
      db.profiles[student.rollNumber] = createDefaultProfile(student);
      created += 1;
    }
  }

  if (created > 0) {
    await writeDb(db);
  }

  return {
    created,
    total: students.length,
  };
}

export {
  getBatches,
  getDepartment,
  getDepartments,
  getProfile,
  getRollNumbers,
  getSections,
  listProfiles,
  saveProfile,
  seedGeneratedProfiles,
};
