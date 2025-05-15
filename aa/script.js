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
    setInterval(rotateTables, 40000); // Rotate every 40 seconds
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

    // Update left table
    const leftTable = document.getElementById('emasTableLeft');
    leftTable.innerHTML = generateTableHTML(leftData, type);

    // Update right table
    const rightTable = document.getElementById('emasTableRight');
    rightTable.innerHTML = generateTableHTML(rightData, type);

    // Update table headers
    document.querySelectorAll('.table-wrapper h3').forEach(header => {
        header.textContent = type.toUpperCase();
    });
}

function generateTableHTML(data, type) {
    if (data.length === 0) {
        return '<div class="no-data">Data tidak tersedia</div>';
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
                <td>${item.buyback ? formatCurrency(item.buyback) : '-'}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        <div class="table-footer">
            <p>Update: ${new Date().toLocaleTimeString('id-ID')}</p>
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
