import { useMemo } from 'react';
import axios from 'axios';
import { apiHeaders } from '../lib/apiClient';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: apiHeaders(),
});

const LOCAL_PRESETS_KEY = 'gt_local_presets_v1';

const buildApiError = (error, action) => {
  const detail = error?.response?.data?.detail;
  const message = typeof detail === 'string'
    ? detail
    : (error?.response?.data?.message || error?.message || 'Unknown error');
  const status = error?.response?.status;
  return new Error(`${action} failed${status ? ` (${status})` : ''}: ${message}`);
};

const apiCall = async (action, fn) => {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    const friendly = buildApiError(error, action);
    console.error(friendly.message, error);
    throw friendly;
  }
};

const readLocalPresets = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PRESETS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalPresets = (rows) => {
  localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(rows));
};

const upsertLocalPreset = (payload) => {
  const now = new Date().toISOString();
  const rows = readLocalPresets();
  const idx = rows.findIndex((p) => p.name === payload.name);
  const record = {
    name: payload.name,
    matrix_size: payload.matrix_size,
    sync_zero_sum: Boolean(payload.sync_zero_sum),
    attacker_matrix: payload.attacker_matrix,
    defender_matrix: payload.defender_matrix,
    updated_at: now,
    created_at: idx >= 0 ? rows[idx].created_at || now : now,
  };
  if (idx >= 0) rows[idx] = record;
  else rows.push(record);
  writeLocalPresets(rows);
  return record;
};

const fallbackConvergence = (attackerUtility = 0, defenderUtility = 0, points = 24) => {
  return Array.from({ length: points }, (_, i) => {
    const t = i / Math.max(1, points - 1);
    return {
      iteration: i + 1,
      attacker: Number((attackerUtility * t).toFixed(4)),
      defender: Number((defenderUtility * t).toFixed(4)),
    };
  });
};

const solveMixedApprox = (A, B) => {
  const m = A.length;
  const n = A[0].length;
  let p = Array(m).fill(1 / m);
  let q = Array(n).fill(1 / n);
  const lr = 0.04;
  for (let iter = 0; iter < 3500; iter += 1) {
    const attPay = p.map((_, i) => q.reduce((s, qj, j) => s + qj * A[i][j], 0));
    const defPay = q.map((_, j) => p.reduce((s, pi, i) => s + pi * B[i][j], 0));
    const avgAtt = p.reduce((s, pi, i) => s + pi * attPay[i], 0);
    const avgDef = q.reduce((s, qj, j) => s + qj * defPay[j], 0);
    p = p.map((pi, i) => Math.max(1e-9, pi + lr * (attPay[i] - avgAtt)));
    q = q.map((qj, j) => Math.max(1e-9, qj + lr * (defPay[j] - avgDef)));
    const sp = p.reduce((a, b) => a + b, 0);
    const sq = q.reduce((a, b) => a + b, 0);
    p = p.map((x) => x / sp);
    q = q.map((x) => x / sq);
  }
  const uA = p.reduce((s, pi, i) => s + q.reduce((ss, qj, j) => ss + pi * qj * A[i][j], 0), 0);
  const uD = p.reduce((s, pi, i) => s + q.reduce((ss, qj, j) => ss + pi * qj * B[i][j], 0), 0);
  return { p, q, uA, uD };
};

const fallbackPareto = (A, B) => {
  const rows = A.length;
  const cols = A[0].length;
  const profiles = [];
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const a = A[i][j];
      const b = B[i][j];
      let dominated = false;
      for (let k = 0; k < rows && !dominated; k += 1) {
        for (let m = 0; m < cols && !dominated; m += 1) {
          if (k === i && m === j) continue;
          if (A[k][m] >= a && B[k][m] >= b && (A[k][m] > a || B[k][m] > b)) dominated = true;
        }
      }
      if (!dominated) {
        profiles.push({
          attacker_idx: i,
          defender_idx: j,
          attacker_payoff: a,
          defender_payoff: b,
        });
      }
    }
  }
  return profiles;
};

export const useGameAPI = () => {
  const computeNash = async (matrix, defenderMatrix = null) => {
    const payload = defenderMatrix ? { matrix, defender_matrix: defenderMatrix } : { matrix };
    try {
      return await apiCall('Compute Nash equilibrium', () => api.post('/game/nash', payload));
    } catch {
      const A = matrix;
      const B = defenderMatrix || matrix.map((row) => row.map((v) => -v));
      const { p, q, uA, uD } = solveMixedApprox(A, B);
      const eq = {
        id: 1,
        type: 'mixed',
        attacker_strategy: p,
        defender_strategy: q,
        attacker_utility: uA,
        defender_utility: uD,
      };
      const pure_nash_profiles = [];
      for (let i = 0; i < A.length; i += 1) {
        for (let j = 0; j < A[0].length; j += 1) {
          const bestAtt = A[i][j] >= Math.max(...A.map((r) => r[j]));
          const bestDef = B[i][j] >= Math.max(...B[i]);
          if (bestAtt && bestDef) {
            pure_nash_profiles.push({
              attacker_idx: i,
              defender_idx: j,
              attacker_payoff: A[i][j],
              defender_payoff: B[i][j],
            });
          }
        }
      }
      return {
        attacker_strategy: p,
        defender_strategy: q,
        attacker_utility: uA,
        defender_utility: uD,
        convergence_data: fallbackConvergence(uA, uD),
        players: ['Attacker', 'Defender'],
        equilibria: [eq],
        pure_nash_profiles,
        payoff_table: [],
      };
    }
  };

  const getPareto = async (matrix, defenderMatrix = null) => {
    const payload = defenderMatrix ? { matrix, defender_matrix: defenderMatrix } : { matrix };
    try {
      return await apiCall('Load Pareto profiles', () => api.post('/game/pareto', payload));
    } catch {
      const A = matrix;
      const B = defenderMatrix || matrix.map((row) => row.map((v) => -v));
      const pareto_profiles = fallbackPareto(A, B);
      return { pareto_profiles, count: pareto_profiles.length };
    }
  };

  const simulateAttack = async ({ topology_type = 'star', attack_type = 'DDoS' } = {}) => {
    try {
      return await apiCall('Simulate attack', () => api.post('/network/simulate-attack', { topology_type, attack_type }));
    } catch {
      const nodes = ['GW-01', 'FW-02', 'SRV-03', 'IDS-04', 'HNY-05'];
      const attacked = nodes[Math.floor(Math.random() * nodes.length)];
      const severity = Math.floor(Math.random() * 40) + 10;
      return { attacked_node: attacked, attack_type, propagation: nodes.filter(() => Math.random() > 0.6), severity, status: 'simulated' };
    }
  };

  const deployDefense = async ({ topology_type = 'star', target_node = null } = {}) => {
    const payload = target_node ? { topology_type, target_node } : { topology_type };
    try {
      return await apiCall('Deploy defense', () => api.post('/network/deploy-defense', payload));
    } catch {
      const nodes = ['GW-01', 'FW-02', 'SRV-03', 'IDS-04', 'HNY-05'];
      const defended = target_node || nodes[Math.floor(Math.random() * nodes.length)];
      const actions = ['hardened firewall rules', 'deployed IDS signature update', 'patched vulnerability', 'activated honey pot'];
      return { defended_node: defended, action: actions[Math.floor(Math.random() * actions.length)], coverage: Math.random() * 0.5 + 0.3, status: 'deployed' };
    }
  };

  const listPresets = async () => {
    try {
      return await apiCall('List presets', () => api.get('/game/presets'));
    } catch {
      return readLocalPresets().sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
    }
  };

  const savePreset = async (payload) => {
    try {
      return await apiCall('Save preset', () => api.post('/game/presets', payload));
    } catch {
      return upsertLocalPreset(payload);
    }
  };

  const renamePreset = async (oldName, payload) => {
    try {
      return await apiCall('Rename preset', () => api.put(`/game/presets/${encodeURIComponent(oldName)}`, payload));
    } catch {
      const rows = readLocalPresets();
      const idx = rows.findIndex((p) => p.name === oldName);
      if (idx < 0) {
        throw new Error(`Rename preset failed: preset "${oldName}" not found`);
      }
      const conflict = rows.find((p) => p.name === payload.name && p.name !== oldName);
      if (conflict) {
        throw new Error(`Rename preset failed: target preset "${payload.name}" already exists`);
      }
      rows.splice(idx, 1);
      writeLocalPresets(rows);
      return upsertLocalPreset(payload);
    }
  };

  const deletePreset = async (name) => {
    try {
      return await apiCall('Delete preset', () => api.delete(`/game/presets/${encodeURIComponent(name)}`));
    } catch {
      const rows = readLocalPresets();
      const next = rows.filter((p) => p.name !== name);
      writeLocalPresets(next);
      return { status: 'deleted', name };
    }
  };

  return useMemo(() => ({
    computeNash,
    getPareto,
    simulateAttack,
    deployDefense,
    listPresets,
    savePreset,
    renamePreset,
    deletePreset
  }), []); // All functions only close over module-level `api`, stable across renders
};
