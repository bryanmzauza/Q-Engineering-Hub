/**
 * Q-Engineering Hub — Energy Balance Module
 * Calculators: sensible heat, phase change, heat exchanger (LMTD), adiabatic temperature
 */
(() => {
  'use strict';

  // ======== Tab Navigation ========
  const tabs = document.querySelectorAll('.eb-tab');
  const panels = document.querySelectorAll('.eb-panel');

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
    if (!el) return null;
    const v = parseFloat(el.value);
    return isNaN(v) ? null : v;
  };
  const fmt = (n, d = 4) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(d);
    return parseFloat(n.toFixed(d)).toString();
  };
  const fmtW = (watts) => {
    const abs = Math.abs(watts);
    if (abs >= 1e6) return fmt(watts / 1e6, 2) + ' MW';
    if (abs >= 1e3) return fmt(watts / 1e3, 2) + ' kW';
    return fmt(watts, 2) + ' W';
  };

  // ======== Basis label update helpers ========
  function updateSensibleLabels() {
    const basis = $('shBasis').value;
    if (basis === 'mass') {
      $('shFlowLabel').textContent = 'Vazão (kg/s)';
      $('shCpLabel').textContent = 'Cp (J/kg·K)';
    } else {
      $('shFlowLabel').textContent = 'Vazão (mol/s)';
      $('shCpLabel').textContent = 'Cp (J/mol·K)';
    }
  }

  function updatePhaseLabels() {
    const basis = $('phBasis').value;
    if (basis === 'mass') {
      $('phFlowLabel').textContent = 'Vazão (kg/s)';
      $('phCpLiqLabel').textContent = 'Cp líquido (J/kg·K)';
      $('phCpVapLabel').textContent = 'Cp vapor (J/kg·K)';
      $('phHvapLabel').textContent = 'ΔHvap (J/kg)';
    } else {
      $('phFlowLabel').textContent = 'Vazão (mol/s)';
      $('phCpLiqLabel').textContent = 'Cp líquido (J/mol·K)';
      $('phCpVapLabel').textContent = 'Cp vapor (J/mol·K)';
      $('phHvapLabel').textContent = 'ΔHvap (J/mol)';
    }
  }

  $('shBasis').addEventListener('change', updateSensibleLabels);
  $('phBasis').addEventListener('change', updatePhaseLabels);

  // ======================================
  // 1) SENSIBLE HEAT: Q = m * Cp * ΔT
  // ======================================

  $('solveSensible').addEventListener('click', () => {
    const flow = numVal($('shFlow'));
    const cp = numVal($('shCp'));
    const t1 = numVal($('shT1'));
    const t2 = numVal($('shT2'));
    const q = numVal($('shQ'));

    const values = [flow, cp, t1, t2, q];
    const nullCount = values.filter(v => v === null).length;

    const results = $('sensibleResults');
    const resultVal = $('sensibleResultValue');
    const resultDetail = $('sensibleResultDetail');
    results.style.display = 'block';

    if (nullCount === 0) {
      // Verify consistency
      const qCalc = flow * cp * (t2 - t1);
      const diff = Math.abs(qCalc - q);
      if (diff < Math.abs(q) * 0.001 + 0.01) {
        resultVal.textContent = '✓ Balanço consistente';
        resultVal.style.color = 'var(--success)';
        resultDetail.textContent = `Q = ${fmtW(q)} | Verificação: ṁ·Cp·ΔT = ${fmtW(qCalc)}`;
      } else {
        resultVal.textContent = '✗ Valores inconsistentes';
        resultVal.style.color = 'var(--danger)';
        resultDetail.textContent = `Q informado = ${fmtW(q)} ≠ ṁ·Cp·ΔT = ${fmtW(qCalc)} | Diferença: ${fmtW(diff)}`;
      }
    } else if (nullCount === 1) {
      let solved, label, unit;
      const basis = $('shBasis').value;
      const flowUnit = basis === 'mass' ? 'kg/s' : 'mol/s';
      const cpUnit = basis === 'mass' ? 'J/(kg·K)' : 'J/(mol·K)';

      if (q === null) {
        solved = flow * cp * (t2 - t1);
        label = 'Q';
        unit = '';
        $('shQ').value = parseFloat(solved.toFixed(6));
        resultVal.textContent = fmtW(solved);
        resultVal.style.color = 'var(--accent)';
        resultDetail.textContent = `${label} = ṁ × Cp × (T₂ − T₁) = ${fmt(flow)} × ${fmt(cp)} × (${fmt(t2)} − ${fmt(t1)}) = ${fmtW(solved)}`;
      } else if (t2 === null) {
        if (flow === 0 || cp === 0) {
          resultVal.textContent = '⚠ Divisão por zero';
          resultVal.style.color = 'var(--warning)';
          resultDetail.textContent = 'Vazão e Cp devem ser diferentes de zero para calcular T₂.';
          return;
        }
        solved = t1 + q / (flow * cp);
        $('shT2').value = parseFloat(solved.toFixed(4));
        resultVal.textContent = `${fmt(solved, 2)} °C`;
        resultVal.style.color = 'var(--accent)';
        resultDetail.textContent = `T₂ = T₁ + Q/(ṁ·Cp) = ${fmt(t1)} + ${fmtW(q)}/(${fmt(flow)} × ${fmt(cp)}) = ${fmt(solved, 2)} °C`;
      } else if (t1 === null) {
        if (flow === 0 || cp === 0) {
          resultVal.textContent = '⚠ Divisão por zero';
          resultVal.style.color = 'var(--warning)';
          resultDetail.textContent = 'Vazão e Cp devem ser diferentes de zero para calcular T₁.';
          return;
        }
        solved = t2 - q / (flow * cp);
        $('shT1').value = parseFloat(solved.toFixed(4));
        resultVal.textContent = `${fmt(solved, 2)} °C`;
        resultVal.style.color = 'var(--accent)';
        resultDetail.textContent = `T₁ = T₂ − Q/(ṁ·Cp) = ${fmt(t2)} − ${fmtW(q)}/(${fmt(flow)} × ${fmt(cp)}) = ${fmt(solved, 2)} °C`;
      } else if (cp === null) {
        const dt = t2 - t1;
        if (flow === 0 || dt === 0) {
          resultVal.textContent = '⚠ Divisão por zero';
          resultVal.style.color = 'var(--warning)';
          resultDetail.textContent = 'Vazão e ΔT devem ser diferentes de zero para calcular Cp.';
          return;
        }
        solved = q / (flow * dt);
        $('shCp').value = parseFloat(solved.toFixed(4));
        resultVal.textContent = `${fmt(solved, 2)} ${cpUnit}`;
        resultVal.style.color = 'var(--accent)';
        resultDetail.textContent = `Cp = Q/(ṁ·ΔT) = ${fmtW(q)}/(${fmt(flow)} × ${fmt(dt)}) = ${fmt(solved, 2)} ${cpUnit}`;
      } else if (flow === null) {
        const dt = t2 - t1;
        if (cp === 0 || dt === 0) {
          resultVal.textContent = '⚠ Divisão por zero';
          resultVal.style.color = 'var(--warning)';
          resultDetail.textContent = 'Cp e ΔT devem ser diferentes de zero para calcular a vazão.';
          return;
        }
        solved = q / (cp * dt);
        $('shFlow').value = parseFloat(solved.toFixed(6));
        resultVal.textContent = `${fmt(solved, 4)} ${flowUnit}`;
        resultVal.style.color = 'var(--accent)';
        resultDetail.textContent = `Vazão = Q/(Cp·ΔT) = ${fmtW(q)}/(${fmt(cp)} × ${fmt(dt)}) = ${fmt(solved, 4)} ${flowUnit}`;
      }
    } else {
      resultVal.textContent = '⚠ Muitas incógnitas';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = `Encontradas ${nullCount} incógnitas. Deixe apenas 1 campo em branco para resolver.`;
    }
  });

  $('clearSensible').addEventListener('click', () => {
    ['shFlow', 'shCp', 'shT1', 'shT2', 'shQ'].forEach(id => $(id).value = '');
    $('sensibleResults').style.display = 'none';
  });

  // ======================================
  // 2) PHASE CHANGE
  // ======================================

  $('solvePhase').addEventListener('click', () => {
    const flow = numVal($('phFlow'));
    const cpLiq = numVal($('phCpLiq'));
    const cpVap = numVal($('phCpVap'));
    const t1 = numVal($('phT1'));
    const t2 = numVal($('phT2'));
    const tb = numVal($('phTb'));
    const hvap = numVal($('phHvap'));

    const results = $('phaseResults');
    const resultVal = $('phaseResultValue');
    const resultDetail = $('phaseResultDetail');
    const stepsDiv = $('phaseSteps');
    const stepsItems = $('phaseStepItems');

    results.style.display = 'block';

    if (flow === null || cpLiq === null || t1 === null || t2 === null || tb === null || hvap === null) {
      resultVal.textContent = '⚠ Dados insuficientes';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = 'Preencha todos os campos obrigatórios: vazão, Cp líquido, T1, T2, Tb e ΔHvap.';
      stepsDiv.style.display = 'none';
      return;
    }

    const steps = [];
    let totalQ = 0;
    const isHeating = t2 > t1;

    if (isHeating) {
      // Heating: T1 → T2
      if (t1 < tb && t2 > tb) {
        // Crosses boiling point: liquid → vaporization → vapor
        const qLiq = flow * cpLiq * (tb - t1);
        const qVap_latent = flow * hvap;
        const qVap_sens = (cpVap !== null) ? flow * cpVap * (t2 - tb) : 0;
        totalQ = qLiq + qVap_latent + qVap_sens;

        steps.push({ label: `Líquido: ${fmt(t1, 1)} °C → ${fmt(tb, 1)} °C`, value: fmtW(qLiq) });
        steps.push({ label: `Vaporização a ${fmt(tb, 1)} °C`, value: fmtW(qVap_latent) });
        if (cpVap !== null && t2 > tb) {
          steps.push({ label: `Vapor: ${fmt(tb, 1)} °C → ${fmt(t2, 1)} °C`, value: fmtW(qVap_sens) });
        }
        steps.push({ label: 'Q total', value: fmtW(totalQ) });
      } else if (t1 >= tb) {
        // Entirely vapor phase
        const cp = cpVap !== null ? cpVap : cpLiq;
        totalQ = flow * cp * (t2 - t1);
        steps.push({ label: `Vapor: ${fmt(t1, 1)} °C → ${fmt(t2, 1)} °C`, value: fmtW(totalQ) });
        steps.push({ label: 'Q total', value: fmtW(totalQ) });
      } else {
        // Entirely liquid phase (t2 <= tb)
        totalQ = flow * cpLiq * (t2 - t1);
        steps.push({ label: `Líquido: ${fmt(t1, 1)} °C → ${fmt(t2, 1)} °C`, value: fmtW(totalQ) });
        steps.push({ label: 'Q total', value: fmtW(totalQ) });
      }
    } else {
      // Cooling: T1 → T2 (T1 > T2)
      if (t1 > tb && t2 < tb) {
        // Crosses boiling point: vapor → condensation → liquid
        const qVap_sens = (cpVap !== null) ? flow * cpVap * (tb - t1) : 0; // negative
        const qCond = -flow * hvap; // condensation releases heat (negative Q)
        const qLiq = flow * cpLiq * (t2 - tb); // negative
        totalQ = qVap_sens + qCond + qLiq;

        if (cpVap !== null) {
          steps.push({ label: `Vapor: ${fmt(t1, 1)} °C → ${fmt(tb, 1)} °C`, value: fmtW(qVap_sens) });
        }
        steps.push({ label: `Condensação a ${fmt(tb, 1)} °C`, value: fmtW(qCond) });
        steps.push({ label: `Líquido: ${fmt(tb, 1)} °C → ${fmt(t2, 1)} °C`, value: fmtW(qLiq) });
        steps.push({ label: 'Q total', value: fmtW(totalQ) });
      } else if (t1 <= tb) {
        // Entirely liquid phase
        totalQ = flow * cpLiq * (t2 - t1);
        steps.push({ label: `Líquido: ${fmt(t1, 1)} °C → ${fmt(t2, 1)} °C`, value: fmtW(totalQ) });
        steps.push({ label: 'Q total', value: fmtW(totalQ) });
      } else {
        // Entirely vapor phase (t2 >= tb)
        const cp = cpVap !== null ? cpVap : cpLiq;
        totalQ = flow * cp * (t2 - t1);
        steps.push({ label: `Vapor: ${fmt(t1, 1)} °C → ${fmt(t2, 1)} °C`, value: fmtW(totalQ) });
        steps.push({ label: 'Q total', value: fmtW(totalQ) });
      }
    }

    resultVal.textContent = fmtW(totalQ);
    resultVal.style.color = 'var(--accent)';

    const type = totalQ > 0 ? 'Aquecimento' : (totalQ < 0 ? 'Resfriamento' : 'Nenhuma troca');
    const crossesPhase = (isHeating && t1 < tb && t2 > tb) || (!isHeating && t1 > tb && t2 < tb);
    resultDetail.textContent = `${type} | ΔT = ${fmt(t2 - t1, 1)} °C | ${crossesPhase ? 'Com mudança de fase' : 'Sem mudança de fase'}`;

    // Show step breakdown
    stepsDiv.style.display = 'block';
    stepsItems.innerHTML = steps.map(s =>
      `<div class="step-item"><span>${s.label}</span><span>${s.value}</span></div>`
    ).join('');
  });

  $('clearPhase').addEventListener('click', () => {
    ['phFlow', 'phCpLiq', 'phCpVap', 'phT1', 'phT2', 'phTb', 'phHvap'].forEach(id => $(id).value = '');
    $('phaseResults').style.display = 'none';
    $('phaseSteps').style.display = 'none';
  });

  // ======================================
  // 3) HEAT EXCHANGER — LMTD
  // ======================================

  $('solveExchanger').addEventListener('click', () => {
    const config = $('hxConfig').value; // 'counter' or 'parallel'
    const mh = numVal($('hxMh'));
    const cph = numVal($('hxCph'));
    const thi = numVal($('hxThi'));
    let tho = numVal($('hxTho'));
    const mc = numVal($('hxMc'));
    const cpc = numVal($('hxCpc'));
    const tci = numVal($('hxTci'));
    let tco = numVal($('hxTco'));
    const U = numVal($('hxU'));
    const A = numVal($('hxA'));

    const results = $('exchangerResults');
    const resultVal = $('exchangerResultValue');
    const resultDetail = $('exchangerResultDetail');
    const stepsDiv = $('exchangerSteps');
    const stepsItems = $('exchangerStepItems');

    results.style.display = 'block';

    // Validate minimum required inputs
    if (mh === null || cph === null || thi === null || mc === null || cpc === null || tci === null) {
      resultVal.textContent = '⚠ Dados insuficientes';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = 'Forneça pelo menos: vazões, Cp e temperaturas de entrada de ambos os fluidos.';
      stepsDiv.style.display = 'none';
      return;
    }

    const Ch = mh * cph; // W/K (heat capacity rate of hot)
    const Cc = mc * cpc; // W/K (heat capacity rate of cold)

    // Try to solve for missing outlet temperatures
    let Q = null;

    if (tho !== null && tco !== null) {
      // Both outlets known — compute Q from hot side
      Q = Ch * (thi - tho);
    } else if (tho !== null && tco === null) {
      // Know hot outlet, solve cold outlet
      Q = Ch * (thi - tho);
      tco = tci + Q / Cc;
      $('hxTco').value = parseFloat(tco.toFixed(4));
    } else if (tho === null && tco !== null) {
      // Know cold outlet, solve hot outlet
      Q = Cc * (tco - tci);
      tho = thi - Q / Ch;
      $('hxTho').value = parseFloat(tho.toFixed(4));
    } else {
      // Both outlets unknown — need Q or U+A to solve
      if (U !== null && A !== null) {
        // Use NTU-ε method for iterative solve
        // For simplicity, solve iteratively
        const Cmin = Math.min(Ch, Cc);
        const Cmax = Math.max(Ch, Cc);
        const Cr = Cmin / Cmax;
        const NTU = U * A / Cmin;
        let epsilon;

        if (config === 'counter') {
          if (Math.abs(Cr - 1) < 1e-10) {
            epsilon = NTU / (1 + NTU);
          } else {
            epsilon = (1 - Math.exp(-NTU * (1 - Cr))) / (1 - Cr * Math.exp(-NTU * (1 - Cr)));
          }
        } else {
          // Parallel flow
          epsilon = (1 - Math.exp(-NTU * (1 + Cr))) / (1 + Cr);
        }

        Q = epsilon * Cmin * (thi - tci);
        tho = thi - Q / Ch;
        tco = tci + Q / Cc;
        $('hxTho').value = parseFloat(tho.toFixed(4));
        $('hxTco').value = parseFloat(tco.toFixed(4));
      } else {
        resultVal.textContent = '⚠ Dados insuficientes';
        resultVal.style.color = 'var(--warning)';
        resultDetail.textContent = 'Forneça pelo menos uma temperatura de saída, ou U e A para usar o método ε-NTU.';
        stepsDiv.style.display = 'none';
        return;
      }
    }

    // Compute LMTD
    let dT1, dT2;
    if (config === 'counter') {
      dT1 = thi - tco;
      dT2 = tho - tci;
    } else {
      dT1 = thi - tci;
      dT2 = tho - tco;
    }

    // Check for temperature cross
    if (dT1 <= 0 || dT2 <= 0) {
      resultVal.textContent = '⚠ Cruzamento de temperatura';
      resultVal.style.color = 'var(--danger)';
      resultDetail.textContent = `ΔT₁ = ${fmt(dT1, 2)} °C, ΔT₂ = ${fmt(dT2, 2)} °C — ambos devem ser positivos. Verifique os dados.`;
      stepsDiv.style.display = 'none';
      return;
    }

    let LMTD;
    if (Math.abs(dT1 - dT2) < 0.001) {
      LMTD = dT1; // Special case: equal ΔTs
    } else {
      LMTD = (dT1 - dT2) / Math.log(dT1 / dT2);
    }

    $('hxQ').value = parseFloat(Q.toFixed(2));

    // Compute area or U
    let solvedArea = null, solvedU = null;
    if (U !== null && A === null) {
      solvedArea = Q / (U * LMTD);
      $('hxA').value = parseFloat(solvedArea.toFixed(4));
    } else if (U === null && A !== null) {
      solvedU = Q / (A * LMTD);
    }

    resultVal.textContent = fmtW(Q);
    resultVal.style.color = 'var(--accent)';

    const configLabel = config === 'counter' ? 'Contracorrente' : 'Paralelo';
    resultDetail.textContent = `Configuração: ${configLabel} | Q = ${fmtW(Q)}`;

    // Step breakdown
    const stepData = [
      { label: 'Q (taxa de calor)', value: fmtW(Q) },
      { label: 'Th,in → Th,out', value: `${fmt(thi, 1)} → ${fmt(tho, 1)} °C` },
      { label: 'Tc,in → Tc,out', value: `${fmt(tci, 1)} → ${fmt(tco, 1)} °C` },
      { label: 'ΔT₁', value: `${fmt(dT1, 2)} °C` },
      { label: 'ΔT₂', value: `${fmt(dT2, 2)} °C` },
      { label: 'ΔTLMTD', value: `${fmt(LMTD, 2)} °C` },
    ];

    if (U !== null) stepData.push({ label: 'U (coef. global)', value: `${fmt(U, 2)} W/(m²·K)` });
    if (solvedArea !== null) {
      stepData.push({ label: 'A (área calculada)', value: `${fmt(solvedArea, 3)} m²` });
    } else if (A !== null) {
      stepData.push({ label: 'A (área fornecida)', value: `${fmt(A, 3)} m²` });
    }
    if (solvedU !== null) {
      stepData.push({ label: 'U (calculado)', value: `${fmt(solvedU, 2)} W/(m²·K)` });
    }

    stepsDiv.style.display = 'block';
    stepsItems.innerHTML = stepData.map(s =>
      `<div class="step-item"><span>${s.label}</span><span>${s.value}</span></div>`
    ).join('');
  });

  $('clearExchanger').addEventListener('click', () => {
    ['hxMh', 'hxCph', 'hxThi', 'hxTho', 'hxMc', 'hxCpc', 'hxTci', 'hxTco', 'hxU', 'hxA', 'hxQ'].forEach(id => $(id).value = '');
    $('exchangerResults').style.display = 'none';
    $('exchangerSteps').style.display = 'none';
  });

  // ======================================
  // 4) ADIABATIC REACTION TEMPERATURE
  // ======================================

  $('solveAdiabatic').addEventListener('click', () => {
    const FA0 = numVal($('adFA0'));
    const X = numVal($('adX'));
    const dHrxn = numVal($('adDHrxn'));
    const Tin = numVal($('adTin'));
    const sumFCp = numVal($('adSumFCp'));

    const results = $('adiabaticResults');
    const resultVal = $('adiabaticResultValue');
    const resultDetail = $('adiabaticResultDetail');
    results.style.display = 'block';

    if (FA0 === null || X === null || dHrxn === null || Tin === null || sumFCp === null) {
      resultVal.textContent = '⚠ Dados insuficientes';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = 'Preencha todos os campos: FA0, X, ΔHrxn, Tin e ΣFi·Cpi.';
      return;
    }

    if (sumFCp === 0) {
      resultVal.textContent = '⚠ Divisão por zero';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = 'ΣFi·Cpi não pode ser zero.';
      return;
    }

    // Tad = Tin + (-ΔHrxn) * X * FA0 / ΣFi·Cpi
    const Tad = Tin + (-dHrxn) * X * FA0 / sumFCp;
    const deltaT = Tad - Tin;
    const qRxn = dHrxn * X * FA0; // heat released/absorbed by reaction

    resultVal.textContent = `${fmt(Tad, 2)} °C`;
    resultVal.style.color = 'var(--accent)';

    const rxnType = dHrxn < 0 ? 'exotérmica' : (dHrxn > 0 ? 'endotérmica' : 'atérmica');
    resultDetail.textContent = `Reação ${rxnType} | ΔT = ${fmt(deltaT, 2)} °C | Calor da reação: ${fmtW(Math.abs(qRxn))} | ξ·ΔHrxn = ${fmt(qRxn, 2)} W`;
  });

  $('clearAdiabatic').addEventListener('click', () => {
    ['adFA0', 'adX', 'adDHrxn', 'adTin', 'adSumFCp'].forEach(id => $(id).value = '');
    $('adiabaticResults').style.display = 'none';
  });

  // ======================================
  // 5) ADIABATIC MIXING TEMPERATURE
  // ======================================

  $('solveMix').addEventListener('click', () => {
    const m1 = numVal($('mixM1'));
    const cp1 = numVal($('mixCp1'));
    const t1 = numVal($('mixT1'));
    const m2 = numVal($('mixM2'));
    const cp2 = numVal($('mixCp2'));
    const t2 = numVal($('mixT2'));

    const results = $('mixResults');
    const resultVal = $('mixResultValue');
    const resultDetail = $('mixResultDetail');
    results.style.display = 'block';

    if (m1 === null || cp1 === null || t1 === null || m2 === null || cp2 === null || t2 === null) {
      resultVal.textContent = '⚠ Dados insuficientes';
      resultVal.style.color = 'var(--warning)';
      resultDetail.textContent = 'Preencha todos os campos das duas correntes.';
      return;
    }

    const denom = m1 * cp1 + m2 * cp2;
    if (denom === 0) {
      resultVal.textContent = '⚠ Erro';
      resultVal.style.color = 'var(--danger)';
      resultDetail.textContent = 'ṁ₁·Cp₁ + ṁ₂·Cp₂ = 0 — impossível calcular.';
      return;
    }

    const Tm = (m1 * cp1 * t1 + m2 * cp2 * t2) / denom;
    const totalFlow = m1 + m2;

    resultVal.textContent = `${fmt(Tm, 2)} °C`;
    resultVal.style.color = 'var(--accent)';
    resultDetail.textContent = `Tm = (ṁ₁Cp₁T₁ + ṁ₂Cp₂T₂) / (ṁ₁Cp₁ + ṁ₂Cp₂) = ${fmt(Tm, 2)} °C | Vazão total: ${fmt(totalFlow, 4)} kg/s`;
  });

  $('clearMix').addEventListener('click', () => {
    ['mixM1', 'mixCp1', 'mixT1', 'mixM2', 'mixCp2', 'mixT2'].forEach(id => $(id).value = '');
    $('mixResults').style.display = 'none';
  });

})();
