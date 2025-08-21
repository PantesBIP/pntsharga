// Helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

let tableData = {};
let currentTableType = 'emas';
let rotationInterval;

// Load data and initialize
document.addEventListener('DOMContentLoaded', function () {
    const leftNavBtn = document.querySelector('.left-nav');
    const rightNavBtn = document.querySelector('.right-nav');

    // Navigation buttons
    leftNavBtn.addEventListener('click', function() {
        navigateTables('left');
    });

    rightNavBtn.addEventListener('click', function() {
        navigateTables('right');
    });

    // Load initial data
    loadPriceData();
    
    // Start rotation interval
    startRotationInterval();
});

function startRotationInterval() {
    if (rotationInterval) clearInterval(rotationInterval);
    
    rotationInterval = setInterval(function() {
        navigateTables('right');
    }, 25000); // Rotate every 25 seconds
}

function navigateTables(direction) {
    const types = ['emas', 'antam', 'archi'];
    const currentIndex = types.indexOf(currentTableType);
    let nextIndex;
    
    if (direction === 'right') {
        nextIndex = (currentIndex + 1) % types.length;
    } else {
        nextIndex = (currentIndex - 1 + types.length) % types.length;
    }
    
    currentTableType = types[nextIndex];
    displayTables(currentTableType);
}

// Load and parse CSV from Google Sheets
async function loadPriceData() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?gid=216173443&single=true&output=csv');
        const csvText = await response.text();
        const data = parseCSVToJSON(csvText);

        // Organize data by type
        tableData.emas = data.filter(row => row.tipe.toLowerCase() === 'emas');
        tableData.antam = data.filter(row => row.tipe.toLowerCase() === 'antam');
        tableData.archi = data.filter(row => row.tipe.toLowerCase() === 'archi');

        // Generate marquee text from data
        generateMarqueeText();
        
        // Display initial table
        displayTables('emas');
    } catch (error) {
        console.error('Error loading CSV data:', error);
        showError();
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

function generateMarqueeText() {
    let marqueeText = "Harga Emas Terkini: ";
    
    // Add emas data
    if (tableData.emas && tableData.emas.length > 0) {
        const emasItems = tableData.emas.slice(0, 3); // Take first 3 items
        emasItems.forEach((item, index) => {
            marqueeText += `${item.kode}: ${formatCurrency(item.harga_jual)}`;
            if (index < emasItems.length - 1) marqueeText += " | ";
        });
    }
    
    marqueeText += " | ";
    
    // Add antam data
    if (tableData.antam && tableData.antam.length > 0) {
        const antamItems = tableData.antam.slice(0, 2); // Take first 2 items
        antamItems.forEach((item, index) => {
            marqueeText += `${item.kode}: ${formatCurrency(item.harga_jual)}`;
            if (index < antamItems.length - 1) marqueeText += " | ";
        });
    }
    
    marqueeText += " | ";
    
    // Add archi data
    if (tableData.archi && tableData.archi.length > 0) {
        const archiItems = tableData.archi.slice(0, 2); // Take first 2 items
        archiItems.forEach((item, index) => {
            marqueeText += `${item.kode}: ${formatCurrency(item.harga_jual)}`;
            if (index < archiItems.length - 1) marqueeText += " | ";
        });
    }
    
    // Update marquee text
    document.getElementById('marqueeText').textContent = marqueeText;
}

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

    // Update tables
    updateTable('priceTableLeft', leftData, type);
    updateTable('priceTableRight', rightData, type);
}

function updateTable(elementId, data, type) {
    const tableElement = document.getElementById(elementId);
    
    if (data.length === 0) {
        tableElement.innerHTML = '<div class="no-data">Data tidak tersedia</div>';
        return;
    }

    let tableHTML = `
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

    data.forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.kode}</td>
                <td class="highlight">${formatCurrency(item.harga_jual)}</td>
                <td class="highlight">${item.buyback ? formatCurrency(item.buyback) : '-'}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableElement.innerHTML = tableHTML;
}

function showError() {
    const errorHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Gagal memuat data. Silakan coba lagi.</p>
        </div>
    `;
    document.getElementById('priceTableLeft').innerHTML = errorHTML;
    document.getElementById('priceTableRight').innerHTML = errorHTML;
}
