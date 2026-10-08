// Test nickname normalization and claim outcomes without real player registrations.
import test from 'node:test';
// Use strict assertions to catch accidental ownership assumptions.
import assert from 'node:assert/strict';
// Exercise the production name validation and atomic RPC wrapper.
import {validatePlayerName,claimPlayerName,playerError} from '../src/playerNames.js';
// Exercise the production validator for server-returned medal eligibility.
import {topTenMedal} from '../src/medal.js';
// Capitalization and whitespace cannot create alternative copies of the same username.
test('nickname normalization matches case-insensitive ownership',()=>{
  // Display casing is preserved while spacing is normalized.
  assert.deepEqual(validatePlayerName('  Festac   Rider '),{name:'Festac Rider',key:'festac rider',error:''});
  // Case variants map to exactly the same unique key.
  assert.equal(validatePlayerName('Ada').key,validatePlayerName('ada').key);
  // Allow short simple names but reject ambiguous unsupported characters and oversized input.
  for(const name of ['', '   ', '-Ada', '💥', '<script>', 'a'.repeat(17)])assert.ok(validatePlayerName(name).error);
  // The maximum supported display name remains valid.
  assert.equal(validatePlayerName('a'.repeat(16)).error,'');
// Finish name format coverage.
});
// Only the protected server call establishes that a username belongs to this guest.
test('claim uses one atomic RPC and never accepts a caller-supplied identity',async()=>{
  // Capture the exact server operation without creating a real guest.
  const calls=[], client={rpc:async(...args)=>{calls.push(args);return {data:'Ada',error:null};}};
  // Whitespace is normalized before the mutation is sent.
  assert.deepEqual(await claimPlayerName(client,' Ada '),{name:'Ada',error:''});
  // The browser must not supply a user ID or first read an availability table.
  assert.deepEqual(calls,[['claim_moruwa_name',{p_name:'Ada'}]]);
  // Invalid local input must not create any server mutation.
  await claimPlayerName(client,'!');assert.equal(calls.length,1);
// Finish the claim contract test.
});
// Name conflicts and offline failures must never appear as successful reservations.
test('taken, legacy and unavailable claims stay actionable errors',async()=>{
  // A database conflict does not return an owned nickname.
  const conflict=await claimPlayerName({rpc:async()=>({error:{message:'NAME_TAKEN'}})},'Ada');
  // Explain that choosing a different name is necessary.
  assert.match(conflict.error,/already taken/);assert.equal(conflict.name,undefined);
  // Legacy names cannot silently transfer historical scores to a new guest.
  assert.match(playerError({message:'LEGACY_NAME_RESERVED'}),/reserved/);
  // A missing migration must not fall back to unrestricted table writes.
  assert.match(playerError({code:'PGRST202'}),/not available/);
  // Network exceptions remain retryable errors.
  const offline=await claimPlayerName({rpc:async()=>{throw Error('offline');}},'Ada');assert.ok(offline.error);assert.equal(offline.name,undefined);
// Finish failure coverage.
});
// Award podium medals and top-ten badges only for valid server ranking results.
test('medals distinguish podium positions and reject non-top-ten results',()=>{
  // Cover every valid rank and its expected numeric normalization.
  for(let rank=1;rank<=10;rank++){const medal=topTenMedal({rank:String(rank),score:500,player_name:'Ada'});assert.equal(medal.rank,rank);assert.equal(medal.name,'Ada');}
  // Invalid or missing ranks must not open a celebration.
  for(const rank of [0,11,-1,1.5,NaN,Infinity,null])assert.equal(topTenMedal({rank,score:500,player_name:'Ada'}),null);
  // Invalid scores cannot appear in a shareable certificate.
  assert.equal(topTenMedal({rank:1,score:-1,player_name:'Ada'}),null);
  // Distinguish gold, silver, bronze and remaining top-ten finishes.
  assert.equal(new Set([1,2,3,4].map(rank=>topTenMedal({rank,score:1,player_name:'Ada'}).colour)).size,4);
// Finish achievement validation.
});
