import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlitePath = path.join(__dirname, 'aceconnect.sqlite');
const seedPath = path.join(__dirname, 'seed-data.json');

let db;

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

function ensureDbConnection() {
  if (db) {
    return db;
  }

  db = new DatabaseSync(sqlitePath);
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      image TEXT NOT NULL,
      route TEXT NOT NULL,
      description TEXT NOT NULL,
      code_prefix TEXT NOT NULL,
      default_batch_start INTEGER NOT NULL,
      default_section TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      roll_number TEXT PRIMARY KEY,
      image_src TEXT NOT NULL,
      name TEXT NOT NULL,
      qualifications TEXT NOT NULL,
      address TEXT NOT NULL,
      website TEXT NOT NULL,
      github TEXT NOT NULL,
      twitter TEXT NOT NULL,
      instagram TEXT NOT NULL,
      facebook TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      mobile TEXT NOT NULL,
      section TEXT NOT NULL,
      department_id TEXT NOT NULL,
      batch_start INTEGER NOT NULL,
      bio TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
  `);

  return db;
}

function mapDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    image: row.image,
    route: row.route,
    description: row.description,
    codePrefix: row.code_prefix,
    defaultBatchStart: row.default_batch_start,
    defaultSection: row.default_section,
  };
}

function mapProfile(row) {
  return {
    rollNumber: row.roll_number,
    imageSrc: row.image_src,
    name: row.name,
    qualifications: row.qualifications,
    address: row.address,
    website: row.website,
    github: row.github,
    twitter: row.twitter,
    instagram: row.instagram,
    facebook: row.facebook,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    section: row.section,
    departmentId: row.department_id,
    batchStart: row.batch_start,
    bio: row.bio,
  };
}

async function ensureDb() {
  await mkdir(__dirname, { recursive: true });
  const database = ensureDbConnection();
  const counts = database.prepare(`
    SELECT
      (SELECT COUNT(*) FROM departments) AS departments_count,
      (SELECT COUNT(*) FROM sections) AS sections_count,
      (SELECT COUNT(*) FROM profiles) AS profiles_count
  `).get();

  if (
    counts.departments_count > 0 &&
    counts.sections_count > 0 &&
    counts.profiles_count > 0
  ) {
    return database;
  }

  const rawSeed = await readFile(seedPath, 'utf8');
  const seed = JSON.parse(rawSeed);
  const insertDepartment = database.prepare(`
    INSERT OR REPLACE INTO departments (
      id, name, short_name, image, route, description, code_prefix, default_batch_start, default_section
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSection = database.prepare(`
    INSERT OR REPLACE INTO sections (id, name) VALUES (?, ?)
  `);
  const insertProfile = database.prepare(`
    INSERT OR REPLACE INTO profiles (
      roll_number, image_src, name, qualifications, address, website, github, twitter, instagram,
      facebook, full_name, email, phone, mobile, section, department_id, batch_start, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    database.exec('BEGIN');

    for (const department of seed.departments) {
      insertDepartment.run(
        department.id,
        department.name,
        department.shortName,
        department.image,
        department.route,
        department.description,
        department.codePrefix,
        department.defaultBatchStart,
        department.defaultSection,
      );
    }

    for (const section of seed.sections) {
      insertSection.run(section.id, section.name);
    }

    for (const [rollNumber, profile] of Object.entries(seed.profiles)) {
      insertProfile.run(
        rollNumber,
        profile.imageSrc,
        profile.name,
        profile.qualifications,
        profile.address,
        profile.website,
        profile.github,
        profile.twitter,
        profile.instagram,
        profile.facebook,
        profile.fullName,
        profile.email,
        profile.phone,
        profile.mobile,
        profile.section,
        profile.departmentId,
        profile.batchStart,
        profile.bio,
      );
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  return database;
}

async function getDepartments() {
  const database = await ensureDb();
  const rows = database.prepare(`
    SELECT id, name, short_name, image, route, description, code_prefix, default_batch_start, default_section
    FROM departments
    ORDER BY name
  `).all();

  return rows.map(mapDepartment);
}

async function getSections() {
  const database = await ensureDb();
  return database.prepare(`
    SELECT id, name
    FROM sections
    ORDER BY id
  `).all();
}

async function getDepartment(departmentId) {
  const database = await ensureDb();
  const row = database.prepare(`
    SELECT id, name, short_name, image, route, description, code_prefix, default_batch_start, default_section
    FROM departments
    WHERE id = ?
  `).get(departmentId);

  return row ? mapDepartment(row) : undefined;
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
  const database = await ensureDb();
  const conditions = [];
  const values = [];

  if (departmentId) {
    conditions.push('department_id = ?');
    values.push(departmentId);
  }

  if (batchStart) {
    conditions.push('batch_start = ?');
    values.push(Number(batchStart));
  }

  if (section) {
    conditions.push('section = ?');
    values.push(section);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT *
    FROM profiles
    ${whereClause}
    ORDER BY roll_number
  `).all(...values);

  return rows.map(mapProfile);
}

async function getProfile(rollNumber, metadata = {}) {
  const database = await ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM profiles
    WHERE roll_number = ?
  `).get(rollNumber);

  if (row) {
    return mapProfile(row);
  }

  return {
    rollNumber,
    ...createDefaultProfile({
      rollNumber,
      section: metadata.section,
      departmentId: metadata.departmentId,
      batchStart: metadata.batchStart,
    }),
  };
}

async function saveProfile(rollNumber, input) {
  const database = await ensureDb();
  const existing = database.prepare(`
    SELECT *
    FROM profiles
    WHERE roll_number = ?
  `).get(rollNumber);
  const merged = normalizeProfile(rollNumber, {
    ...(existing ? mapProfile(existing) : {}),
    ...input,
  });

  database.prepare(`
    INSERT OR REPLACE INTO profiles (
      roll_number, image_src, name, qualifications, address, website, github, twitter, instagram,
      facebook, full_name, email, phone, mobile, section, department_id, batch_start, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rollNumber,
    merged.imageSrc,
    merged.name,
    merged.qualifications,
    merged.address,
    merged.website,
    merged.github,
    merged.twitter,
    merged.instagram,
    merged.facebook,
    merged.fullName,
    merged.email,
    merged.phone,
    merged.mobile,
    merged.section,
    merged.departmentId,
    merged.batchStart,
    merged.bio,
  );

  return {
    rollNumber,
    ...merged,
  };
}

async function seedGeneratedProfiles({ departmentId = 'cse', batchStart = 2022, section = 'A' } = {}) {
  const database = await ensureDb();
  const students = await getRollNumbers(departmentId, batchStart, section);
  const existingRollNumbers = new Set(
    database.prepare(`
      SELECT roll_number
      FROM profiles
      WHERE department_id = ? AND batch_start = ? AND section = ?
    `).all(departmentId, Number(batchStart), section).map((row) => row.roll_number),
  );
  const insertProfile = database.prepare(`
    INSERT OR REPLACE INTO profiles (
      roll_number, image_src, name, qualifications, address, website, github, twitter, instagram,
      facebook, full_name, email, phone, mobile, section, department_id, batch_start, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let created = 0;

  try {
    database.exec('BEGIN');

    for (const student of students) {
      if (existingRollNumbers.has(student.rollNumber)) {
        continue;
      }

      const profile = createDefaultProfile(student);
      insertProfile.run(
        student.rollNumber,
        profile.imageSrc,
        profile.name,
        profile.qualifications,
        profile.address,
        profile.website,
        profile.github,
        profile.twitter,
        profile.instagram,
        profile.facebook,
        profile.fullName,
        profile.email,
        profile.phone,
        profile.mobile,
        profile.section,
        profile.departmentId,
        profile.batchStart,
        profile.bio,
      );
      created += 1;
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  return {
    created,
    total: students.length,
    storage: existsSync(sqlitePath) ? 'sqlite' : 'unknown',
  };
}

async function getStorageInfo() {
  await ensureDb();

  return {
    engine: 'sqlite',
    path: sqlitePath,
    seedPath,
  };
}

export {
  getBatches,
  getDepartment,
  getDepartments,
  getProfile,
  getRollNumbers,
  getSections,
  getStorageInfo,
  listProfiles,
  saveProfile,
  seedGeneratedProfiles,
};
