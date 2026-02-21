/**
 * Q-Engineering Hub — Conversor de Unidades
 * Categorias: Temperatura, Pressão, Vazão Mássica, Vazão Volumétrica,
 *             Viscosidade, Massa, Energia, Comprimento, Área, Volume, Densidade
 *
 * Cada categoria define suas unidades com um fator de conversão para uma
 * unidade base (SI). Temperatura usa funções especiais (toBase / fromBase).
 */

(() => {
  'use strict';

  // ======== Conversion Data ========

  const categories = {
    'Temperatura': {
      units: {
        '°C':  { name: 'Celsius' },
        '°F':  { name: 'Fahrenheit' },
        'K':   { name: 'Kelvin' },
        '°R':  { name: 'Rankine' }
      },
      // Base: Kelvin
      toBase: {
        '°C': (v) => v + 273.15,
        '°F': (v) => (v + 459.67) * 5 / 9,
        'K':  (v) => v,
        '°R': (v) => v * 5 / 9
      },
      fromBase: {
        '°C': (v) => v - 273.15,
        '°F': (v) => v * 9 / 5 - 459.67,
        'K':  (v) => v,
        '°R': (v) => v * 9 / 5
      }
    },

    'Pressão': {
      // Base: Pa
      units: {
        'Pa':    { factor: 1 },
        'kPa':   { factor: 1e3 },
        'MPa':   { factor: 1e6 },
        'bar':   { factor: 1e5 },
        'atm':   { factor: 101325 },
        'mmHg':  { factor: 133.322 },
        'psi':   { factor: 6894.757 },
        'Torr':  { factor: 133.322 },
        'inHg':  { factor: 3386.389 },
        'kgf/cm²': { factor: 98066.5 }
      }
    },

    'Vazão Mássica': {
      // Base: kg/s
      units: {
        'kg/s':   { factor: 1 },
        'kg/h':   { factor: 1 / 3600 },
        'kg/min': { factor: 1 / 60 },
        'g/s':    { factor: 1e-3 },
        'g/min':  { factor: 1e-3 / 60 },
        'lb/h':   { factor: 0.45359237 / 3600 },
        'lb/s':   { factor: 0.45359237 },
        't/h':    { factor: 1000 / 3600 }
      }
    },

    'Vazão Volumétrica': {
      // Base: m³/s
      units: {
        'm³/s':   { factor: 1 },
        'm³/h':   { factor: 1 / 3600 },
        'L/s':    { factor: 1e-3 },
        'L/min':  { factor: 1e-3 / 60 },
        'L/h':    { factor: 1e-3 / 3600 },
        'gal/min (US)': { factor: 6.30902e-5 },
        'gal/h (US)':   { factor: 6.30902e-5 / 60 },
        'ft³/s':  { factor: 0.0283168 },
        'ft³/min': { factor: 0.0283168 / 60 },
        'bbl/dia': { factor: 0.158987 / 86400 }
      }
    },

    'Viscosidade': {
      // Base: Pa·s (dinâmica)
      units: {
        'Pa·s':    { factor: 1 },
        'mPa·s':   { factor: 1e-3 },
        'cP':      { factor: 1e-3 },
        'P (Poise)': { factor: 0.1 },
        'lb/(ft·s)': { factor: 1.48816 }
      }
    },

    'Massa': {
      // Base: kg
      units: {
        'kg':  { factor: 1 },
        'g':   { factor: 1e-3 },
        'mg':  { factor: 1e-6 },
        'µg':  { factor: 1e-9 },
        't':   { factor: 1e3 },
        'lb':  { factor: 0.45359237 },
        'oz':  { factor: 0.0283495 },
        'ton (US)': { factor: 907.18474 },
        'ton (UK)': { factor: 1016.047 }
      }
    },

    'Energia': {
      // Base: J
      units: {
        'J':     { factor: 1 },
        'kJ':    { factor: 1e3 },
        'MJ':    { factor: 1e6 },
        'cal':   { factor: 4.184 },
        'kcal':  { factor: 4184 },
        'BTU':   { factor: 1055.06 },
        'kWh':   { factor: 3.6e6 },
        'eV':    { factor: 1.60218e-19 },
        'hp·h':  { factor: 2.6845e6 },
        'ft·lbf': { factor: 1.35582 }
      }
    },

    'Comprimento': {
      // Base: m
      units: {
        'm':   { factor: 1 },
        'cm':  { factor: 1e-2 },
        'mm':  { factor: 1e-3 },
        'µm':  { factor: 1e-6 },
        'km':  { factor: 1e3 },
        'in':  { factor: 0.0254 },
        'ft':  { factor: 0.3048 },
        'yd':  { factor: 0.9144 },
        'mi':  { factor: 1609.344 }
      }
    },

    'Área': {
      // Base: m²
      units: {
        'm²':   { factor: 1 },
        'cm²':  { factor: 1e-4 },
        'mm²':  { factor: 1e-6 },
        'km²':  { factor: 1e6 },
        'ha':   { factor: 1e4 },
        'in²':  { factor: 6.4516e-4 },
        'ft²':  { factor: 0.092903 },
        'yd²':  { factor: 0.836127 },
        'acre': { factor: 4046.86 }
      }
    },

    'Volume': {
      // Base: m³
      units: {
        'm³':   { factor: 1 },
        'cm³':  { factor: 1e-6 },
        'L':    { factor: 1e-3 },
        'mL':   { factor: 1e-6 },
        'gal (US)': { factor: 3.78541e-3 },
        'gal (UK)': { factor: 4.54609e-3 },
        'ft³':  { factor: 0.0283168 },
        'in³':  { factor: 1.63871e-5 },
        'bbl':  { factor: 0.158987 }
      }
    },

    'Densidade': {
      // Base: kg/m³
      units: {
        'kg/m³':  { factor: 1 },
        'g/cm³':  { factor: 1000 },
        'g/L':    { factor: 1 },
        'kg/L':   { factor: 1000 },
        'lb/ft³': { factor: 16.0185 },
        'lb/gal (US)': { factor: 119.826 }
      }
    }
  };

  // ======== DOM References ========
  const pillsContainer  = document.getElementById('categoryPills');
  const inputValue      = document.getElementById('inputValue');
  const unitFrom        = document.getElementById('unitFrom');
  const unitTo          = document.getElementById('unitTo');
  const swapBtn         = document.getElementById('swapBtn');
  const resultValue     = document.getElementById('resultValue');

  let activeCategory = null;

  // ======== Render Category Pills ========
  function renderPills() {
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    Object.keys(categories).forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.className = 'category-pill' + (idx === 0 ? ' active' : '');
      btn.textContent = cat;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => selectCategory(cat, btn));
      pillsContainer.appendChild(btn);
    });

    // Auto-select first
    const firstCat = Object.keys(categories)[0];
    if (firstCat) selectCategory(firstCat, pillsContainer.querySelector('.category-pill'));
  }

  // ======== Select Category ========
  function selectCategory(catName, pillEl) {
    activeCategory = catName;

    // Update pill styles
    pillsContainer.querySelectorAll('.category-pill').forEach((p) => {
      p.classList.remove('active');
      p.setAttribute('aria-selected', 'false');
    });
    if (pillEl) {
      pillEl.classList.add('active');
      pillEl.setAttribute('aria-selected', 'true');
    }

    // Populate selects
    const cat = categories[catName];
    const unitKeys = Object.keys(cat.units);

    populateSelect(unitFrom, unitKeys, 0);
    populateSelect(unitTo, unitKeys, unitKeys.length > 1 ? 1 : 0);

    convert();
  }

  function populateSelect(selectEl, options, defaultIdx) {
    selectEl.innerHTML = '';
    options.forEach((opt, i) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (i === defaultIdx) o.selected = true;
      selectEl.appendChild(o);
    });
  }

  // ======== Conversion Logic ========
  function convert() {
    if (!activeCategory) return;

    const val = parseFloat(inputValue.value);
    if (isNaN(val)) {
      resultValue.textContent = '—';
      return;
    }

    const from = unitFrom.value;
    const to   = unitTo.value;
    const cat  = categories[activeCategory];

    let result;

    if (cat.toBase && cat.fromBase) {
      // Temperature (special)
      const baseVal = cat.toBase[from](val);
      result = cat.fromBase[to](baseVal);
    } else {
      // Linear factor conversion
      const fromFactor = cat.units[from].factor;
      const toFactor   = cat.units[to].factor;
      result = val * fromFactor / toFactor;
    }

    // Format result
    resultValue.textContent = formatNumber(result) + ' ' + to;
  }

  function formatNumber(num) {
    if (num === 0) return '0';
    const abs = Math.abs(num);
    if (abs >= 1e6 || abs < 1e-4) {
      return num.toExponential(6);
    }
    // Up to 8 significant digits
    return parseFloat(num.toPrecision(8)).toString();
  }

  // ======== Swap Units ========
  function swap() {
    const tempVal = unitFrom.value;
    unitFrom.value = unitTo.value;
    unitTo.value = tempVal;
    convert();
  }

  // ======== Event Listeners ========
  inputValue.addEventListener('input', convert);
  unitFrom.addEventListener('change', convert);
  unitTo.addEventListener('change', convert);
  swapBtn.addEventListener('click', swap);

  // ======== Init ========
  renderPills();
})();
