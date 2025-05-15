// ================ GLOBAL VARIABLES ================
let currentTableType = 'emas';
let tableRotationInterval;

// ================ HELPER FUNCTIONS ================
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function parseCSVToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/\s+/g, '_'));
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        
        headers.forEach((header, index) => {
            let value = values[index] || '';
            if (['harga_jual', 'harga_jual_lama', 'buyback', 'buyback_lama'].includes(header)) {
                value = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
            }
            obj[header] = value;
        });
        
        return obj;
    });
}

// ================ TABLE FUNCTIONS ================
async function loadMainPriceData(type, isAutoRotation = false) {
    if (!isAutoRotation) {
        clearInterval(tableRotationInterval);
    }
    
    currentTableType = type;
    const priceTableContainer = document.getElementById('priceTableContainer');
    priceTableContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Memuat data...</p></div>';

    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?gid=216173443&single=true&output=csv');
        const csvText = await response.text();
        const data = parseCSVToJSON(csvText);
        const filteredData = data.filter(row => row.tipe.toLowerCase() === type.toLowerCase());

        displayMainPriceTable(type, filteredData);
    } catch (error) {
        console.error('Error loading CSV data:', error);
        priceTableContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data. Silakan coba lagi.</p>
            </div>
        `;
    }
}

function displayMainPriceTable(type, data) {
    const priceTableContainer = document.getElementById('priceTableContainer');

    if (!data || data.length === 0) {
        priceTableContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Data tidak tersedia</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table class="price-table fade-in">
            <thead>
                <tr>
                    <th>Kode</th>
                    <th>Harga Jual</th>
                    <th>Harga Buyback</th>
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
            <p>${type.toUpperCase()} - Terakhir diperbarui: ${new Date().toLocaleString('id-ID')}</p>
        </div>
    `;

    priceTableContainer.innerHTML = tableHTML;
}

function startTableRotation() {
    const tableTypes = ['emas', 'antam', 'archi'];
    let currentIndex = 0;
    
    loadMainPriceData(tableTypes[currentIndex], true);
    
    tableRotationInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % tableTypes.length;
        loadMainPriceData(tableTypes[currentIndex], true);
    }, 30000);
}

// ================ EVENT LISTENERS ================
function setupEventListeners() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');
    const cards = document.querySelectorAll('.card');

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

    cards.forEach(card => {
        card.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            loadMainPriceData(type);
            cards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    startTableRotation();
    document.querySelector('.card[data-type="emas"]').classList.add('active');
});
