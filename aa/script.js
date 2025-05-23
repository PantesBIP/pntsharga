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

// Load data and initialize table rotation
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');

    mobileMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        gamerNav.classList.toggle('active');
    });

    document.addEventListener('click', function () {
        gamerNav.classList.remove('active');
    });

    gamerNav.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    loadPriceData();
    setInterval(rotateTables, 25000); // Rotate every 40 seconds
});

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

function rotateTables() {
    const types = ['emas', 'antam', 'archi'];
    const currentIndex = types.indexOf(currentTableType);
    const nextIndex = (currentIndex + 1) % types.length;
    currentTableType = types[nextIndex];
    displayTables(currentTableType);
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

function animateTableTransition(elementId, data, type) {
    const tableElement = document.getElementById(elementId);
    
    // Show loading spinner
    tableElement.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-sync-alt"></i>
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
