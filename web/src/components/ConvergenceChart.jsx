import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Generate mock convergence data
const generateData = () => {
  const data = [];
  for (let i = 0; i <= 80; i += 2) {
    const attacker = 5 * Math.exp(-i / 20) * Math.sin(i / 5) + 2.71 + (Math.random() - 0.5) * 0.3;
    const defender = -5 * Math.exp(-i / 20) * Math.sin(i / 5) - 2.71 + (Math.random() - 0.5) * 0.3;
    data.push({
      iteration: i,
      attacker: parseFloat(attacker.toFixed(2)),
      defender: parseFloat(defender.toFixed(2)),
    });
  }
  return data;
};

const convergenceData = generateData();

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)'
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Iter: {label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color, margin: '0.15rem 0' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ConvergenceChart() {
  return (
    <div className="panel convergence-container">
      <div className="panel-header">
        <div className="panel-title">
          <TrendingUp size={14} />
          <span>CONVERGENCE TO EQUILIBRIUM</span>
        </div>
      </div>

      <div className="panel-content" style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={convergenceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="iteration" 
              stroke="var(--text-muted)" 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={{ stroke: 'var(--text-muted)' }}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={{ stroke: 'var(--text-muted)' }}
              domain={[-8, 6]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="left"
              wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-mono)', paddingBottom: '10px' }}
            />
            <ReferenceLine 
              y={2.71} 
              stroke="var(--accent-red)" 
              strokeDasharray="5 5" 
              strokeWidth={1}
              label={{ value: 'Nash EQ', position: 'right', fill: 'var(--accent-red)', fontSize: 10 }}
            />
            <ReferenceLine 
              y={-2.71} 
              stroke="var(--accent-cyan)" 
              strokeDasharray="5 5" 
              strokeWidth={1}
            />
            <Line 
              type="monotone" 
              dataKey="attacker" 
              stroke="var(--accent-red)" 
              strokeWidth={2} 
              dot={false} 
              name="Attacker"
              activeDot={{ r: 4, fill: 'var(--accent-red)' }}
            />
            <Line 
              type="monotone" 
              dataKey="defender" 
              stroke="var(--accent-cyan)" 
              strokeWidth={2} 
              dot={false} 
              name="Defender"
              activeDot={{ r: 4, fill: 'var(--accent-cyan)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
