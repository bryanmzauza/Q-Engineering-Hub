/**
 * Q-Engineering Hub — Main Navigation & Global Logic
 * Handles: mobile menu toggle, sidebar toggle, active link detection
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---- Mobile Menu Toggle ----
  const menuToggle = document.getElementById('menuToggle');
  const headerNav = document.getElementById('headerNav');

  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', () => {
      headerNav.classList.toggle('open');
      const isOpen = headerNav.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });
  }

  // ---- Sidebar Toggle (module pages) ----
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ---- Sidebar Collapse (desktop) ----
  if (sidebar) {
    // Create collapse toggle button
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'sidebar-collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Recolher menu lateral');
    collapseBtn.innerHTML =
      '<span class="collapse-icon">«</span><span class="collapse-label">Recolher</span>';
    sidebar.appendChild(collapseBtn);

    // Add title tooltips for collapsed state
    sidebar.querySelectorAll('.sidebar-nav a').forEach((link) => {
      link.title = link.textContent.trim();
    });

    const mql = window.matchMedia('(min-width: 769px)');

    const applyCollapsedState = () => {
      if (mql.matches && localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        collapseBtn.querySelector('.collapse-icon').textContent = '»';
        collapseBtn.setAttribute('aria-label', 'Expandir menu lateral');
      } else {
        sidebar.classList.remove('collapsed');
        collapseBtn.querySelector('.collapse-icon').textContent = '«';
        collapseBtn.setAttribute('aria-label', 'Recolher menu lateral');
      }
    };

    applyCollapsedState();
    mql.addEventListener('change', applyCollapsedState);

    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const collapsed = sidebar.classList.contains('collapsed');
      collapseBtn.querySelector('.collapse-icon').textContent = collapsed
        ? '»'
        : '«';
      collapseBtn.setAttribute(
        'aria-label',
        collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
      );
      localStorage.setItem('sidebarCollapsed', collapsed);
    });
  }

  // ---- Highlight Active Sidebar Link ----
  const currentPage = window.location.pathname.split('/').pop();
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });

  // ---- Highlight Active Header Link ----
  const headerLinks = document.querySelectorAll('.header-nav a');

  headerLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http')) {
      const linkPage = href.split('/').pop();
      if (linkPage === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });
});
