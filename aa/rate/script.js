// Configurations
const SPREADSHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?output=csv';

const SHEET_CONFIG = {
  harga: { gid: '216173443', name: 'Harga' },
  runningText: { gid: '1779766141', name: 'RunningText' }
};

// Cache untuk data yang sudah di-load
let dataCache = {
  harga: null,
  runningText: null,
  lastUpdated: null
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
  
  // Cek jika data sudah ada di cache (dalam session)
  const cachedData = sessionStorage.getItem('goldPriceData');
  const cachedRunningText = sessionStorage.getItem('runningTextData');
  
  if (cachedData) {
    // Gunakan data dari cache
    const parsedData = JSON.parse(cachedData);
    tableData = parsedData.tableData;
    dataCache.lastUpdated = parsedData.lastUpdated;
    
    // Tampilkan data yang sudah di-cache
    displayTables('emas');
    
    // Perbarui data di background tanpa menunggu
    loadPriceData();
  } else {
    // Load data baru
    loadPriceData();
  }
  
  if (cachedRunningText) {
    // Gunakan running text dari cache
    runningTextData = JSON.parse(cachedRunningText);
    updateRunningText();
    
    // Perbarui di background
    loadRunningTextData();
  } else {
    // Load running text baru
    loadRunningTextData();
  }
  
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

    // Simpan ke cache
    dataCache.harga = tableData;
    dataCache.lastUpdated = new Date().getTime();
    
    // Simpan ke sessionStorage untuk penggunaan ulang
    sessionStorage.setItem('goldPriceData', JSON.stringify({
      tableData: tableData,
      lastUpdated: dataCache.lastUpdated
    }));

    displayTables('emas');
  } catch (error) {
    console.error('Error loading price data:', error);
    
    // Coba gunakan data cache jika ada
    if (dataCache.harga) {
      tableData = dataCache.harga;
      displayTables('emas');
    } else {
      showError();
    }
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
    
    // Simpan ke sessionStorage
    sessionStorage.setItem('runningTextData', JSON.stringify(runningTextData));
    
    updateRunningText();
  } catch (error) {
    console.error('Error loading running text:', error);
    
    // Coba gunakan cache jika ada
    const cachedText = sessionStorage.getItem('runningTextData');
    if (cachedText) {
      runningTextData = JSON.parse(cachedText);
      updateRunningText();
    } else {
      // Fallback data
      runningTextData = [
        { text: "Harga emas diperbarui real-time", icon: "fa-sync-alt", color: "#00ffff" },
        { text: "Konsultasi investasi gratis", icon: "fa-comments", color: "#ffd700" }
      ];
      updateRunningText();
    }
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
  const displayItems = [...runningTextData];
  
  runningTextElement.innerHTML = displayItems.map(item => `
    <span style="color: ${item.color}">
      <i class="fas ${item.icon}"></i> ${item.text}
    </span>
  `).join('');
  
  // Hitung durasi animasi berdasarkan panjang konten
  const contentWidth = runningTextElement.scrollWidth;
  const duration = Math.max(30, contentWidth / 30); // 30px per second (lebih lambat)
  
  runningTextElement.style.animationDuration = `${duration}s`;
  runningTextElement.style.display = 'flex';
  
  // Hover effects
  runningTextElement.addEventListener('mouseenter', () => {
    runningTextElement.style.animationPlayState = 'paused';
  });
  
  runningTextElement.addEventListener('mouseleave', () => {
    runningTextElement.style.animationPlayState = 'running';
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

// Display tables with simplified transitions
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

  // Update tables without complex animations
  updateTableContent('emasTableLeft', leftData, type);
  updateTableContent('emasTableRight', rightData, type);

  // Update table headers
  document.querySelectorAll('.table-wrapper h3').forEach(header => {
    header.textContent = type.toUpperCase();
  });
}

// Update table content with simple fade effect
function updateTableContent(elementId, data, type) {
  const tableElement = document.getElementById(elementId);
  
  // Apply simple fade out effect
  tableElement.style.opacity = '0.7';
  
  // Update content after a short delay
  setTimeout(() => {
    tableElement.innerHTML = generateTableHTML(data, type);
    tableElement.style.opacity = '1';
  }, 300);
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

  data.forEach((item) => {
    tableHTML += `
      <tr>
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
