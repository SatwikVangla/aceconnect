export async function fetchProfile(rollNumber) {
  const response = await fetch(`/api/profiles/${encodeURIComponent(rollNumber)}`);

  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status}`);
  }

  return response.json();
}
