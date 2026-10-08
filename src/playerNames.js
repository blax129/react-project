// Match database normalization so capitalization cannot bypass a claimed name.
export function validatePlayerName(value) {
  // Remove outer spaces and collapse repeated spaces.
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  // Keep public names short and readable across mobile leaderboards.
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$/.test(name)) return {error:'Use 1–16 letters, numbers, spaces or hyphens. Start with a letter or number.'};
  // Preserve display capitalization while exposing the uniqueness key for comparisons.
  return {name, key:name.toLowerCase(), error:''};
// Finish nickname validation.
}
// Translate database outcomes into useful player-facing instructions.
export function playerError(error) {
  // Database error messages are inspected but never displayed as raw setup details.
  const message = String(error?.message || '');
  // Explain an atomic first-claim loss without suggesting a capitalization bypass.
  if (message.includes('NAME_TAKEN')) return 'That name is already taken. Choose another name.';
  // Historic scores lack account ownership, so they cannot safely be claimed automatically.
  if (message.includes('LEGACY_NAME_RESERVED')) return 'That name belongs to the old leaderboard and is reserved. Choose another name for now.';
  // Names are permanent once successfully attached to an account.
  if (message.includes('NAME_ALREADY_OWNED')) return 'This browser already owns a name. Refresh your profile to see it.';
  // Explain the required account state for protected calls.
  if (message.includes('SIGN_IN_REQUIRED')) return 'Choose a username to save shared scores.';
  // Explain why score submission is blocked for a new account.
  if (message.includes('CLAIM_NAME_FIRST')) return 'Claim your player name before saving a shared score.';
  // Handle invalid direct API calls just as clearly as client-side validation.
  if (message.includes('INVALID_NAME')) return validatePlayerName('').error;
  // Missing migrations must never appear as a successful name reservation.
  if (error?.code === 'PGRST202' || message.includes('schema cache')) return 'Shared usernames are not available yet. You can still practise as a guest.';
  // Keep temporary transport failures distinct from a name being taken.
  return 'Could not reach player registration. Check your connection and try again.';
// Finish the public error mapping.
}
// The server resolves simultaneous claims; never implement a read-then-write availability check.
export async function claimPlayerName(client, value) {
  // Validate before sending a network request.
  const checked = validatePlayerName(value);
  // Return local validation errors without claiming anything.
  if (checked.error) return {error:checked.error};
  // A missing backend cannot provide global uniqueness.
  if (!client) return {error:'Shared player names are not configured yet.'};
  // Convert a transport exception into a retryable result.
  try {
    // The identity comes from Supabase Auth, never a submitted user ID.
    const {data,error} = await client.rpc('claim_moruwa_name',{p_name:checked.name});
    // Only a successful server response establishes ownership.
    return error ? {error:playerError(error)} : {name:data,error:''};
  // Preserve a useful error if the browser loses connectivity.
  } catch (error) { return {error:playerError(error)}; }
// Finish atomic name registration.
}
