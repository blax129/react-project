// All private-room operations use the existing guest session and server membership checks.
import {supabase} from './supabaseClient';
// Keep manually entered invitation codes case-insensitive.
export const cleanRoomCode=value=>String(value||'').trim().toUpperCase();
// Prefer the current origin so local testing and production invites both work.
export const roomInvite = (code) => {
  // Fall back to the published Netlify site when no browser origin exists.
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://luxury-tiramisu-26d2ae.netlify.app";
  // Encode the private room code in the join link.
  return `${origin}/?room=${encodeURIComponent(cleanRoomCode(code))}`;
};
// Convert backend errors into concise lobby instructions.
export function roomError(error) {
  // Named server outcomes are safe to interpret without displaying raw SQL diagnostics.
  const value=String(error?.message||'');
  // Each failure suggests a specific action while preserving the current room.
  const messages={CLAIM_NAME_FIRST:'Choose a username before joining a private race.',ROOM_NOT_FOUND:'That room does not exist or its invitation has expired.',ROOM_FULL:'That room already has two players.',NOT_A_ROOM_MEMBER:'This private room belongs to two other players.',RACE_ALREADY_STARTED:'This race has already started. Ask the host for a new room.',HOST_ONLY:'Only the host can do that.',BOTH_PLAYERS_MUST_BE_READY:'Both players must be ready and connected.',PROGRESS_TOO_FAST:'Race synchronization paused. Reconnect from your last checkpoint.',INVALID_PROGRESS:'Could not synchronize your position. Rejoin to recover at your checkpoint.'};
  // Match only known server error tokens.
  for(const [key,message] of Object.entries(messages))if(value.includes(key))return message;
  // Missing migration is distinct from an invalid room invitation.
  if(error?.code==='PGRST202')return 'Private races are not available yet. Please try again shortly.';
  // Keep network failures retryable instead of silently ending the race.
  return 'Connection interrupted. Reconnecting to the private room…';
// Finish error mapping.
}
// Send a single, bounded room operation and estimate the server clock offset.
export async function roomAction(action,code,vehicle='korope',state={}) {
  // No local-only fallback can create a genuine multiplayer room.
  if(!supabase)throw Error('Private races need the shared game connection.');
  // The midpoint estimate compensates for ordinary request latency during countdown.
  const before=Date.now();
  // The server derives the current player from the authenticated guest token.
  const {data,error}=await supabase.rpc('road_clear_room',{p_action:action,p_code:code||null,p_vehicle:vehicle,p_state:state});
  // Preserve error codes for the UI's actionable mapping.
  if(error)throw error;
  // Include a local receipt time so the canvas can freeze after connection loss.
  return {...data,clockOffset:new Date(data.server_now).getTime()-(before+Date.now())/2,receivedAt:Date.now()};
// Finish the room API wrapper.
}
