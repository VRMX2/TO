import React from 'react';
import Header from '../components/Header';
import { useI18n } from '../i18n/I18nProvider';
import { Users, Award, Mail, Terminal, Shield, Zap, Target } from 'lucide-react';

export default function About() {
  const { t } = useI18n();

  const teamMembers = [
    'GRISSI LAHCEN',
    'BERRAG RAYANE ABDESSALEM',
    'HABBA EL RAYANE',
    'AKSOUH ABDERRAOUF',
    'BERSALI HAMZA',
    'CHABRI ABDELMALEK'
  ];

  return (
    <div className="dashboard-layout">
      <Header />
      <div className="main-content" style={{ 
        gridColumn: '1 / -1', 
        padding: '2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        overflowY: 'auto',
        background: 'radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)'
      }}>
        
        <div style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Logo and Project Header */}
          <div style={{ 
            background: 'rgba(10, 14, 23, 0.6)', 
            border: '1px solid rgba(0, 240, 255, 0.2)', 
            borderRadius: '16px', 
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.08), inset 0 0 20px rgba(0, 240, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Cyberpunk corner accents */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)', borderTopLeftRadius: '16px' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderBottom: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)', borderBottomRightRadius: '16px' }}></div>

            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '2px solid var(--accent-cyan)',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
              position: 'relative',
              padding: '4px',
              background: 'rgba(0, 240, 255, 0.1)'
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '18px', overflow: 'hidden' }}>
                <img src="/logo.png" alt="CyberGameGT Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            
            <div style={{ zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '20px', marginBottom: '1rem' }}>
                <Zap size={12} color="var(--accent-cyan)" />
                <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', letterSpacing: '0.2em' }}>VERSION 1.0</span>
              </div>
              <h1 className="font-mono text-primary" style={{ fontSize: '2.8rem', margin: '0 0 0.5rem 0', letterSpacing: '0.12em', textShadow: '0 0 20px rgba(0, 240, 255, 0.6)' }}>
                CyberGameGT
              </h1>
              <p className="text-secondary font-mono" style={{ fontSize: '1rem', margin: 0, letterSpacing: '0.05em' }}>
                {t('app.tagline')}
              </p>
            </div>
          </div>

          {/* Module Banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(255, 214, 10, 0.05) 0%, rgba(255, 214, 10, 0.15) 50%, rgba(255, 214, 10, 0.05) 100%)',
            borderTop: '1px solid rgba(255, 214, 10, 0.3)',
            borderBottom: '1px solid rgba(255, 214, 10, 0.3)',
            padding: '1rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <Target size={18} color="var(--accent-amber)" />
            <span className="font-mono" style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              PROJET RÉALISÉ DANS LE CADRE DU MODULE <strong>TECHNIQUES D'OPTIMISATION</strong> (THÉORIE DES JEUX APPLIQUÉE À LA SÉCURITÉ INFORMATIQUE)
            </span>
            <Target size={18} color="var(--accent-amber)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            
            {/* Team Members Section */}
            <div className="hover-panel" style={{ 
              background: 'rgba(10, 14, 23, 0.7)', 
              border: '1px solid rgba(0, 255, 102, 0.2)', 
              borderRadius: '16px', 
              padding: '2rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 255, 102, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 255, 102, 0.15)', paddingBottom: '1rem' }}>
                <Terminal size={24} color="var(--accent-green)" />
                <h2 className="font-mono" style={{ color: 'var(--accent-green)', fontSize: '1.3rem', margin: 0, letterSpacing: '0.05em' }}>
                  Équipe de Développement
                </h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {teamMembers.map((member, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    background: 'rgba(0, 255, 102, 0.05)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 102, 0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '2px', boxShadow: '0 0 8px var(--accent-green)' }}></div>
                    <span className="font-mono text-secondary" style={{ fontSize: '0.8rem' }}>{member}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supervisor Section */}
            <div className="hover-panel" style={{ 
              background: 'rgba(10, 14, 23, 0.7)', 
              border: '1px solid rgba(255, 214, 10, 0.2)', 
              borderRadius: '16px', 
              padding: '2rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(255, 214, 10, 0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 214, 10, 0.15)', paddingBottom: '1rem' }}>
                <Award size={24} color="var(--accent-amber)" />
                <h2 className="font-mono" style={{ color: 'var(--accent-amber)', fontSize: '1.3rem', margin: 0, letterSpacing: '0.05em' }}>
                  Encadrement
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 214, 10, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 214, 10, 0.1)' }}>
                  <Users size={32} color="var(--accent-amber)" style={{ opacity: 0.8 }} />
                  <div>
                    <div className="font-mono text-muted" style={{ fontSize: '0.65rem', marginBottom: '0.2rem', letterSpacing: '0.1em' }}>ENCADRÉ PAR</div>
                    <div className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--accent-amber)', fontWeight: 'bold' }}>Dr. Djamila Dahmani</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0, 240, 255, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                  <Mail size={24} color="var(--accent-cyan)" style={{ opacity: 0.8 }} />
                  <div>
                    <div className="font-mono text-muted" style={{ fontSize: '0.65rem', marginBottom: '0.2rem', letterSpacing: '0.1em' }}>CONTACT</div>
                    <a href="mailto:djamiladahmani73@gmail.com" className="font-mono text-primary" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>
                      djamiladahmani73@gmail.com
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 59, 48, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 59, 48, 0.1)' }}>
                   <Shield size={24} color="var(--accent-red)" style={{ opacity: 0.8 }} />
                   <div>
                      <div className="font-mono text-muted" style={{ fontSize: '0.65rem', marginBottom: '0.2rem', letterSpacing: '0.1em' }}>DOMAINE</div>
                      <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Networks & Distributed Systems</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      <style>{`
        .hover-panel {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-panel:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
}
