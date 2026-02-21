/**
 * Q-Engineering Hub — Properties Module
 * Loads substances.json and renders a searchable/filterable table.
 */

(() => {
  'use strict';

  const tbody       = document.getElementById('substancesBody');
  const searchInput = document.getElementById('searchInput');
  const noResults   = document.getElementById('noResults');

  let substances = [];

  // ---- Load Data ----
  function loadSubstances() {
    try {
      // Uses global SUBSTANCES_DATA from data/substances.js (avoids fetch/CORS issues on file://)
      if (typeof SUBSTANCES_DATA !== 'undefined') {
        substances = SUBSTANCES_DATA;
      } else {
        throw new Error('SUBSTANCES_DATA not found');
      }
      renderTable(substances);
    } catch (err) {
      console.error('Erro ao carregar substâncias:', err);
      tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;color:var(--danger);">Erro ao carregar dados. Verifique se substances.js foi carregado.</td></tr>';
    }
  }

  // ---- Render Table ----
  function renderTable(data) {
    tbody.innerHTML = '';

    if (data.length === 0) {
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';

    data.forEach((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.nameEn}</td>
        <td>${s.formula}</td>
        <td>${fmt(s.molarMass)}</td>
        <td>${fmt(s.Tc)}</td>
        <td>${fmt(s.Pc)}</td>
        <td>${fmt(s.accentricFactor)}</td>
        <td>${fmt(s.Cp)}</td>
        <td>${fmt(s.Tb)}</td>
        <td>${fmt(s.Tf)}</td>
        <td>${fmt(s.density)}</td>
        <td>${fmt(s.Hvap)}</td>
        <td>${fmt(s.thermalConductivity)}</td>
        <td>${fmt(s.viscosity)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function fmt(val) {
    if (val === null || val === undefined) return '—';
    return val.toString();
  }

  // ---- Search / Filter ----
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      renderTable(substances);
      return;
    }

    const filtered = substances.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      s.nameEn.toLowerCase().includes(query) ||
      s.formula.toLowerCase().includes(query)
    );

    renderTable(filtered);
  });

  // ---- Init ----
  loadSubstances();
})();
