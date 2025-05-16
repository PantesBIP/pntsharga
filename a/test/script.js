// Configurations
const SPREADSHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?output=csv';

const SHEET_CONFIG = {
  harga: { gid: '216173443', name: 'Harga' },
  runningText: { gid: '1779766141', name: 'RunningText' },
  iklan: { gid: '1303897065', name: 'Iklan' }
};

// State management
const state = {
  currentTableType: 'emas',
  tableData: {},
  runningTextData: [],
  currentAdIndex: 0,
  adRotationInterval: null,
  adRotationSpeed: 10000, // 10 detik default
  activeAds: []
};

// Cache DOM elements
const DOM = {
  runningText: document.querySelector('.running-text'),
  emasTableLeft: document.getElementById('emasTableLeft'),
  emasTableRight: document.getElementById('emasTableRight'),
  mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
  gamerNav: document.querySelector('.gamer-nav'),
  tableHeaders: document.querySelectorAll('.table-wrapper h3'),
  adLeft: document.getElementById('adLeft'),
  adRight: document.getElementById('adRight')
};

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function getIconForText(text) {
  if (!text) return 'fa-info-circle';
  
  const lowerText = text.toLowerCase();
  const iconMap = {
    'harga|update': 'fa-sync-alt',
    'beli|jual': 'fa-shopping-cart',
    'konsultasi|info': 'fa-comments',
    'promo|diskon': 'fa-tag'
  };

  for (const [keywords, icon] of Object.entries(iconMap)) {
    if (new RegExp(keywords).test(lowerText)) {
      return icon;
    }
  }
  
  return 'fa-info-circle';
}

function getRandomColor() {
  const colors = ['#ffd700', '#00ffff', '#ff6b6b', '#51cf66', '#fcc419', '#748ffc'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
  initializeMobileMenu();
  loadData();
  setInterval(rotateTables, 25000);
});

// Mobile menu functionality
function initializeMobileMenu() {
  if (!DOM.mobileMenuBtn || !DOM.gamerNav) return;

  DOM.mobileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    DOM.gamerNav.classList.toggle('active');
    DOM.mobileMenuBtn.innerHTML = DOM.gamerNav.classList.contains('active') 
      ? '<i class="fas fa-times"></i>' 
      : '<i class="fas fa-bars"></i>';
  });

  document.addEventListener('click', function() {
    DOM.gamerNav.classList.remove('active');
    DOM.mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
  });

  DOM.gamerNav.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

// Data loading
async function loadData() {
  try {
    await Promise.all([
      loadPriceData(),
      loadRunningTextData(),
      loadAds()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
    showError();
  }
}

function getSheetUrl(sheetType) {
  return `${SPREADSHEET_BASE}&gid=${SHEET_CONFIG[sheetType].gid}`;
}

// Price table functions
async function loadPriceData() {
  try {
    const response = await fetch(getSheetUrl('harga'));
    if (!response.ok) throw new Error('Network response was not ok');
    
    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);

    state.tableData = {
      emas: data.filter(row => row.tipe?.toLowerCase() === 'emas'),
      antam: data.filter(row => row.tipe?.toLowerCase() === 'antam'),
      archi: data.filter(row => row.tipe?.toLowerCase() === 'archi')
    };

    displayTables(state.currentTableType);
  } catch (error) {
    console.error('Error loading price data:', error);
    throw error;
  }
}

function parseCSVToJSON(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};

    headers.forEach((header, index) => {
      let value = values[index] || '';
      if (['harga_jual', 'buyback'].includes(header)) {
        value = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
      }
      obj[header] = value;
    });

    return obj;
  });
}

// Running text functions
async function loadRunningTextData() {
  try {
    const response = await fetch(getSheetUrl('runningText'));
    if (!response.ok) throw new Error('Network response was not ok');

    const csvText = await response.text();
    const lines = csvText.trim().split('\n').slice(1); // Skip header

    state.runningTextData = lines
      .map(line => line.split(',')[0]?.trim())
      .filter(Boolean)
      .map(text => ({
        text: text,
        icon: getIconForText(text),
        color: getRandomColor()
      }));

    updateRunningText();
  } catch (error) {
    console.error('Error loading running text:', error);
    state.runningTextData = [
      { text: "Harga emas diperbarui real-time", icon: "fa-sync-alt", color: "#00ffff" },
      { text: "Konsultasi investasi gratis", icon: "fa-comments", color: "#ffd700" }
    ];
    updateRunningText();
    throw error;
  }
}

function updateRunningText() {
  if (!DOM.runningText) return;

  if (!state.runningTextData.length) {
    DOM.runningText.style.display = 'none';
    return;
  }

  // Duplicate items for seamless looping
  const displayItems = [...state.runningTextData, ...state.runningTextData];

  DOM.runningText.innerHTML = displayItems.map(item => 
    `<span style="color: ${item.color}"> <i class="fas ${item.icon}"></i> ${item.text} </span>`
  ).join('');

  // Calculate animation duration based on content length
  const contentWidth = DOM.runningText.scrollWidth / 2;
  const duration = Math.max(30, contentWidth / 50); // 50px per second

  DOM.runningText.style.animationDuration = `${duration}s`;
  DOM.runningText.style.display = 'flex';

  // Add hover effects
  setupRunningTextHover();
}

function setupRunningTextHover() {
  if (!DOM.runningText) return;

  const handleMouseEnter = () => {
    DOM.runningText.style.animationPlayState = 'paused';
    DOM.runningText.querySelectorAll('span').forEach(span => {
      span.style.textShadow = '0 0 8px currentColor';
    });
  };

  const handleMouseLeave = () => {
    DOM.runningText.style.animationPlayState = 'running';
    DOM.runningText.querySelectorAll('span').forEach(span => {
      span.style.textShadow = 'none';
    });
  };

  // Remove existing listeners to avoid duplicates
  DOM.runningText.removeEventListener('mouseenter', handleMouseEnter);
  DOM.runningText.removeEventListener('mouseleave', handleMouseLeave);

  // Add new listeners
  DOM.runningText.addEventListener('mouseenter', handleMouseEnter);
  DOM.runningText.addEventListener('mouseleave', handleMouseLeave);
}

// Ad functions
async function loadAds() {
  try {
    const response = await fetch(getSheetUrl('iklan'));
    if (!response.ok) throw new Error('Gagal memuat data iklan');

    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);

    // Filter active ads and parse duration
    state.activeAds = data
      .filter(ad => ad.status === 'active')
      .map(ad => ({
        ...ad,
        durasi: ad.durasi ? parseInt(ad.durasi) : state.adRotationSpeed
      }));

    if (state.activeAds.length > 0) {
      startAdRotation();
      setupAdHoverEffect();
    } else {
      displayDefaultAds();
    }
  } catch (error) {
    console.error('Error loading ads:', error);
    displayDefaultAds();
    throw error;
  }
}

function startAdRotation() {
  // Clear existing interval
  if (state.adRotationInterval) {
    clearInterval(state.adRotationInterval);
  }

  // Show first ads
  showNextAd();
}

function showNextAd() {
  if (!state.activeAds.length) return;

  // Update index (loop back to 0 if at end)
  state.currentAdIndex = (state.currentAdIndex + 1) % state.activeAds.length;
  const currentAd = state.activeAds[state.currentAdIndex];

  // Display ads
  displayAd('adLeft', currentAd);

  // Show next ad in right container (or first if at end)
  const nextAd = state.activeAds[(state.currentAdIndex + 1) % state.activeAds.length];
  displayAd('adRight', nextAd);

  // Set timeout for next rotation
  state.adRotationInterval = setTimeout(
    showNextAd,
    currentAd.durasi || state.adRotationSpeed
  );
}

function displayAd(containerId, adData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const contentElement = container.querySelector('.ad-content');
  if (!contentElement) return;

  // Add fade out effect
  contentElement.classList.add('hidden');

  // After fade out completes, update content
  setTimeout(() => {
    const videoHtml = adData.video_url
      ? `<div class="ad-video-container"> <iframe src="${getEmbedUrl(adData.video_url)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> </div>`
      : '';

    contentElement.innerHTML = `
      ${videoHtml}
      <h4 class="ad-title">${adData.judul || 'Iklan Sponsor'}</h4>
      <p class="ad-description">${adData.deskripsi || ''}</p>
      ${adData.link ? `<a href="${adData.link}" target="_blank" class="ad-link">${adData.link_text || 'Kunjungi'}</a>` : ''}
    `;

    // Add fade in effect after short delay
    setTimeout(() => {
      contentElement.classList.remove('hidden');
    }, 50);
  }, 500);
}

function getEmbedUrl(url) {
  if (!url) return '';

  // Handle YouTube URLs
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  }

  // Handle youtu.be short URLs
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  }

  return url;
}

function displayDefaultAds() {
  const defaultAd = {
    judul: "Sponsor Kami",
    deskripsi: "Tersedia slot iklan untuk produk Anda",
    video_url: "",
    link: "#",
    link_text: "Hubungi Kami",
    durasi: 10000
  };

  displayAd('adLeft', defaultAd);
  displayAd('adRight', defaultAd);
}

function setupAdHoverEffect() {
  if (!DOM.adLeft || !DOM.adRight) return;

  const pauseRotation = () => {
    if (state.adRotationInterval) {
      clearTimeout(state.adRotationInterval);
    }
  };

  const resumeRotation = () => {
    if (state.activeAds.length > 0) {
      const currentAd = state.activeAds[state.currentAdIndex];
      state.adRotationInterval = setTimeout(
        showNextAd,
        currentAd.durasi || state.adRotationSpeed
      );
    }
  };

  // Add event listeners to both ad containers
  [DOM.adLeft, DOM.adRight].forEach(container => {
    container.addEventListener('mouseenter', pauseRotation);
    container.addEventListener('mouseleave', resumeRotation);
  });
}

// Table rotation functions
function rotateTables() {
  const types = ['emas', 'antam', 'archi'];
  const currentIndex = types.indexOf(state.currentTableType);
  const nextIndex = (currentIndex + 1) % types.length;
  state.currentTableType = types[nextIndex];
  displayTables(state.currentTableType);
}

function displayTables(type) {
  const data = state.tableData[type];
  if (!data || data.length === 0) {
    showError();
    return;
  }

  // Split data into two halves
  const half = Math.ceil(data.length / 2);
  const leftData = data.slice(0, half);
  const rightData = data.slice(half);

  // Animate table transition
  animateTableTransition('emasTableLeft', leftData, type);
  animateTableTransition('emasTableRight', rightData, type);

  // Animate table headers
  updateTableHeaders(type);
}

function updateTableHeaders(type) {
  if (!DOM.tableHeaders.length) return;

  DOM.tableHeaders.forEach(header => {
    header.textContent = type.toUpperCase();
    header.classList.add('table-title-animate');

    const handleAnimationEnd = () => {
      header.classList.remove('table-title-animate');
      header.removeEventListener('animationend', handleAnimationEnd);
    };

    header.addEventListener('animationend', handleAnimationEnd);
  });
}

function animateTableTransition(elementId, data, type) {
  const tableElement = document.getElementById(elementId);
  if (!tableElement) return;

  // Show loading spinner
  tableElement.innerHTML = '<div class="loading-spinner"> <i class="fas fa-sync-alt fa-spin"></i> </div>';

  // Delay for smooth transition
  setTimeout(() => {
    tableElement.innerHTML = generateTableHTML(data, type);
    animateTableRows(tableElement);
  }, 500);
}

function generateTableHTML(data, type) {
  if (!data || data.length === 0) {
    return '<div class="no-data">Data tidak tersedia</div>';
  }

  const rowsHTML = data.map((item, index) => 
    `<tr style="animation-delay: ${index * 0.1}s">
      <td>${item.kode || '-'}</td>
      <td class="highlight">${formatCurrency(item.harga_jual || 0)}</td>
      <td class="highlight">${item.buyback ? formatCurrency(item.buyback) : '-'}</td>
    </tr>`
  ).join('');

  return `
    <div class="table-transition">
      <table class="price-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Jual</th>
            <th>Buyback</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
      <div class="table-footer">
        <p>Update: ${new Date().toLocaleTimeString('id-ID')}</p>
      </div>
    </div>
  `;
}

function animateTableRows(tableElement) {
  if (!tableElement) return;

  const rows = tableElement.querySelectorAll('tbody tr');
  const prices = tableElement.querySelectorAll('.highlight');

  rows.forEach((row, index) => {
    row.classList.add('row-slide-in');
    row.style.animationDelay = `${index * 0.1}s`;

    const handleAnimationEnd = () => {
      row.classList.remove('row-slide-in');
      row.removeEventListener('animationend', handleAnimationEnd);
    };

    row.addEventListener('animationend', handleAnimationEnd);
  });

  prices.forEach(price => {
    price.classList.add('price-updating');

    setTimeout(() => {
      price.classList.remove('price-updating');
    }, 2000);
  });
}

// Error handling
function showError() {
  const errorHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Gagal memuat data. Silakan coba lagi.</p>
    </div>
  `;

  if (DOM.emasTableLeft) DOM.emasTableLeft.innerHTML = errorHTML;
  if (DOM.emasTableRight) DOM.emasTableRight.innerHTML = errorHTML;
}
