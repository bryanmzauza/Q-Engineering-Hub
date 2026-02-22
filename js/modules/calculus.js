/**
 * Q-Engineering Hub — Calculus Module
 * Handles topic filtering via pill navigation
 */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const pills = document.querySelectorAll('.topic-pill[data-topic]');
    const sections = document.querySelectorAll('.formula-section[data-section]');

    if (!pills.length || !sections.length) return;

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const topic = pill.getAttribute('data-topic');

        // Update active pill
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        // Show/hide sections
        if (topic === 'all') {
          sections.forEach((s) => (s.style.display = ''));
        } else {
          sections.forEach((s) => {
            s.style.display = s.getAttribute('data-section') === topic ? '' : 'none';
          });
        }
      });
    });
  });
})();
