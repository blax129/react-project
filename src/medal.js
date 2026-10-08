// Only a valid server-issued top-ten result can open a leaderboard medal.
export function topTenMedal(row) {
  // Reject missing rows and out-of-range ranks rather than inventing a position.
  if(!row||!Number.isInteger(Number(row.rank))||Number(row.rank)<1||Number(row.rank)>10)return null;
  // Keep corrupted scores or labels out of the share card.
  if(!Number.isInteger(row.score)||row.score<0||row.score>999999||typeof row.player_name!=='string'||!row.player_name.trim()||row.player_name.length>16)return null;
  // Use distinct finishes for the podium and the remaining top-ten players.
  return {name:row.player_name,score:row.score,rank:Number(row.rank),title:Number(row.rank)===1?'ROAD CHAMPION':Number(row.rank)<=3?'PODIUM FINISH':'TOP 10 DRIVER',colour:Number(row.rank)===1?'#ffd66f':Number(row.rank)===2?'#dde7ee':Number(row.rank)===3?'#dfaa7c':'#8bdbc5',at:new Date().toISOString()};
// Finish the trusted-result validator.
}
// Create an original, downloadable canvas medal with no external image requests.
export function paintMedal(canvas, medal) {
  // A portrait image is easy to screenshot or share in messaging apps.
  canvas.width=720; canvas.height=900;
  // Use built-in fonts so the exported image does not depend on font loading.
  const c=canvas.getContext('2d'), background=c.createLinearGradient(0,0,720,900);
  // A deep green background nods to the Nigerian setting.
  background.addColorStop(0,'#123d35'); background.addColorStop(1,'#091822'); c.fillStyle=background; c.fillRect(0,0,720,900);
  // Frame the achievement in the player's medal colour.
  c.strokeStyle=medal.colour; c.lineWidth=3; c.strokeRect(24,24,672,852);
  // Centre the typography consistently across all name lengths.
  c.textAlign='center'; c.fillStyle='#fff9e9'; c.font='bold 38px system-ui'; c.fillText('ROAD CLEAR',360,96);
  // Identify this as a leaderboard achievement, not a generic completion badge.
  c.font='18px system-ui'; c.fillStyle='#bbd9d0'; c.fillText('LAGOS ROADS · SHARED LEADERBOARD',360,133);
  // Paint two ribbon tails before the circular medal.
  c.fillStyle='#14856a'; c.beginPath(); c.moveTo(280,288);c.lineTo(242,456);c.lineTo(297,427);c.lineTo(328,475);c.lineTo(359,294);c.fill();
  // Mirror the ribbon on the right.
  c.fillStyle='#e6eedb'; c.beginPath();c.moveTo(360,294);c.lineTo(392,475);c.lineTo(423,427);c.lineTo(478,456);c.lineTo(440,288);c.fill();
  // A coloured disc distinguishes gold, silver, bronze and top-ten honours.
  c.fillStyle=medal.colour;c.beginPath();c.arc(360,290,112,0,Math.PI*2);c.fill();
  // Add an inset ring and a large earned rank.
  c.strokeStyle='#18382c';c.lineWidth=3;c.beginPath();c.arc(360,290,96,0,Math.PI*2);c.stroke();c.fillStyle='#15332c';c.font='900 76px system-ui';c.fillText(`#${medal.rank}`,360,312);
  // Name the class of achievement underneath its ribbon.
  c.fillStyle=medal.colour;c.font='bold 28px system-ui';c.fillText(medal.title,360,520);
  // Fit even the longest supported nickname within the share image.
  c.fillStyle='#fff9e9';c.font='bold 44px system-ui';c.fillText(medal.name,360,592,620);
  // Show the saved personal best that earned this ranking.
  c.font='900 64px system-ui';c.fillText(medal.score.toLocaleString(),360,679);
  // Describe the number so it cannot be confused with currency or distance units.
  c.fillStyle='#bbd9d0';c.font='20px system-ui';c.fillText('PERSONAL BEST · POINTS',360,714);
  // Rankings are a snapshot and can change as other players submit scores.
  c.font='16px system-ui';c.fillText(`Rank at ${new Date(medal.at).toLocaleString()}`,360,772,620);
  // Invite friends to challenge the result using the actual game address.
  c.fillStyle='#fff9e9';c.font='bold 23px system-ui';c.fillText('Can you beat my run?',360,818);
  // Include a readable destination even when the image is forwarded by itself.
  c.font='16px system-ui';c.fillText('luxury-tiramisu-26d2ae.netlify.app',360,850);
// Finish the original share-card artwork.
}
