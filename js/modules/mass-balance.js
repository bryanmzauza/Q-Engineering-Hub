/**
 * Q-Engineering Hub — Mass Balance Module
 * Calculators: simple (no reaction), with reaction, multicomponent, recycle
 */
(() => {
  'use strict';

  // ======== Tab Navigation ========
  const tabs = document.querySelectorAll('.mb-tab');
  const panels = document.querySelectorAll('.mb-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  // ======== Utility ========
  const $ = id => document.getElementById(id);
  const numVal = el => {
    const v = parseFloat(el.value);
    return isNaN(v) ? null : v;
  };
  const fmt = (n, d = 4) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(d);
    return parseFloat(n.toFixed(d)).toString();
  };

  // ======================================
  // 1) SIMPLE BALANCE (no reaction)
  // ======================================

  let simpleInputCount = 1;
  let simpleOutputCount = 1;

  function createStreamEntry(type, index, container) {
    const label = type === 'input' ? 'Entrada' : 'Saída';
    const div = document.createElement('div');
    div.className = 'stream-entry';
    div.dataset.index = index;
    div.innerHTML = `
      <div class="stream-header">
        <span class="stream-label">${label} ${index + 1}</span>
        <button class="remove-stream" title="Remover corrente">✕</button>
      </div>
      <div class="stream-fields">
        <div class="field">
          <label>Vazão (kg/h)</label>
          <input type="number" class="stream-flow" placeholder="ex: 100" step="any" />
        </div>
      </div>`;
    div.querySelector('.remove-stream').addEventListener('click', () => {
      div.remove();
      updateSimpleCounts();
    });
    container.appendChild(div);
  }

  function updateSimpleCounts() {
    const inCount = $('simpleInputStreams').querySelectorAll('.stream-entry').length;
    const outCount = $('simpleOutputStreams').querySelectorAll('.stream-entry').length;
    $('simpleInCount').textContent = inCount;
    $('simpleOutCount').textContent = outCount;
  }

  $('addSimpleInput').addEventListener('click', () => {
    simpleInputCount++;
    createStreamEntry('input', simpleInputCount - 1, $('simpleInputStreams'));
    updateSimpleCounts();
  });

  $('addSimpleOutput').addEventListener('click', () => {
    simpleOutputCount++;
    createStreamEntry('output', simpleOutputCount - 1, $('simpleOutputStreams'));
    updateSimpleCounts();
  });

  $('solveSimple').addEventListener('click', () => {
    const allInputs = $('simpleInputStreams').querySelectorAll('.stream-flow');
    const allOutputs = $('simpleOutputStreams').querySelectorAll('.stream-flow');

    let sumIn = 0, sumOut = 0;
    let unknownEl = null, unknownType = '', unknownIndex = -1;
    let unknowns = 0;

    allInputs.forEach((inp, i) => {
      const v = numVal(inp);
      if (v === null) {
        unknowns++;
        unknownEl = inp;
        unknownType = 'Entrada';
        unknownIndex = i + 1;
      } else {
        sumIn += v;
      }
    });

    allOutputs.forEach((inp, i) => {
      const v = numVal(inp);
      if (v === null) {
        unknowns++;
        unknownEl = inp;
        unknownType = 'Saída';
        unknownIndex = i + 1;
      } else {
        sumOut += v;
      }
    });

    const results = $('simpleResults');
    const resultVal = $('simpleResultValue');
    const resultDetail = $('simpleResultDetail');
    results.style.display = 'block';

    if (unknowns === 0) {
      // Check balance
      const diff = Math.abs(sumIn - sumOut);
      if (diff < 1e-6) {
        resultVal.textContent = '✓ Balanço fechado';
        resultVal.style.color = 'var(--success)';
        resultDetail.textContent = `Σ Entradas = ${fmt(sumIn)} kg/h = Σ Saídas = ${fmt(sumOut)} kg/h`;
      } else {
        resultVal.textContent = '✗ Balanço não fecha';
        resultVal.style.color = 'var(--danger)';
        resultDetail.textContent = `Σ Entradas = ${fmt(sumIn)} kg/h ≠ Σ Saídas = ${fmt(sumOut)} kg/h | Diferença: ${fmt(diff)} kg/h`;
      }
    } else if (unknowns === 1) {
      let result;
      if (unknownType === 'Entrada') {
        result = sumOut - sumIn;
      } else {
        result = sumIn - sumOut;
      }
      if (result < 0) {
        resultVal.textContent = '⚠ Resultado negativo';
        resultVal.style.color = 'var(--warning)';
        resultDetail.textContent = `${unknownType} ${unknownIndex} = ${fmt(result)} kg/h (verifique os valores de entrada)`;
      } else {
        unknownEl.value = parseFloat(result.toFixed(6));
        resultVal.textContent = `${fmt(result)} kg/h`;
        resultVal.style.color = 'var(--accent)';
        resultDetail.textContent = `${unknownType} ${unknownIndex} calculada pelo balanço: Σ Entradas = Σ Saídas → ${fmt(sumIn + (unknownType === 'Entrada' ? result : 0))} = ${fmt(sumOut + (unknownType === 'Saída' ? result : 0))} kg/h`;
      }
    } else {
      resultVal.textContent = '⚠ Muitas incógnitas';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = `Encontradas ${unknowns} incógnitas. Deixe apenas 1 campo em branco para resolver.`;
    }
  });

  $('clearSimple').addEventListener('click', () => {
    $('simpleInputStreams').querySelectorAll('.stream-flow').forEach(el => el.value = '');
    $('simpleOutputStreams').querySelectorAll('.stream-flow').forEach(el => el.value = '');
    $('simpleResults').style.display = 'none';
    $('simpleResultValue').style.color = 'var(--accent)';
  });

  // ======================================
  // 2) REACTION BALANCE
  // ======================================

  function parseReaction(str) {
    // Parse "2A + B → C + 3D" into { reactants: {A:2, B:1}, products: {C:1, D:3} }
    str = str.replace(/->/g, '→').trim();
    const parts = str.split('→');
    if (parts.length !== 2) return null;

    function parseSide(s) {
      const terms = s.split('+').map(t => t.trim()).filter(Boolean);
      const result = {};
      for (const term of terms) {
        const match = term.match(/^(\d*\.?\d*)\s*([A-Za-z][A-Za-z₀-₉0-9]*)/);
        if (!match) return null;
        const coeff = match[1] === '' ? 1 : parseFloat(match[1]);
        const species = match[2];
        result[species] = coeff;
      }
      return result;
    }

    const reactants = parseSide(parts[0]);
    const products = parseSide(parts[1]);
    if (!reactants || !products) return null;
    return { reactants, products };
  }

  $('solveReaction').addEventListener('click', () => {
    const eqStr = $('rxnEquation').value.trim();
    const feedA = numVal($('rxnFeedA'));
    const conversion = numVal($('rxnConversion'));

    const results = $('reactionResults');
    const table = $('reactionTable');
    const detail = $('reactionDetail');

    if (!eqStr || feedA === null || conversion === null) {
      results.style.display = 'block';
      table.innerHTML = '<p style="color: var(--warning);">Preencha a estequiometria, vazão de A e conversão.</p>';
      detail.textContent = '';
      return;
    }

    const rxn = parseReaction(eqStr);
    if (!rxn) {
      results.style.display = 'block';
      table.innerHTML = '<p style="color: var(--danger);">Formato de reação inválido. Use: A → 2B + C</p>';
      detail.textContent = '';
      return;
    }

    // First reactant key is the "key component" (A)
    const keySpecies = Object.keys(rxn.reactants)[0];
    const keyCoeff = rxn.reactants[keySpecies];

    // Extent of reaction: ξ = X * F_A_in / |ν_A|
    const xi = (conversion * feedA) / keyCoeff;

    // Extra feed for other species
    const extraSpecies = ($('rxnExtraSpecies').value || '').trim();
    const extraFeed = numVal($('rxnExtraFeed')) || 0;
    const inertSpecies = ($('rxnInertSpecies').value || '').trim();
    const inertFeed = numVal($('rxnInertFeed')) || 0;

    // Build species table
    const allSpecies = new Set([
      ...Object.keys(rxn.reactants),
      ...Object.keys(rxn.products)
    ]);
    if (inertSpecies) allSpecies.add(inertSpecies);

    const rows = [];
    let totalIn = 0, totalOut = 0;

    allSpecies.forEach(sp => {
      const nuReactant = rxn.reactants[sp] || 0;
      const nuProduct = rxn.products[sp] || 0;
      const nu = nuProduct - nuReactant; // stoich coefficient (+ for products, - for reactants)

      let fIn = 0;
      if (sp === keySpecies) fIn = feedA;
      else if (sp === extraSpecies) fIn = extraFeed;
      else if (sp === inertSpecies) fIn = inertFeed;
      else if (rxn.reactants[sp]) {
        // If another reactant exists, and has extra feed
        if (sp === extraSpecies) fIn = extraFeed;
      }

      const fOut = fIn + nu * xi;
      totalIn += fIn;
      totalOut += Math.max(fOut, 0);

      rows.push({
        species: sp,
        nu: nu,
        fIn: fIn,
        fOut: Math.max(fOut, 0),
        isProduct: nuProduct > 0 && nuReactant === 0,
        isInert: sp === inertSpecies
      });
    });

    // Render table
    let html = '<table><thead><tr><th>Espécie</th><th>ν</th><th>Entrada (mol/s)</th><th>Saída (mol/s)</th></tr></thead><tbody>';
    rows.forEach(r => {
      const cls = r.isProduct ? ' class="highlight"' : '';
      html += `<tr>
        <td${cls}>${r.species}${r.isInert ? ' (inerte)' : ''}</td>
        <td>${r.isInert ? '—' : (r.nu > 0 ? '+' : '') + r.nu}</td>
        <td>${fmt(r.fIn)}</td>
        <td${cls}>${fmt(r.fOut)}</td>
      </tr>`;
    });
    html += `<tr style="border-top: 2px solid var(--border); font-weight: 600;">
      <td>Total</td><td>—</td><td>${fmt(totalIn)}</td><td>${fmt(totalOut)}</td>
    </tr>`;
    html += '</tbody></table>';

    results.style.display = 'block';
    table.innerHTML = html;
    detail.textContent = `Extensão da reação (ξ) = ${fmt(xi)} mol/s | Conversão de ${keySpecies} = ${(conversion * 100).toFixed(1)}%`;
  });

  $('clearReaction').addEventListener('click', () => {
    $('rxnEquation').value = '';
    $('rxnFeedA').value = '';
    $('rxnConversion').value = '';
    $('rxnExtraSpecies').value = '';
    $('rxnExtraFeed').value = '';
    $('rxnInertSpecies').value = '';
    $('rxnInertFeed').value = '';
    $('reactionResults').style.display = 'none';
  });

  // ======================================
  // 3) MULTICOMPONENT BALANCE
  // ======================================

  function getComponentNames() {
    const inputs = document.querySelectorAll('#multiComponents .comp-name');
    return Array.from(inputs).map(el => el.value.trim()).filter(Boolean);
  }

  function buildMultiStreamEntry(type, index, components) {
    const label = type === 'input' ? 'Entrada' : 'Saída';
    const div = document.createElement('div');
    div.className = 'stream-entry';
    div.dataset.type = type;
    div.dataset.index = index;

    let fieldsHtml = `
      <div class="stream-header">
        <span class="stream-label">${label} ${index + 1}</span>
        <button class="remove-stream" title="Remover">✕</button>
      </div>
      <div class="stream-fields">
        <div class="field">
          <label>Vazão total (kg/h)</label>
          <input type="number" class="multi-total-flow" placeholder="ex: 100" step="any" />
        </div>
      </div>
      <div class="stream-fields" style="margin-top: 0.4rem;">`;

    components.forEach((c, i) => {
      fieldsHtml += `
        <div class="field">
          <label>x(${c}): fração mássica</label>
          <input type="number" class="multi-frac" data-comp="${i}" placeholder="0–1" step="0.001" min="0" max="1" />
        </div>`;
    });
    fieldsHtml += '</div>';
    div.innerHTML = fieldsHtml;

    div.querySelector('.remove-stream').addEventListener('click', () => {
      div.remove();
      updateMultiCounts();
    });
    return div;
  }

  let multiInIdx = 0, multiOutIdx = 0;

  function rebuildMultiStreams() {
    const comps = getComponentNames();
    const inContainer = $('multiInputStreams');
    const outContainer = $('multiOutputStreams');
    inContainer.innerHTML = '';
    outContainer.innerHTML = '';
    multiInIdx = 0;
    multiOutIdx = 0;

    // Add one default stream each
    inContainer.appendChild(buildMultiStreamEntry('input', multiInIdx++, comps));
    outContainer.appendChild(buildMultiStreamEntry('output', multiOutIdx++, comps));
    updateMultiCounts();
  }

  function updateMultiCounts() {
    $('multiInCount').textContent = $('multiInputStreams').querySelectorAll('.stream-entry').length;
    $('multiOutCount').textContent = $('multiOutputStreams').querySelectorAll('.stream-entry').length;
  }

  // Auto-rebuild streams when components change
  let rebuildTimer;
  document.querySelector('#multiComponents').addEventListener('input', () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuildMultiStreams, 600);
  });

  $('addComponent').addEventListener('click', () => {
    const container = $('multiComponents');
    const count = container.querySelectorAll('.comp-name').length + 1;
    const entry = document.createElement('div');
    entry.className = 'stream-entry';
    entry.style.padding = '0.5rem 0.75rem';
    entry.innerHTML = `
      <div class="stream-header">
        <span class="stream-label">Componente ${count}</span>
        <button class="remove-stream" title="Remover">✕</button>
      </div>
      <div class="stream-fields">
        <div class="field"><input type="text" class="comp-name" placeholder="ex: Componente" /></div>
      </div>`;
    entry.querySelector('.remove-stream').addEventListener('click', () => {
      entry.remove();
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(rebuildMultiStreams, 300);
    });
    container.appendChild(entry);
  });

  $('addMultiInput').addEventListener('click', () => {
    const comps = getComponentNames();
    if (!comps.length) { alert('Defina pelo menos um componente primeiro.'); return; }
    $('multiInputStreams').appendChild(buildMultiStreamEntry('input', multiInIdx++, comps));
    updateMultiCounts();
  });

  $('addMultiOutput').addEventListener('click', () => {
    const comps = getComponentNames();
    if (!comps.length) { alert('Defina pelo menos um componente primeiro.'); return; }
    $('multiOutputStreams').appendChild(buildMultiStreamEntry('output', multiOutIdx++, comps));
    updateMultiCounts();
  });

  $('solveMulti').addEventListener('click', () => {
    const comps = getComponentNames();
    const results = $('multiResults');
    const tableDiv = $('multiTable');
    const detail = $('multiDetail');

    if (comps.length < 1) {
      results.style.display = 'block';
      tableDiv.innerHTML = '<p style="color:var(--warning);">Defina pelo menos um componente.</p>';
      return;
    }

    // Collect stream data
    function collectStreams(containerId) {
      const entries = document.querySelectorAll(`#${containerId} .stream-entry`);
      return Array.from(entries).map(entry => {
        const totalFlow = numVal(entry.querySelector('.multi-total-flow'));
        const fracs = {};
        entry.querySelectorAll('.multi-frac').forEach(inp => {
          fracs[inp.dataset.comp] = numVal(inp);
        });
        return { totalFlow, fracs, entry };
      });
    }

    const inputs = collectStreams('multiInputStreams');
    const outputs = collectStreams('multiOutputStreams');

    // Component-by-component balance: Σ(F_in * x_in) = Σ(F_out * x_out)
    const balanceResults = [];
    let allOk = true;

    comps.forEach((compName, ci) => {
      let sumIn = 0, sumOut = 0;
      let knownIn = true, knownOut = true;

      inputs.forEach(s => {
        if (s.totalFlow !== null && s.fracs[ci] !== null) {
          sumIn += s.totalFlow * s.fracs[ci];
        } else {
          knownIn = false;
        }
      });

      outputs.forEach(s => {
        if (s.totalFlow !== null && s.fracs[ci] !== null) {
          sumOut += s.totalFlow * s.fracs[ci];
        } else {
          knownOut = false;
        }
      });

      balanceResults.push({
        component: compName,
        massIn: knownIn ? sumIn : null,
        massOut: knownOut ? sumOut : null,
        balanced: knownIn && knownOut ? Math.abs(sumIn - sumOut) < 1e-6 : null
      });

      if (!knownIn || !knownOut) allOk = false;
    });

    // Also compute total balance
    let totalMassIn = 0, totalMassOut = 0;
    let totalInKnown = true, totalOutKnown = true;
    inputs.forEach(s => { if (s.totalFlow !== null) totalMassIn += s.totalFlow; else totalInKnown = false; });
    outputs.forEach(s => { if (s.totalFlow !== null) totalMassOut += s.totalFlow; else totalOutKnown = false; });

    // Try to solve for one unknown total flow
    if (!totalInKnown && totalOutKnown) {
      const unknownInputs = inputs.filter(s => s.totalFlow === null);
      if (unknownInputs.length === 1) {
        const solved = totalMassOut - totalMassIn;
        unknownInputs[0].entry.querySelector('.multi-total-flow').value = parseFloat(solved.toFixed(6));
      }
    } else if (totalInKnown && !totalOutKnown) {
      const unknownOutputs = outputs.filter(s => s.totalFlow === null);
      if (unknownOutputs.length === 1) {
        const solved = totalMassIn - totalMassOut;
        unknownOutputs[0].entry.querySelector('.multi-total-flow').value = parseFloat(solved.toFixed(6));
      }
    }

    // Render
    let html = '<table><thead><tr><th>Componente</th><th>Massa Entrada (kg/h)</th><th>Massa Saída (kg/h)</th><th>Status</th></tr></thead><tbody>';
    balanceResults.forEach(r => {
      const status = r.balanced === null ? '⚠ Dados insuficientes' : (r.balanced ? '✓ OK' : '✗ Diferença: ' + fmt(Math.abs(r.massIn - r.massOut)));
      const statusColor = r.balanced === null ? 'var(--warning)' : (r.balanced ? 'var(--success)' : 'var(--danger)');
      html += `<tr>
        <td>${r.component}</td>
        <td>${r.massIn !== null ? fmt(r.massIn) : '—'}</td>
        <td>${r.massOut !== null ? fmt(r.massOut) : '—'}</td>
        <td style="color: ${statusColor}">${status}</td>
      </tr>`;
    });
    html += `<tr style="border-top: 2px solid var(--border); font-weight: 600;">
      <td>Total</td>
      <td>${totalInKnown ? fmt(totalMassIn) : '—'}</td>
      <td>${totalOutKnown ? fmt(totalMassOut) : '—'}</td>
      <td style="color: ${totalInKnown && totalOutKnown ? (Math.abs(totalMassIn - totalMassOut) < 1e-6 ? 'var(--success)' : 'var(--danger)') : 'var(--warning)'}">
        ${totalInKnown && totalOutKnown ? (Math.abs(totalMassIn - totalMassOut) < 1e-6 ? '✓ OK' : '✗ Δ=' + fmt(Math.abs(totalMassIn - totalMassOut))) : '—'}
      </td>
    </tr>`;
    html += '</tbody></table>';

    results.style.display = 'block';
    tableDiv.innerHTML = html;
    detail.textContent = `${comps.length} componente(s), ${inputs.length} entrada(s), ${outputs.length} saída(s)`;
  });

  $('clearMulti').addEventListener('click', () => {
    $('multiResults').style.display = 'none';
    rebuildMultiStreams();
  });

  // Init multicomponent streams
  rebuildMultiStreams();

  // ======================================
  // 4) RECYCLE BALANCE
  // ======================================

  $('solveRecycle').addEventListener('click', () => {
    const F0 = numVal($('recycleFeed'));
    const xA0 = numVal($('recycleFeedXa'));
    const Xpp = numVal($('recycleConvPerPass'));
    const sepEff = numVal($('recycleSepEff'));
    const purgeRatio = numVal($('recyclePurgeRatio')) || 0;
    const nu = numVal($('recycleStoich')) || 1;

    const results = $('recycleResults');
    const tableDiv = $('recycleTable');
    const detail = $('recycleDetail');

    if (F0 === null || xA0 === null || Xpp === null || sepEff === null) {
      results.style.display = 'block';
      tableDiv.innerHTML = '<p style="color: var(--warning);">Preencha todos os parâmetros obrigatórios.</p>';
      detail.textContent = '';
      return;
    }

    if (Xpp <= 0 || Xpp > 1) {
      results.style.display = 'block';
      tableDiv.innerHTML = '<p style="color: var(--danger);">A conversão por passe deve estar entre 0 (exclusivo) e 1.</p>';
      detail.textContent = '';
      return;
    }

    const sepFraction = sepEff / 100; // fraction of B recovered in product
    const FA0 = F0 * xA0; // mol/s of A in fresh feed
    const FI0 = F0 * (1 - xA0); // mol/s of inert in fresh feed

    // Global balance (steady state): all A fed must eventually convert or leave in purge
    // With perfect separation (100% B recovery) and no purge: global X = 100%
    // With purge: some A leaves through purge

    // Iterative approach for recycle loop
    // Let R = recycle flow of A (mol/s)
    // Mixer: FA_mix = FA0 + R
    // Reactor: FA_out_reactor = FA_mix * (1 - Xpp), FB_out_reactor = nu * FA_mix * Xpp
    // Separator: Product gets sepFraction * FB_out_reactor of B
    //            Remaining: A_remaining = FA_out_reactor, B_remaining = (1-sepFraction)*FB_out_reactor
    // Before recycle: total_remaining = A_remaining + B_remaining + FI (inert passes through)
    // Purge takes purgeRatio of remaining
    // Recycle: R = (1 - purgeRatio) * A_remaining

    // Solve: R = (1 - purgeRatio) * (FA0 + R) * (1 - Xpp)
    // R = (1 - purgeRatio) * (1 - Xpp) * FA0 + (1 - purgeRatio) * (1 - Xpp) * R
    // R * [1 - (1-purgeRatio)*(1-Xpp)] = (1-purgeRatio)*(1-Xpp)*FA0
    // R = (1-purgeRatio)*(1-Xpp)*FA0 / [1 - (1-purgeRatio)*(1-Xpp)]

    const alpha = (1 - purgeRatio) * (1 - Xpp);
    if (alpha >= 1) {
      results.style.display = 'block';
      tableDiv.innerHTML = '<p style="color: var(--danger);">Sistema instável: reciclo diverge. Aumente a conversão ou adicione purga.</p>';
      detail.textContent = '';
      return;
    }

    const R_A = (alpha * FA0) / (1 - alpha);

    const FA_mix = FA0 + R_A;
    const FA_out_reactor = FA_mix * (1 - Xpp);
    const FB_out_reactor = nu * FA_mix * Xpp;
    const FB_product = sepFraction * FB_out_reactor;
    const FB_remaining = (1 - sepFraction) * FB_out_reactor;

    const purge_A = purgeRatio * FA_out_reactor;
    const purge_B = purgeRatio * FB_remaining;
    const purge_I = purgeRatio * FI0; // inert in purge (simplified)

    const recycle_A = (1 - purgeRatio) * FA_out_reactor;
    const recycle_B = (1 - purgeRatio) * FB_remaining;

    // Global conversion
    const FA_product = 0; // assume no A in product (perfect sep for A)
    const FA_leaving = purge_A; // A leaves only in purge
    const Xglobal = (FA0 - FA_leaving) / FA0;

    // Build results
    let html = '<table><thead><tr><th>Corrente</th><th>A (mol/s)</th><th>B (mol/s)</th><th>Inerte (mol/s)</th><th>Total (mol/s)</th></tr></thead><tbody>';

    const streams = [
      { name: 'Alim. Fresca (F₀)', a: FA0, b: 0, i: FI0 },
      { name: 'Reciclo (R)', a: recycle_A, b: recycle_B, i: 0 },
      { name: 'Entrada Reator (mix)', a: FA_mix, b: recycle_B, i: FI0 },
      { name: 'Saída Reator', a: FA_out_reactor, b: FB_out_reactor + recycle_B, i: FI0 },
      { name: 'Produto (P)', a: 0, b: FB_product, i: 0 },
      { name: 'Purga', a: purge_A, b: purge_B, i: purge_I },
    ];

    streams.forEach(s => {
      const total = s.a + s.b + s.i;
      const cls = s.name.includes('Produto') ? ' class="highlight"' : '';
      html += `<tr>
        <td${cls}>${s.name}</td>
        <td>${fmt(s.a)}</td>
        <td>${fmt(s.b)}</td>
        <td>${fmt(s.i)}</td>
        <td>${fmt(total)}</td>
      </tr>`;
    });
    html += '</tbody></table>';

    results.style.display = 'block';
    tableDiv.innerHTML = html;
    detail.innerHTML = `
      Conversão por passe: <strong>${(Xpp * 100).toFixed(1)}%</strong> |
      Conversão global: <strong>${(Xglobal * 100).toFixed(1)}%</strong> |
      Razão de reciclo (R/F₀): <strong>${fmt(R_A / FA0)}</strong> |
      ξ (extensão) = <strong>${fmt(FA_mix * Xpp)}</strong> mol/s
    `;
  });

  $('clearRecycle').addEventListener('click', () => {
    $('recycleFeed').value = '';
    $('recycleFeedXa').value = '';
    $('recycleConvPerPass').value = '';
    $('recycleSepEff').value = '';
    $('recyclePurgeRatio').value = '';
    $('recycleStoich').value = '';
    $('recycleResults').style.display = 'none';
  });

})();
