import AppLayout from '../components/ui/AppLayout';
import PageHero from '../components/ui/PageHero';
import { useI18n } from '../i18n/I18nProvider';
import { Users, Award, Mail, Terminal, Shield, Zap, Target, Cpu, BookOpen, GitBranch, Info } from 'lucide-react';

export default function About() {
  const { t } = useI18n();

  const teamMembers = [
    { name: 'GRISSI LAHCEN', idx: 0 },
    { name: 'BERRAG RAYANE ABDESSALEM', idx: 1 },
    { name: 'CHABRI ABDELMALEK', idx: 2 },
    { name: 'BERSALI HAMZA', idx: 3 },
    { name: 'HABBA EL RAYANE', idx: 4 },
    { name: 'AKSOUH ABDERRAOUF', idx: 5 },
  ];

  const techStack = [
    { label: 'React 18', color: 'var(--accent-cyan)' },
    { label: 'FastAPI', color: 'var(--accent-green)' },
    { label: 'Python 3.11', color: 'var(--accent-amber)' },
    { label: 'SQLite', color: 'var(--accent-purple)' },
    { label: 'WebSocket', color: 'var(--accent-cyan)' },
    { label: 'Recharts', color: 'var(--accent-red)' },
  ];

  return (
    <AppLayout wide>
      <div className="page-transition delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.5rem' }}>
        <PageHero
          icon={Info}
          title={t('app.tagline')}
          subtitle="PROJET RÉALISÉ DANS LE CADRE DU MODULE TECHNIQUES D'OPTIMISATION"
          actions={
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 1rem', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 20 }}>
              <Zap size={11} color="var(--accent-cyan)" />
              <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--accent-cyan)', letterSpacing: '0.2em' }}>VERSION 2.2 · PRO EDITION</span>
            </div>
          }
        />

        <div className="page-transition" style={{
          background: 'linear-gradient(145deg, rgba(15,23,42,0.7), rgba(2,6,23,0.95))',
          border: '1px solid rgba(0,240,255,0.15)',
          borderTop: '2px solid rgba(0,240,255,0.4)',
          borderRadius: 20, padding: '2rem 2rem',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,240,255,0.04)',
          backdropFilter: 'blur(16px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)', pointerEvents: 'none' }} />
          {[['0px', '0px', '10px 0 0 0'], ['0px', 'auto', '0 10px 0 0'], ['auto', '0px', '0 0 0 10px'], ['auto', 'auto', '0 0 10px 0']].map(([t2, l2, r2], idx) => (
            <div key={idx} style={{
              position: 'absolute',
              top: t2 === 'auto' ? 'auto' : 12, left: l2 === 'auto' ? 'auto' : 12,
              right: l2 === 'auto' ? 12 : 'auto', bottom: t2 === 'auto' ? 12 : 'auto',
              width: 15, height: 15,
              border: '1.5px solid rgba(0,240,255,0.4)',
              borderRadius: r2,
            }} />
          ))}
          <div style={{
            width: 100, height: 100, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(0,240,255,0.3), transparent, rgba(168,85,247,0.3))',
            padding: 3, boxShadow: '0 0 40px rgba(0,240,255,0.15)',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 18, background: 'rgba(2,6,23,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="/logo.png" alt="CyberGameGT" style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(0,240,255,0.5))' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          </div>
          <h1 className="font-mono" style={{ fontSize: '2.5rem', margin: '0 0 0.25rem', letterSpacing: '0.12em', color: '#f8fafc', textShadow: '0 0 30px rgba(0,240,255,0.4)' }}>
            Cyber<span style={{ color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,240,255,0.8)' }}>Game</span><span style={{ color: 'rgba(168,85,247,0.95)', textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>GT</span>
          </h1>
          <p className="font-mono" style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            THÉORIE DES JEUX APPLIQUÉE À LA SÉCURITÉ INFORMATIQUE
          </p>
        </div>

        {/* ── Module Banner ── */}
        <div className="page-transition delay-1" style={{
          background: 'linear-gradient(90deg, rgba(255,214,10,0.03) 0%, rgba(255,214,10,0.1) 50%, rgba(255,214,10,0.03) 100%)',
          border: '1px solid rgba(255,214,10,0.2)',
          borderLeft: '3px solid rgba(255,214,10,0.6)',
          borderRadius: 12, padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <Target size={18} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <span className="font-mono" style={{ color: 'var(--accent-amber)', fontSize: '0.78rem', letterSpacing: '0.06em', lineHeight: 1.6 }}>
            PROJET RÉALISÉ DANS LE CADRE DU MODULE <strong>TECHNIQUES D'OPTIMISATION</strong>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.65rem', marginTop: 2 }}>
              THÉORIE DES JEUX APPLIQUÉE À LA SÉCURITÉ INFORMATIQUE
            </span>
          </span>
        </div>

        {/* ── Team + Supervisor ── */}
        <div className="page-transition delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

          {/* Team */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.7), rgba(2,6,23,0.9))',
            border: '1px solid rgba(0,255,136,0.15)',
            borderTop: '2px solid rgba(0,255,136,0.4)',
            borderRadius: 16, padding: '1.75rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,136,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,255,136,0.1)' }}>
              <Terminal size={20} color="var(--accent-green)" />
              <h2 className="font-mono" style={{ color: 'var(--accent-green)', fontSize: '1rem', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Équipe de Développement</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {teamMembers.map(({ name, idx }) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  background: 'rgba(0,255,136,0.04)',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 8, border: '1px solid rgba(0,255,136,0.1)',
                  transition: 'all 0.25s ease',
                  cursor: 'default',
                }}>
                  <div style={{ width: 6, height: 6, background: 'var(--accent-green)', borderRadius: 2, boxShadow: '0 0 6px var(--accent-green)', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supervisor */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.7), rgba(2,6,23,0.9))',
            border: '1px solid rgba(255,214,10,0.15)',
            borderTop: '2px solid rgba(255,214,10,0.4)',
            borderRadius: 16, padding: '1.75rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255,214,10,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,214,10,0.1)' }}>
              <Award size={20} color="var(--accent-amber)" />
              <h2 className="font-mono" style={{ color: 'var(--accent-amber)', fontSize: '1rem', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Encadrement</h2>
            </div>

            {[
              { icon: <Users size={22} color="var(--accent-amber)" />, label: 'ENCADRÉ PAR', value: 'Dr. Djamila Dahmani', color: 'var(--accent-amber)', bg: 'rgba(255,214,10,0.05)', border: 'rgba(255,214,10,0.15)' },
              { icon: <Mail size={20} color="var(--accent-cyan)" />, label: 'CONTACT', value: 'djamiladahmani73@gmail.com', color: 'var(--accent-cyan)', bg: 'rgba(0,240,255,0.05)', border: 'rgba(0,240,255,0.15)', href: 'mailto:djamiladahmani73@gmail.com' },
              { icon: <Shield size={20} color="var(--accent-red)" />, label: 'DOMAINE', value: 'Networks & Distributed Systems', color: 'var(--text-secondary)', bg: 'rgba(255,59,48,0.05)', border: 'rgba(255,59,48,0.15)' },
            ].map(({ icon, label, value, color, bg, border, href }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: bg, padding: '0.85rem 1rem', borderRadius: 10, border: `1px solid ${border}` }}>
                <div style={{ flexShrink: 0 }}>{icon}</div>
                <div>
                  <div className="font-mono text-muted" style={{ fontSize: '0.55rem', marginBottom: 3, letterSpacing: '0.12em' }}>{label}</div>
                  {href
                    ? <a href={href} className="font-mono" style={{ fontSize: '0.85rem', color, textDecoration: 'none' }}>{value}</a>
                    : <div className="font-mono" style={{ fontSize: '0.9rem', color, fontWeight: label === 'ENCADRÉ PAR' ? 600 : 400 }}>{value}</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tech Stack ── */}
        <div className="page-transition delay-3" style={{
          background: 'linear-gradient(145deg, rgba(15,23,42,0.6), rgba(2,6,23,0.85))',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: '2px solid rgba(168,85,247,0.4)',
          borderRadius: 16, padding: '1.5rem',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Cpu size={16} color="var(--accent-purple)" />
            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tech Stack</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            {techStack.map(({ label, color }) => (
              <span key={label} style={{
                background: `${color}10`, border: `1px solid ${color}35`, color,
                padding: '5px 14px', borderRadius: 20,
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
                boxShadow: `0 0 10px ${color}10`,
              }}>{label}</span>
            ))}
          </div>
        </div>

        {/* ── Algorithms & Methods ── */}
        <div className="page-transition delay-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Algorithms */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.7), rgba(2,6,23,0.9))',
            border: '1px solid rgba(0,240,255,0.15)',
            borderTop: '2px solid rgba(0,240,255,0.4)',
            borderRadius: 16, padding: '1.75rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
              <GitBranch size={20} color="var(--accent-cyan)" />
              <h2 className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '1rem', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Algorithmes & Méthodes</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { name: 'Nash Equilibrium Solver', desc: 'Support enumeration + Lemke-Howson', color: 'var(--accent-cyan)' },
                { name: 'Fictitious Play', desc: 'Iterative convergence (4000 iterations)', color: 'var(--accent-amber)' },
                { name: 'Pareto Optimality', desc: 'Non-dominated profile detection', color: 'var(--accent-green)' },
                { name: 'Minimax Theorem', desc: 'Zero-sum game value computation', color: 'var(--accent-red)' },
                { name: 'RL Adaptive Defense', desc: 'Reinforcement learning defense agent', color: 'var(--accent-purple)' },
              ].map(({ name, desc, color }) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  background: `${color}08`,
                  padding: '0.6rem 0.75rem',
                  borderRadius: 8, border: `1px solid ${color}18`,
                }}>
                  <div style={{ width: 6, height: 6, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                  <div>
                    <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>{name}</span>
                    <span className="font-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic References */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.7), rgba(2,6,23,0.9))',
            border: '1px solid rgba(255,59,48,0.15)',
            borderTop: '2px solid rgba(255,59,48,0.4)',
            borderRadius: 16, padding: '1.75rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255,59,48,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,59,48,0.1)' }}>
              <BookOpen size={20} color="var(--accent-red)" />
              <h2 className="font-mono" style={{ color: 'var(--accent-red)', fontSize: '1rem', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Références Académiques</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { ref: 'Osborne & Rubinstein', title: 'A Course in Game Theory', year: '1994' },
                { ref: 'Alpcan & Başar', title: 'Network Security: A Decision and Game-Theoretic Approach', year: '2010' },
                { ref: 'Shoham & Leyton-Brown', title: 'Multiagent Systems: Algorithmic & Game-Theoretic Foundations', year: '2008' },
                { ref: 'Do et al.', title: 'Game Theory for Cyber Deception', year: '2020' },
                { ref: 'Nash, J.F.', title: 'Equilibrium Points in N-Person Games', year: '1950' },
              ].map(({ ref, title, year }) => (
                <div key={ref} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                  background: 'rgba(255,59,48,0.04)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 8, border: '1px solid rgba(255,59,48,0.1)',
                }}>
                  <div style={{ width: 6, height: 6, background: 'var(--accent-red)', borderRadius: 2, boxShadow: '0 0 6px var(--accent-red)', flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>{ref}</span>
                    <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginTop: 1 }}>{title}</span>
                    <span className="font-mono" style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>{year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
