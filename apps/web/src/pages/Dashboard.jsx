import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, FileText, CheckCircle, Clock, Search, ChevronRight, Loader, BarChart2, Users, Target, Upload, ExternalLink, Globe } from 'lucide-react';
import { googleLogout } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import DeckModal from '../components/DeckModal';
import UploadModal from '../components/UploadModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Read persisted user from localStorage (written by Hero login or Onboarding flow)
  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('safedeck_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Collect unique source URLs from a deck's verified data
  const getDeckSources = (deck) => {
    const vd = deck.verifiedData || {};
    const seen = new Set();
    Object.values(vd).forEach(v => {
      if (v?.source_url && v.source_url !== 'N/A' && v.source_url !== 'Not found in public domain') {
        seen.add(v.source_url);
      }
    });
    return [...seen];
  };
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = currentUser?.givenName || currentUser?.name?.split(' ')[0] || 'there';
  const fundName = currentUser?.user?.fund_name || null;
  const fundRole = currentUser?.user?.role || null;

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const dataSource = import.meta.env.VITE_DATA_SOURCE;
        let mappedDecks = [];

        if (dataSource === 'LOCAL') {
          if (!window.initSqlJs) {
            console.error("sql.js not loaded. Make sure the script tag is in index.html");
            setLoading(false);
            return;
          }

          const SQL = await window.initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
          });

          // Fetch local SQLite database binary
          const dbResponse = await fetch('/safepitch.db');
          if (!dbResponse.ok) throw new Error("Failed to load /safepitch.db file from public directory");
          const buf = await dbResponse.arrayBuffer();
          const db = new SQL.Database(new Uint8Array(buf));

          // Read evaluations
          const evalRes = db.exec("SELECT * FROM evaluations");
          if (evalRes.length > 0) {
            evalRes[0].values.forEach(row => {
              const id = row[0];
              const companyName = row[1];
              const score = row[2];
              const reasoning = row[3];
              
              const details = { Company: companyName };

              // Map extracted data for this evaluation
              const extRes = db.exec(`SELECT field_name, field_value FROM extracted_data WHERE evaluation_id = ${id}`);
              if (extRes.length > 0) {
                extRes[0].values.forEach(extRow => {
                  const fieldName = extRow[0];
                  let val = extRow[1];
                  try { val = JSON.parse(val); } catch(e) {}
                  details[fieldName] = val;
                });
              }

              // Map verified data
              const verifiedData = {};
              const verRes = db.exec(`SELECT field_name, field_value, source_url FROM verified_data WHERE evaluation_id = ${id}`);
              if (verRes.length > 0) {
                verRes[0].values.forEach(verRow => {
                  verifiedData[verRow[0]] = { value: verRow[1], source_url: verRow[2] };
                });
              }

              // Map risk analysis
              const riskAnalysis = { red_flags: [], green_flags: [] };
              const riskRes = db.exec(`SELECT flag_type, flag_title, description FROM risk_analysis WHERE evaluation_id = ${id}`);
              if (riskRes.length > 0) {
                riskRes[0].values.forEach(riskRow => {
                  const type = riskRow[0];
                  const flagObj = { flag: riskRow[1], description: riskRow[2] };
                  if (type === 'red_flag') riskAnalysis.red_flags.push(flagObj);
                  else if (type === 'green_flag') riskAnalysis.green_flags.push(flagObj);
                });
              }

              // Extract a concise revenue/financial number for the card
              let displayMetric = 'N/A';
              let metricLabel = 'Revenue';

              if (details['revenue_amount_inr'] && details['revenue_amount_inr'] !== 'Not stated') {
                  // Try to find FY25 or the most recent year
                  const match = details['revenue_amount_inr'].match(/(?:FY24A|FY25A|FY24|FY25)[^\d]*([\d.,]+(?:\s*[a-zA-Z]+)*)/);
                  if (match) {
                      displayMetric = match[1].trim();
                  } else {
                      // Grab the first chunk before comma
                      displayMetric = details['revenue_amount_inr'].split(',')[0];
                  }
              } else if (details['total_fund_raised'] && details['total_fund_raised'] !== 'Not stated') {
                  displayMetric = details['total_fund_raised'];
                  metricLabel = 'Total Raised';
              } else if (details['current_round_ask'] && details['current_round_ask'] !== 'Not stated') {
                  displayMetric = details['current_round_ask'];
                  metricLabel = 'Current Ask';
              }

              mappedDecks.push({
                id: id,
                name: details.Company || companyName || 'Untitled Deck',
                status: 'Completed',
                sector: details.sector || details.Sector || 'General',
                metricValue: displayMetric,
                metricLabel: metricLabel,
                date: new Date().toLocaleDateString(),
                details: details,
                verifiedData: verifiedData,
                riskAnalysis: riskAnalysis,
                score: score,
                reasoning: reasoning
              });
            });
          }
          setDecks(mappedDecks);

        } else {
          // Default AWS Fetching
          const response = await fetch('https://zh2feylzki.execute-api.eu-north-1.amazonaws.com/default/audits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_AWS_API_KEY
            },
            body: JSON.stringify({ userId: currentUser?.sub || currentUser?.userId })
          });
          
          if (response.ok) {
            let data = await response.json();
            // API gateway might return body as a string containing JSON array.
            if (data.body && typeof data.body === 'string') {
               try {
                 data = JSON.parse(data.body);
               } catch(e) { console.error('Failed to parse response body', e); }
            }
            
            const currentTenantId = currentUser?.user?.user_id;
            const decksData = (Array.isArray(data) ? data : []).filter(item => item.tenant_id === currentTenantId);
            
            const parseAuditResult = (auditStr) => {
              if (!auditStr) return null;
              try {
                // Extract JSON from markdown
                const match = auditStr.match(/```json\s([\s\S]*?)\s```/);
                if (match && match[1]) return JSON.parse(match[1]);
                // Fallback
                return JSON.parse(auditStr);
              } catch(e) {
                return null;
              }
            };
            
            mappedDecks = decksData.map((item, index) => {
              // AWS response: audit data comes as top-level fields (extracted_deck_data, scoring, etc.)
              // Not as a JSON string in audit_result
              const extracted = item.extracted_deck_data || {};
              const scoring = item.scoring || {};
              const verified = item.internet_verified_data || {};
              const risk = item.risk_analysis || {};

              // Build a unified details object from all sources
              const details = {
                ...extracted,
                overall_score: item.overall_score || scoring.score || null,
                scoring_reasoning: scoring.reasoning || null,
                risk_red_flags: risk.red_flags || [],
                verified_data: verified
              };

              // Extract revenue from extracted_deck_data or internet_verified_data
              let displayMetric = extracted.revenue || verified.revenue?.value || 'N/A';
              let metricLabel = 'Revenue';
              if (displayMetric === 'N/A' && extracted['Current Round Ask']) {
                displayMetric = extracted['Current Round Ask'];
                metricLabel = 'Current Ask';
              }

              return {
                id: item.id || index,
                name: extracted['Company'] || item.company_name || 'Untitled Deck',
                status: 'Completed',
                sector: extracted.Sector || 'General',
                metricValue: displayMetric,
                metricLabel: metricLabel,
                date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
                details: details,
                verifiedData: verified,
                riskAnalysis: risk,
                score: item.overall_score || scoring.score || null,
                reasoning: scoring.reasoning || null
              };
            });
            
            setDecks(mappedDecks);
          } else {
            console.error('Failed to fetch decks from AWS:', response.status);
          }
        }
      } catch (error) {
        console.error('Error fetching decks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDecks();
  }, []);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('safedeck_user');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'var(--accent-cyan)';
      case 'Processing': return 'var(--accent-purple)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'var(--accent-purple)',
        filter: 'blur(200px)',
        opacity: 0.15,
        borderRadius: '50%',
        zIndex: -1
      }} />

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', borderRadius: '8px' }}></div>
          SafeDeck <span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>| Dashboard</span>
        </div>

        {/* User chip in header */}
        <div className="mobile-btn-stack" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentUser && (
            <div className="mobile-hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px' }}>
              {currentUser.picture ? (
                <img src={currentUser.picture} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                  {firstName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{currentUser.name || currentUser.email}</div>
                {fundRole && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>{fundRole}</div>}
              </div>
            </div>
          )}
          <button
            className="btn"
            onClick={() => setUploadModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Upload size={16} /> <span className="mobile-hidden">Upload Deck</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/pricing')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <Target size={16} color="var(--accent-cyan)" /> <span className="mobile-hidden">Pricing</span>
          </button>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <LogOut size={16} /> <span className="mobile-hidden">Logout</span>
          </button>
        </div>
      </header>

      {/* Free Trial Banner */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 1.5rem',
        padding: '0.85rem 1.25rem',
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🎁</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>30-day free trial</strong> active — no payment required today. Your evaluation criteria, sheet mapping, and inbox routing are all configured.
          </span>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{
            padding: '0.4rem 1rem',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            color: 'var(--accent-cyan)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          View Plans →
        </button>
      </div>

      <main className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="responsive-flex-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1.5rem' }}>
          <div>
            {/* Personalised greeting */}
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: '0.4rem' }}>
              {getGreeting()}, <span className="text-gradient">{firstName}</span> 👋
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Manage and review your AI-analyzed pitch decks.</p>
              {fundName && (
                <span style={{ padding: '0.2rem 0.65rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '20px', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {fundName}
                </span>
              )}
            </div>
          </div>
          
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '20px', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
             <Search size={18} color="var(--text-secondary)" />
             <input 
               type="text" 
               placeholder="Search decks..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '200px' }}
             />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', color: 'var(--accent-purple)' }}>
            <Loader size={40} style={{ animation: 'spin 2s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {decks.filter(deck =>
               deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               deck.sector.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((deck, index) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel"
                onClick={() => setSelectedDeck(deck)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'transform 0.2s ease, border-color 0.2s',
                  cursor: 'pointer'
                }}
                whileHover={{ y: -5, borderColor: 'var(--accent-purple)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <FileText size={24} color="var(--accent-cyan)" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {deck.riskAnalysis && deck.riskAnalysis.red_flags.length > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem',
                        padding: '0.3rem 0.6rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'
                      }}>
                        ⚠️ {deck.riskAnalysis.red_flags.length} Risks
                      </div>
                    )}
                    {(deck.score !== undefined && deck.score !== null) && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 'bold',
                        padding: '0.3rem 0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'
                      }}>
                        🎯 {deck.score}/100
                      </div>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.name}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{deck.sector}</div>

                {(() => {
                  const sources = getDeckSources(deck);
                  if (sources.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                      <Globe size={11} color="var(--text-secondary)" style={{ marginTop: '0.2rem' }} />
                      {sources.map((src, i) => {
                        const isPitchDeck = src === 'pitch_deck';
                        return (
                          <a
                            key={i}
                            href={isPitchDeck ? '#' : src}
                            target="_blank"
                            rel="noreferrer"
                            title={isPitchDeck ? 'Pitch Deck' : src}
                            onClick={(e) => isPitchDeck && e.preventDefault()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '20px',
                              fontSize: '0.68rem',
                              fontWeight: 500,
                              background: 'rgba(139,92,246,0.1)',
                              color: '#a78bfa',
                              border: '1px solid rgba(139,92,246,0.2)',
                              textDecoration: 'none',
                            }}
                          >
                            <Globe size={9} />
                            {isPitchDeck ? 'Pitch Deck' : new URL(src).hostname.replace('www.', '')}
                            {!isPitchDeck && <ExternalLink size={8} />}
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{deck.metricLabel}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {deck.metricValue !== 'Not stated' ? deck.metricValue : 'N/A'}
                    </div>
                  </div>
                  <button className="btn" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}

            {!loading && decks.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No pitch decks found matching your search.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={(newDeck) => {
            // Map the new deck to the same shape the grid expects
            const mapped = {
              id: newDeck.id || Date.now(),
              name: newDeck.extracted_deck_data?.Company || newDeck.company_name || 'New Deck',
              status: 'Completed',
              sector: newDeck.extracted_deck_data?.Sector || 'General',
              metricValue: newDeck.extracted_deck_data?.revenue || newDeck.extracted_deck_data?.revenue || 'N/A',
              metricLabel: 'Revenue',
              date: new Date().toLocaleDateString(),
              details: newDeck.extracted_deck_data || {},
              verifiedData: newDeck.internet_verified_data || {},
              riskAnalysis: newDeck.risk_analysis || {},
              score: newDeck.overall_score || null,
              reasoning: newDeck.scoring?.reasoning || null,
            };
            setDecks(prev => [mapped, ...prev]);
          }}
        />
      )}

      {/* Detail View Modal overlay */}
      <DeckModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
    </div>
  );
};

export default Dashboard;
