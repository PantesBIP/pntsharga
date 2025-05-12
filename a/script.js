// Konfigurasi Google Sheets
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Ganti dengan ID spreadsheet Anda
const SHEET_NAME = 'DataHarga'; // Ganti dengan nama sheet Anda
const API_KEY = 'YOUR_API_KEY'; // Ganti dengan API key Anda (opsional jika menggunakan metode publish)

// URL endpoint untuk mengambil data
const SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

// Variabel global untuk menyimpan data
let currentData = {};
let oldData = {};

// Fungsi untuk memuat data dari Google Sheets
async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        
        // Format data dari Google Sheets ke struktur yang diinginkan
        const formattedData = formatSheetData(data.values);
        currentData = formattedData.current;
        oldData = formattedData.old;
        
        console.log('Data loaded successfully:', currentData);
        
        // Inisialisasi event listeners setelah data dimuat
        initCardClickListeners();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback ke data lokal jika terjadi error
        loadLocalData();
    }
}

// Fungsi untuk memformat data dari Google Sheets
function formatSheetData(sheetData) {
    const result = {
        current: { emas: [], antam: [], archi: [] },
        old: { emas: [], antam: [], archi: [] }
    };
    
    // Asumsi struktur sheet:
    // Kolom 0: Tipe (emas/antam/archi)
    // Kolom 1: Code
    // Kolom 2: Harga Jual
    // Kolom 3: Harga Beli
    // Kolom 4: Harga Jual Lama
    // Kolom 5: Harga Beli Lama
    
    for (let i = 1; i < sheetData.length; i++) { // Lewati header
        const row = sheetData[i];
        const type = row[0].toLowerCase();
        const item = {
            code: row[1],
            sellPrice: parseInt(row[2]),
            buybackPrice: parseInt(row[3])
        };
        const oldItem = {
            code: row[1],
            sellPrice: parseInt(row[4]),
            buybackPrice: parseInt(row[5])
        };
        
        if (result.current[type]) {
            result.current[type].push(item);
            result.old[type].push(oldItem);
        }
    }
    
    return result;
}

// Fallback ke data lokal jika Google Sheets tidak tersedia
function loadLocalData() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            currentData = data;
            return fetch('old_data.json');
        })
        .then(response => response.json())
        .then(data => {
            oldData = data;
            initCardClickListeners();
        })
        .catch(error => console.error('Error loading local data:', error));
}

// Fungsi untuk menampilkan data berdasarkan tipe
function showDataByType(type) {
    const data = currentData[type];
    const oldDataByType = oldData[type];
    
    if (!data || data.length === 0) {
        document.getElementById('priceTableContainer').innerHTML = `
            <div class="table-placeholder">
                <i class="fas fa-exclamation-circle"></i>
                <p>Data tidak tersedia</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="price-table">
            <thead>
                <tr>
                    <th>Kode</th>
                    <th>Harga Jual</th>
                    <th>Harga Beli</th>
                    <th>Perubahan</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach((item, index) => {
        const oldItem = oldDataByType.find(old => old.code === item.code) || item;
        const sellChange = calculateChange(oldItem.sellPrice, item.sellPrice);
        const buybackChange = item.buybackPrice !== 0 ? calculateChange(oldItem.buybackPrice, item.buybackPrice) : null;
        
        html += `
            <tr>
                <td>${item.code}</td>
                <td>${formatCurrency(item.sellPrice)}</td>
                <td>${item.buybackPrice !== 0 ? formatCurrency(item.buybackPrice) : '-'}</td>
                <td class="change ${getChangeClass(sellChange)}">
                    ${sellChange !== null ? formatChange(sellChange) : '-'}
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    document.getElementById('priceTableContainer').innerHTML = html;
}

// Fungsi pembantu
function calculateChange(oldValue, newValue) {
    if (oldValue === 0 || oldValue === newValue) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

function formatChange(change) {
    return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
}

function getChangeClass(change) {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

// Inisialisasi event listeners untuk kartu
function initCardClickListeners() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            showDataByType(type);
        });
    });
}

// Memuat data saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadData);
