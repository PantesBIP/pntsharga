// Configurations
const SPREADSHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?output=csv';
const SHEET_CONFIG = {
  harga: { gid: '216173443', name: 'Harga' },
  runningText: { gid: '1779766141', name: 'RunningText' }
};

// Cache DOM elements
const domCache = {
  emasTableLeft: null,
  emasTableRight: null,
  runningTextElement: null,
  tableHeaders: null,
  mobileMenuBtn: null,
  gamerNav: null
};

// Variables
let currentTableType = 'emas';
let tableData = {};
let runningTextData = [];
let animationFrameId = null;

// Main initialization - Diubah untuk mengurangi beban saat load
document.addEventListener('DOMContentLoaded', function() {
  cacheDOMElements();
  initializeMobileMenu();
  
  // Load data secara berurutan dengan delay
  setTimeout(() => {
    loadPriceData().then(() => {
      setTimeout(loadRunningTextData, 500);
    });
  }, 300);
  
  // Kurangi interval rotasi tabel
  setInterval(rotateTables, 30000);
});

// Cache DOM elements untuk mengurangi querySelector berulang
function cacheDOMElements() {
  domCache.emasTableLeft = document.getElementById('emasTableLeft');
  domCache.emasTableRight = document.getElementById('emasTableRight');
  domCache.runningTextElement = document.querySelector('.running-text');
  domCache.tableHeaders = document.querySelectorAll('.table-wrapper h3');
  domCache.mobileMenuBtn = document.querySelector('.mobileMenuBtn');
  domCache.gamerNav = document.querySelector('.gamer-nav');
}

// Mobile menu functionality
function initializeMobileMenu() {
  if (!domCache.mobileMenuBtn || !domCache.gamerNav) return;
  
  const toggleMenu = (e) => {
    e?.stopPropagation();
    domCache.gamerNav.classList.toggle('active');
  };
  
  domCache.mobileMenuBtn.addEventListener('click', toggleMenu);
  
  document.addEventListener('click', () => {
    domCache.gamerNav.classList.remove('active');
  });
  
  domCache.gamerNav.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Load price data dengan optimasi
async function loadPriceData() {
  try {
    const response = await fetch(getSheetUrl('harga'));
    if (!response.ok) throw new Error('Network response was not ok');
    
    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);

    // Organize data
    tableData.emas = data.filter(row => row.tipe?.toLowerCase() === 'emas');
    tableData.antam = data.filter(row => row.tipe?.toLowerCase() === 'antam');
    tableData.archi = data.filter(row => row.tipe?.toLowerCase() === 'archi');

    displayTables('emas');
  } catch (error) {
    console.error('Error loading price data:', error);
    showError();
  }
}

// Parse CSV dengan optimasi
function parseCSVToJSON(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/\s+/g, '_'));
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || '';
      if (['harga_jual', 'buyback'].includes(header)) {
        value = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
      }
      obj[header] = value;
    });
    
    return obj;
  });
}

// Running text dengan optimasi
async function loadRunningTextData() {
  try {
    const response = await fetch(getSheetUrl('runningText'));
    if (!response.ok) throw new Error('Network response was not ok');
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n').slice(1);
    
    runningTextData = lines
      .map(line => line.split(',')[0]?.trim())
      .filter(Boolean)
      .map(text => ({
        text,
        icon: getIconForText(text),
        color: getRandomColor()
      }));
    
    updateRunningText();
  } catch (error) {
    console.error('Error loading running text:', error);
    runningTextData = [
      { text: "Harga emas diperbarui real-time", icon: "fa-sync-alt", color: "#00ffff" },
      { text: "Konsultasi investasi gratis", icon: "fa-comments", color: "#ffd700" }
    ];
    updateRunningText();
  }
}

function updateRunningText() {
  if (!domCache.runningTextElement || !runningTextData.length) return;
  
  // Batasi jumlah item untuk mengurangi beban
  const limitedData = runningTextData.slice(0, 5);
  const displayItems = [...limitedData, ...limitedData];
  
  domCache.runningTextElement.innerHTML = displayItems.map(item => `
    <span style="color: ${item.color}">
      <i class="fas ${item.icon}"></i> ${item.text}
    </span>
  `).join('');
  
  // Gunakan transform untuk animasi yang lebih ringan
  const contentWidth = domCache.runningTextElement.scrollWidth / 2;
  const duration = Math.max(30, contentWidth / 30);
  
  domCache.runningTextElement.style.animationDuration = `${duration}s`;
  
  // Hentikan animasi sebelumnya jika ada
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Gunakan requestAnimationFrame untuk animasi yang lebih smooth
  let start = null;
  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / (duration * 1000);
    domCache.runningTextElement.style.transform = `translateX(-${progress * 100}%)`;
    
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      start = timestamp;
      domCache.runningTextElement.style.transform = 'translateX(0)';
      animationFrameId = requestAnimationFrame(animate);
    }
  };
  
  animationFrameId = requestAnimationFrame(animate);
}

// Display tables dengan optimasi
function displayTables(type) {
  const data = tableData[type];
  if (!data || !data.length) return showError();

  const half = Math.ceil(data.length / 2);
  const leftData = data.slice(0, half);
  const rightData = data.slice(half);

  updateTable('emasTableLeft', leftData);
  updateTable('emasTableRight', rightData);

  // Update headers
  if (domCache.tableHeaders) {
    domCache.tableHeaders.forEach(header => {
      header.textContent = type.toUpperCase();
      header.classList.add('table-title-animate');
      setTimeout(() => header.classList.remove('table-title-animate'), 1500);
    });
  }
}

// Optimasi pembuatan tabel
function updateTable(elementId, data) {
  const tableElement = document.getElementById(elementId);
  if (!tableElement) return;
  
  // Gunakan documentFragment untuk mengurangi reflow
  const fragment = document.createDocumentFragment();
  const table = document.createElement('table');
  table.className = 'price-table';
  
  // Buat thead
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Kode</th>
      <th>Jual</th>
      <th>Buyback</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Buat tbody
  const tbody = document.createElement('tbody');
  data.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.kode || '-'}</td>
      <td class="highlight">${formatCurrency(item.harga_jual || 0)}</td>
      <td class="highlight">${item.buyback ? formatCurrency(item.buyback) : '-'}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  fragment.appendChild(table);
  
  // Tambahkan footer
  const footer = document.createElement('div');
  footer.className = 'table-footer';
  footer.innerHTML = `<p>Update: ${new Date().toLocaleTimeString('id-ID')}</p>`;
  fragment.appendChild(footer);
  
  // Bersihkan dan tambahkan konten baru
  tableElement.innerHTML = '';
  tableElement.appendChild(fragment);
}

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function getIconForText(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('harga') || lowerText.includes('update')) return 'fa-sync-alt';
  if (lowerText.includes('beli') || lowerText.includes('jual')) return 'fa-shopping-cart';
  if (lowerText.includes('konsultasi') || lowerText.includes('info')) return 'fa-comments';
  if (lowerText.includes('promo') || lowerText.includes('diskon')) return 'fa-tag';
  return 'fa-info-circle';
}

function getRandomColor() {
  const colors = ['#ffd700', '#00ffff', '#ff6b6b', '#51cf66'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function rotateTables() {
  const types = ['emas', 'antam', 'archi'];
  currentTableType = types[(types.indexOf(currentTableType) + 1] % types.length];
  displayTables(currentTableType);
}

function getSheetUrl(sheetType) {
  return `${SPREADSHEET_BASE}&gid=${SHEET_CONFIG[sheetType].gid}`;
}

function showError() {
  const errorHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Gagal memuat data</p>
    </div>
  `;
  if (domCache.emasTableLeft) domCache.emasTableLeft.innerHTML = errorHTML;
  if (domCache.emasTableRight) domCache.emasTableRight.innerHTML = errorHTML;
}
