// Configurations
const SPREADSHEET_CONFIG = {
  baseUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?gid=0&single=true&output=csv',
  sheets: {
    harga: { gid: '216173443', name: 'Harga' },
    runningText: { gid: '1779766141', name: 'RunningText' }
  }
};

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
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
  const sheetConfig = SPREADSHEET_CONFIG.sheets[sheetType];
  return `${SPREADSHEET_CONFIG.baseUrl}?gid=${sheetConfig.gid}&single=true&output=csv`;
}

// Load price data
async function loadPriceData() {
  try {
    const response = await fetch(getSheetUrl('harga'));
    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);

    tableData.emas = data.filter(row => row.tipe.toLowerCase() === 'emas');
    tableData.antam = data.filter(row => row.tipe.toLowerCase() === 'antam');
    tableData.archi = data.filter(row => row.tipe.toLowerCase() === 'archi');

    displayTables('emas');
  } catch (error) {
    console.error('Error loading price data:', error);
    showError();
  }
}

// Load running text data
async function loadRunningTextData() {
  try {
    const response = await fetch(getSheetUrl('runningText'));
    const csvText = await response.text();
    const data = Papa.parse(csvText, { header: true }).data;
    
    runningTextData = data
      .filter(row => row.text && row.text.trim() !== '')
      .map(row => ({
        text: row.text,
        icon: row.icon || 'fa-info-circle',
        color: row.color || '#ffd700'
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

// Update running text display
function updateRunningText() {
  const runningTextElement = document.querySelector('.running-text');
  
  if (!runningTextData.length) {
    runningTextElement.style.display = 'none';
    return;
  }
  
  // Duplicate for seamless looping
  const displayData = [...runningTextData, ...runningTextData];
  
  runningTextElement.innerHTML = displayData.map(item => `
    <span style="color: ${item.color}">
      <i class="fas ${item.icon}"></i> ${item.text}
    </span>
  `).join('');
  
  // Calculate animation duration
  const container = document.querySelector('.running-text-container');
  const contentWidth = runningTextElement.scrollWidth / 2;
  const duration = Math.max(30, contentWidth / 50); // 50px per second
  
  // Apply smooth animation
  runningTextElement.style.animation = `marquee ${duration}s linear infinite`;
  
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
                <td>${item.kode}</td>
                <td class="highlight">${formatCurrency(item.harga_jual)}</td>
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
