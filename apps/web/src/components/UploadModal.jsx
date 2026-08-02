import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const STAGES = [
  { id: 'idle',        label: 'Ready to upload' },
  { id: 'uploading',   label: 'Uploading to SafeDeck Drive...' },
  { id: 'processing',  label: 'AI is analyzing your deck...' },
  { id: 'done',        label: 'Deck added to dashboard!' },
  { id: 'error',       label: 'Something went wrong' },
];

const UploadModal = ({ onClose, onSuccess }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [stage, setStage] = useState('idle'); // idle | uploading | processing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      // Auto-fill company name from file name if empty
      if (!companyName) {
        setCompanyName(dropped.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleFileInput = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!companyName) {
        setCompanyName(selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !companyName.trim()) return;

    setStage('uploading');
    setErrorMsg('');

    try {
      const stored = JSON.parse(localStorage.getItem('safedeck_user') || '{}');
      const userEmail = stored.email || stored.user?.email || '';
      const accessToken = stored.user?.access_token || stored.access_token;
      
      if (!accessToken) {
        throw new Error("Google Drive access token missing. Please reconnect your account.");
      }

      const folderId = stored.driveFolderId || stored.user?.driveFolderId;

      // 1. Upload directly to Google Drive via multipart/related
      const metadata = {
        name: file.name
      };
      
      if (folderId && folderId !== '1ZkRCCzSECUSjDQlol5vgYaF-0_yqFkDl') {
        metadata.parents = [folderId];
      }

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const closeDelim = "\r\n--" + boundary + "--";

      const metadataBlob = new Blob([
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        delimiter,
        'Content-Type: ' + (file.type || 'application/pdf') + '\r\n\r\n'
      ], { type: 'text/plain' });

      const closeBlob = new Blob([closeDelim], { type: 'text/plain' });

      const multipartBody = new Blob([metadataBlob, file, closeBlob], {
        type: 'multipart/related; boundary=' + boundary
      });

      const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        body: multipartBody
      });

      if (!driveRes.ok) {
        const text = await driveRes.text();
        throw new Error(`Drive upload failed (${driveRes.status}): ${text}`);
      }

      const driveData = await driveRes.json();
      const fileId = driveData.id;

      // 2. Make file publicly accessible so backend Lambda can read it
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
      });

      // 3. POST metadata to n8n dashboard upload webhook
      const webhookUrl = import.meta.env.VITE_N8N_DASHBOARD_UPLOAD_WEBHOOK;
      if (!webhookUrl) {
        throw new Error('Upload endpoint not configured. Add VITE_N8N_DASHBOARD_UPLOAD_WEBHOOK to your .env file.');
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: fileId,
          fileName: file.name,
          companyName: companyName.trim(),
          userEmail,
          tenantSlug: stored.user?.email || stored.email,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed (${res.status}): ${text}`);
      }

      const result = await res.json();
      console.log('Upload result:', result);

      setStage('processing');

      // 4. Poll /audits until the new deck shows up as "Completed"
      const maxAttempts = 30; // ~3 minutes
      const pollInterval = 6000; // 6 seconds
      let attempts = 0;

      const poll = async () => {
        attempts++;
        try {
          const userId = stored.user?.user_id || stored.sub || stored.userId;
          const tenantId = stored.user?.user_id || stored.sub;

          const auditRes = await fetch('https://zh2feylzki.execute-api.eu-north-1.amazonaws.com/default/audits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_AWS_API_KEY,
            },
            body: JSON.stringify({ 
              userId: stored.user?.user_id || stored.sub,
              tenantId: stored.user?.user_id || stored.sub,
              email: stored.user?.email || stored.email,
            }),
          });

          if (auditRes.ok) {
            let data = await auditRes.json();
            if (data.body && typeof data.body === 'string') {
              try { data = JSON.parse(data.body); } catch {}
            }
            const decks = Array.isArray(data) ? data : [];
            const matching = decks.filter(
              d => d.company_name?.toLowerCase() === companyName.trim().toLowerCase()
                   || d.extracted_deck_data?.Company?.toLowerCase() === companyName.trim().toLowerCase()
            );

            if (matching.length > 0) {
              setStage('done');
              setTimeout(() => {
                onSuccess(matching[0]);
                onClose();
              }, 1500);
              return;
            }
          }

          if (attempts >= maxAttempts) {
            setStage('error');
            setErrorMsg('Processing timed out. Your deck has been uploaded and will appear shortly.');
            return;
          }

          setTimeout(poll, pollInterval);
        } catch (err) {
          console.error('Poll error:', err);
          if (attempts >= maxAttempts) {
            setStage('error');
            setErrorMsg(err.message || 'Polling failed. Check back on your dashboard shortly.');
          } else {
            setTimeout(poll, pollInterval);
          }
        }
      };

      // Give the pipeline a few seconds before starting to poll
      setTimeout(poll, 8000);

    } catch (err) {
      console.error('Upload error:', err);
      setStage('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  const currentStageIdx = STAGES.findIndex(s => s.id === stage);
  const isWorking = stage === 'uploading' || stage === 'processing';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(6,8,14,0.88)', backdropFilter: 'blur(14px)',
          zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '1.25rem',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 36, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '520px',
            background: 'var(--bg-secondary)', borderRadius: '22px',
            border: '1px solid rgba(139,92,246,0.22)',
            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.4rem 1.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📤</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Upload Pitch Deck</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.75rem' }}>

            {/* Drop zone */}
            {stage === 'idle' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '14px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  marginBottom: '1.25rem',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>
                  {file ? '📄' : '📂'}
                </div>
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{file.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      Drop your pitch deck PDF here
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      or click to browse · PDF only · Max 50MB
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected file preview (non-idle) */}
            {(stage === 'uploading' || stage === 'processing') && file && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                marginBottom: '1.25rem',
              }}>
                <FileText size={20} color="var(--accent-cyan)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              </div>
            )}

            {/* Company name input */}
            {stage === 'idle' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Company / Founder Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. NovaPay, Arjun Mehta"
                  style={{
                    width: '100%', padding: '0.7rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}

            {/* Upload button */}
            {stage === 'idle' && (
              <button
                onClick={handleUpload}
                disabled={!file || !companyName.trim()}
                style={{
                  width: '100%', padding: '0.85rem',
                  background: file && companyName.trim()
                    ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))'
                    : 'rgba(255,255,255,0.08)',
                  color: file && companyName.trim() ? 'white' : 'var(--text-secondary)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '0.95rem', fontWeight: 700,
                  cursor: file && companyName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <Upload size={16} /> Upload & Analyze
              </button>
            )}

            {/* Progress stages */}
            {(stage === 'uploading' || stage === 'processing') && (
              <div style={{ marginBottom: '1rem' }}>
                {STAGES.filter(s => ['uploading', 'processing', 'done'].includes(s.id)).map((s, i) => {
                  const sIdx = STAGES.findIndex(x => x.id === s.id);
                  const isActive = s.id === stage;
                  const isDone = currentStageIdx > sIdx;
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem', opacity: isDone ? 0.45 : 1 }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: isDone ? 'rgba(16,185,129,0.12)' : isActive ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : isActive ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isDone ? <CheckCircle size={13} color="#10b981" /> : isActive ? <Loader size={13} color="var(--accent-cyan)" style={{ animation: 'spin 1.5s linear infinite' }} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: isActive ? 'white' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Done state */}
            {stage === 'done' && (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', marginBottom: '1rem' }}>
                <CheckCircle size={28} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>Deck added!</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Appearing on your dashboard now...</div>
              </div>
            )}

            {/* Error state */}
            {stage === 'error' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '1rem' }}>
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Upload failed</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{errorMsg}</div>
                </div>
              </div>
            )}

            {/* Retry / Close */}
            {stage === 'error' && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => { setStage('idle'); setErrorMsg(''); }}
                  style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Close
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadModal;
