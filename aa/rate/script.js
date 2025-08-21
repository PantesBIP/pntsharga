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

// Load data and initialize
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nav.classList.toggle('active');
    });

    document.addEventListener('click', function () {
        nav.classList.remove('active');
    });

    nav.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Switch to the selected table type
            currentTableType = this.getAttribute('data-type');
            displayTables(currentTableType);
        });
    });

    // Load initial data
    loadPriceData();
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
        
        // Update time
        document.getElementById('updateTime').textContent = new Date().toLocaleTimeString('id-ID');
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
    
    // Update time
    document.getElementById('updateTime').textContent = new Date().toLocaleTimeString('id-ID');
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
        <div class="table-footer">
            <p>Update: ${new Date().toLocaleTimeString('id-ID')}</p>
        </div>
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
