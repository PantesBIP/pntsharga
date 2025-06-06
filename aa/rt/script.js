// Configurations
const SPREADSHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?output=csv';

const SHEET_CONFIG = {
  harga: { gid: '216173443', name: 'Harga' },
  runningText: { gid: '1779766141', name: 'RunningText' }
};

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Fungsi helper untuk menentukan icon berdasarkan teks
function getIconForText(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('harga') || lowerText.includes('update')) {
    return 'fa-sync-alt';
  } else if (lowerText.includes('beli') || lowerText.includes('jual')) {
    return 'fa-shopping-cart';
  } else if (lowerText.includes('konsultasi') || lowerText.includes('info')) {
    return 'fa-comments';
  } else if (lowerText.includes('promo') || lowerText.includes('diskon')) {
    return 'fa-tag';
  }
  
  return 'fa-info-circle'; // Default icon
}

// Fungsi untuk generate warna acak yang menarik
function getRandomColor() {
  const colors = ['#ffd700', '#00ffff', '#ff6b6b', '#51cf66', '#fcc419', '#748ffc'];
  return colors[Math.floor(Math.random() * colors.length)];
}

let currentTableType = 'emas';
let tableData = {};
let runningTextData = [];

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
  initializeMobileMenu();
  loadPriceData();
  loadRunningTextData();
  setInterval(rotateTables, 25000);
});

// Mobile menu functionality
function initializeMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const gamerNav = document.querySelector('.gamer-nav');

  mobileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    gamerNav.classList.toggle('active');
  });

  document.addEventListener('click', function() {
    gamerNav.classList.remove('active');
  });

  gamerNav.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

// Build Google Sheets URL
function getSheetUrl(sheetType) {
  return `${SPREADSHEET_BASE}&gid=${SHEET_CONFIG[sheetType].gid}`;
}

// Load price data
async function loadPriceData() {
  try {
    const response = await fetch(getSheetUrl('harga'));
    if (!response.ok) throw new Error('Network response was not ok');
    
    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);

    // Organize data by type
    tableData.emas = data.filter(row => row.tipe?.toLowerCase() === 'emas');
    tableData.antam = data.filter(row => row.tipe?.toLowerCase() === 'antam');
    tableData.archi = data.filter(row => row.tipe?.toLowerCase() === 'archi');

    displayTables('emas');
  } catch (error) {
    console.error('Error loading price data:', error);
    showError();
  }
}

// Parse CSV to JSON
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

// Update fungsi loadRunningTextData
async function loadRunningTextData() {
  try {
    const response = await fetch(getSheetUrl('runningText'));
    if (!response.ok) throw new Error('Network response was not ok');
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n').slice(1); // Skip header
    
    runningTextData = lines
      .map(line => line.split(',')[0]?.trim()) // Ambil kolom pertama saja
      .filter(text => text && text !== '')
      .map(text => ({
        text: text,
        icon: getIconForText(text),
        color: getRandomColor()
      }));
    
    updateRunningText();
  } catch (error) {
    console.error('Error loading running text:', error);
    // Fallback data
    runningTextData = [
      { text: "Harga emas diperbarui real-time", icon: "fa-sync-alt", color: "#00ffff" },
      { text: "Konsultasi investasi gratis", icon: "fa-comments", color: "#ffd700" }
    ];
    updateRunningText();
  }
}

// Update fungsi updateRunningText
function updateRunningText() {
  const runningTextElement = document.querySelector('.running-text');
  if (!runningTextElement) return;
  
  if (!runningTextData.length) {
    runningTextElement.style.display = 'none';
    return;
  }
  
  // Duplicate items untuk looping mulus
  const displayItems = [...runningTextData, ...runningTextData];
  
  runningTextElement.innerHTML = displayItems.map(item => `
    <span style="color: ${item.color}">
      <i class="fas ${item.icon}"></i> ${item.text}
    </span>
  `).join('');
  
  // Hitung durasi animasi berdasarkan panjang konten
  const contentWidth = runningTextElement.scrollWidth / 2;
  const duration = Math.max(30, contentWidth / 50); // 50px per second
  
  runningTextElement.style.animationDuration = `${duration}s`;
  runningTextElement.style.display = 'flex';
  
  // Hover effects
  runningTextElement.addEventListener('mouseenter', () => {
    runningTextElement.style.animationPlayState = 'paused';
    runningTextElement.querySelectorAll('span').forEach(span => {
      span.style.textShadow = '0 0 8px currentColor';
    });
  });
  
  runningTextElement.addEventListener('mouseleave', () => {
    runningTextElement.style.animationPlayState = 'running';
    runningTextElement.querySelectorAll('span').forEach(span => {
      span.style.textShadow = 'none';
    });
  });
}

// Rotate between different table types
function rotateTables() {
  const types = ['emas', 'antam', 'archi'];
  const currentIndex = types.indexOf(currentTableType);
  const nextIndex = (currentIndex + 1) % types.length;
  currentTableType = types[nextIndex];
  displayTables(currentTableType);
}

// Display tables with smooth transitions
function displayTables(type) {
  const data = tableData[type];
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
  document.querySelectorAll('.table-wrapper h3').forEach(header => {
    header.textContent = type.toUpperCase();
    header.classList.add('table-title-animate');
    setTimeout(() => {
      header.classList.remove('table-title-animate');
    }, 1500);
  });
}

// Animate table transitions
function animateTableTransition(elementId, data, type) {
  const tableElement = document.getElementById(elementId);
  
  // Show loading spinner
  tableElement.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-sync-alt fa-spin"></i>
    </div>
  `;
  
  // Delay for smooth transition
  setTimeout(() => {
    tableElement.innerHTML = generateTableHTML(data, type);
    
    // Add animation to all rows
    const rows = tableElement.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
      row.classList.add('row-slide-in');
      row.style.animationDelay = `${index * 0.1}s`;
      setTimeout(() => {
        row.classList.remove('row-slide-in');
      }, 600 + (index * 100));
    });
    
    // Add pulse animation to prices
    const prices = tableElement.querySelectorAll('.highlight');
    prices.forEach(price => {
      price.classList.add('price-updating');
      setTimeout(() => {
        price.classList.remove('price-updating');
      }, 2000);
    });
  }, 500);
}

// Generate HTML for price tables
function generateTableHTML(data, type) {
  if (data.length === 0) {
    return '<div class="no-data">Data tidak tersedia</div>';
  }

  let tableHTML = `
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
  `;

  data.forEach((item, index) => {
    tableHTML += `
      <tr style="animation-delay: ${index * 0.1}s">
        <td>${item.kode || '-'}</td>
        <td class="highlight">${formatCurrency(item.harga_jual || 0)}</td>
        <td class="highlight">${item.buyback ? formatCurrency(item.buyback) : '-'}</td>
      </tr>
    `;
  });

  tableHTML += `
        </tbody>
      </table>
      <div class="table-footer">
        <p>Update: ${new Date().toLocaleTimeString('id-ID')}</p>
      </div>
    </div>
  `;

  return tableHTML;
}

// Show error message
function showError() {
  const errorHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Gagal memuat data. Silakan coba lagi.</p>
    </div>
  `;
  document.getElementById('emasTableLeft').innerHTML = errorHTML;
  document.getElementById('emasTableRight').innerHTML = errorHTML;
}
