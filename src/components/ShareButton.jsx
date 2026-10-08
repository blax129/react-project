import { useEffect, useRef, useState } from 'react';

const GAME_URL = 'https://luxury-tiramisu-26d2ae.netlify.app/';

export default function ShareButton() {
  const dialog = useRef(null);
  const linkField = useRef(null);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setError(false);
    import('qrcode').then(({ default: QRCode }) => QRCode.toDataURL(GAME_URL, {
      errorCorrectionLevel: 'M', margin: 4, scale: 10,
      color: { dark: '#000000', light: '#ffffff' },
    })).then(data => { if (active) setQr(data); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [open, attempt]);

  function show() {
    setStatus('');
    setOpen(true);
    dialog.current.showModal();
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(GAME_URL);
      setStatus('Link copied!');
    } catch {
      linkField.current.focus();
      linkField.current.select();
      setStatus('Select and copy the link above.');
    }
  }
  async function share() {
    try { await navigator.share({ title: 'Road Clear', text: 'How far can you drive? Try Road Clear!', url: GAME_URL }); }
    catch (error) { if (error.name !== 'AbortError') setStatus('Sharing is unavailable. Use Copy link instead.'); }
  }

  return <>
    <button className="button ghost" type="button" onClick={show}>Share game</button>
    <dialog className="share-dialog" ref={dialog} aria-labelledby="share-title" onClose={() => setOpen(false)}>
      <button className="share-close" type="button" aria-label="Close share dialog" onClick={() => dialog.current.close()}>×</button>
      <h2 id="share-title">Share the ride</h2>
      <p>Scan with your phone’s camera to open the game.</p>
      {qr ? <img className="share-qr" src={qr} alt="QR code linking to the Road Clear game" width="260" height="260" /> :
        <div className="share-qr-placeholder" role="status">{error ? <><p>Couldn’t create the QR code.</p><button type="button" className="button ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></> : 'Creating QR code…'}</div>}
      <label className="share-link-label" htmlFor="game-share-link">Game link</label>
      <input ref={linkField} id="game-share-link" className="share-link" readOnly value={GAME_URL} onFocus={event => event.target.select()} />
      <div className="share-actions">
        <button className="button" type="button" onClick={copyLink}>Copy link</button>
        {typeof navigator.share === 'function' && <button className="button ghost" type="button" onClick={share}>Send link</button>}
        {qr && <a className="button ghost" href={qr} download="korope-qr.png">Save QR</a>}
      </div>
      <p className="share-status" role="status">{status}</p>
    </dialog>
  </>;
}
