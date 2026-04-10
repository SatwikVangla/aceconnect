export async function fetchProfile(rollNumber, options = {}) {
  const search = new URLSearchParams();

  if (options.departmentId) {
    search.set('departmentId', options.departmentId);
  }

  if (options.batchStart) {
    search.set('batchStart', String(options.batchStart));
  }

  if (options.section) {
    search.set('section', options.section);
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  const response = await fetch(`/api/profiles/${encodeURIComponent(rollNumber)}${suffix}`);

  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status}`);
  }

  return response.json();
}
