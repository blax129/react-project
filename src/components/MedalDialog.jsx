// A native dialog presents a shareable top-ten achievement after the server confirms rank.
import { useEffect, useRef, useState } from 'react';
// Draw the same share card for screenshots, image downloads and native sharing.
import { paintMedal } from '../medal';
// Keep the actual public game destination in every share invitation.
const GAME_URL='https://luxury-tiramisu-26d2ae.netlify.app/';
// Render only when a saved score receives a top-ten rank from the database.
export default function MedalDialog({medal,onClose}) {
  // Keep the native dialog available for focus management.
  const dialog=useRef(null);
  // Prepare the image and file before the user taps Share, preserving mobile user activation.
  const [image,setImage]=useState(''),[file,setFile]=useState(null),[message,setMessage]=useState('');
  // Generate a fresh card for the server-returned achievement.
  useEffect(()=>{
    // Ignore asynchronous blob work if the card closes or changes.
    let live=true; const canvas=document.createElement('canvas'); paintMedal(canvas,medal);
    // The same PNG appears in the popup and saved image.
    setImage(canvas.toDataURL('image/png'));setFile(null);setMessage('');
    // Build the shareable file ahead of the tap, not after an awaited network request.
    canvas.toBlob(blob=>{if(live&&blob)setFile(new File([blob],'korope-top-10.png',{type:'image/png'}));},'image/png');
    // Show the modal once its element is mounted.
    if(!dialog.current.open)dialog.current.showModal();
    // Prevent stale blob results from replacing the current card.
    return()=>{live=false;};
  // A new medal produces a new image and rank timestamp.
  },[medal]);
  // Open the phone's share sheet when supported, with a useful link-only fallback.
  async function share() {
    // Share only after the player's explicit button press.
    try {
      // Include the original PNG when this browser supports file sharing.
      if(file&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'My Road Clear top-ten medal',text:`${medal.name}: #${medal.rank} with ${medal.score} points. Can you beat me? ${GAME_URL}`});
      // Some desktop browsers can share text and links but cannot share files.
      else if(navigator.share)await navigator.share({title:'My Road Clear medal',text:`I'm #${medal.rank} with ${medal.score} points. Can you beat me?`,url:GAME_URL});
      // Always leave the visible image available for a screenshot or download.
      else setMessage('Use Save medal below, or take a screenshot and send it to your friends.');
    // Cancelling the share sheet is normal and needs no error message.
    }catch(error){if(error.name!=='AbortError')setMessage('Sharing is unavailable here. Save the medal or take a screenshot instead.');}
  // Finish the explicit share action.
  }
  // Show the badge itself prominently, with controls outside the exported artwork.
  return <dialog className="medal-dialog" ref={dialog} aria-labelledby="medal-title" onClose={onClose}>
    {/* Announce the achievement separately from the decorative artwork. */}
    <h2 id="medal-title">You made the top 10!</h2>
    {/* A plain image remains easy to screenshot or save through the phone's image menu. */}
    {image&&<img className="medal-card" src={image} alt={`${medal.name}, rank ${medal.rank}, personal best ${medal.score} points. ${medal.title}.`}/>}
    {/* Let players use native sharing, download, or dismiss without losing their score. */}
    <div className="actions"><button className="button" type="button" onClick={share}>Share medal</button>{image&&<a className="button ghost" href={image} download="korope-top-10.png">Save medal</a>}<button className="button ghost" type="button" onClick={()=>dialog.current.close()}>Done</button></div>
    {/* Explain browser share limitations only when a share attempt fails. */}
    {message&&<p role="status">{message}</p>}
  {/* Finish the achievement popup. */}
  </dialog>;
// Finish the screenshot-friendly medal component.
}
