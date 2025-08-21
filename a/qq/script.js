// Konfigurasi Sheet
const SHEET_CONFIG = {
  harga: { gid: '216173443', name: 'Harga' },
  runningText: { gid: '1779766141', name: 'RunningText' },
  iklan: { gid: '1303897065', name: 'Iklan' }
};

// Base URL untuk Google Sheets
const SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub';

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
let videoTimeout;
let videoPlayed = false;

// Load data and initialize
document.addEventListener('DOMContentLoaded', function () {
    const leftNavBtn = document.querySelector('.left-nav');
    const rightNavBtn = document.querySelector('.right-nav');
    const skipVideoBtn = document.getElementById('skipVideo');
    const videoElement = document.getElementById('promoVideo');

    // Navigation buttons
    leftNavBtn.addEventListener('click', function() {
        navigateTables('left');
    });

    rightNavBtn.addEventListener('click', function() {
        navigateTables('right');
    });

    // Skip video button
    skipVideoBtn.addEventListener('click', function() {
        hideVideo();
    });

    // Video ended event
    videoElement.addEventListener('ended', function() {
        hideVideo();
    });

    // Load initial data
    loadPriceData();
    loadRunningText();
    
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
    
    // Tampilkan video setelah slide terakhir (archi) dan hanya sekali
    if (currentTableType === 'archi' && !videoPlayed) {
        showVideoAfterDelay();
    }
}

function showVideoAfterDelay() {
    // Clear any existing timeout
    if (videoTimeout) clearTimeout(videoTimeout);
    
    // Tampilkan video setelah 5 detik berada di slide archi
    videoTimeout = setTimeout(function() {
        showVideo();
        videoPlayed = true;
    }, 5000);
}

function showVideo() {
    const videoContainer = document.getElementById('videoContainer');
    const videoElement = document.getElementById('promoVideo');
    
    // Tampilkan container video
    videoContainer.classList.add('active');
    
    // Putar video
    videoElement.play().catch(error => {
        console.error('Error playing video:', error);
    });
    
    // Sembunyikan video setelah 15 detik
    setTimeout(function() {
        hideVideo();
    }, 15000);
}

function hideVideo() {
    const videoContainer = document.getElementById('videoContainer');
    const videoElement = document.getElementById('promoVideo');
    
    // Hentikan video
    videoElement.pause();
    videoElement.currentTime = 0;
    
    // Sembunyikan container video
    videoContainer.classList.remove('active');
}

// Load and parse CSV from Google Sheets - Harga
async function loadPriceData() {
    try {
        const url = `${SHEET_BASE_URL}?gid=${SHEET_CONFIG.harga.gid}&single=true&output=csv`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const data = parseCSVToJSON(csvText);

        // Organize data by type
        tableData.emas = data.filter(row => row.tipe && row.tipe.toLowerCase() === 'emas');
        tableData.antam = data.filter(row => row.tipe && row.tipe.toLowerCase() === 'antam');
        tableData.archi = data.filter(row => row.tipe && row.tipe.toLowerCase() === 'archi');

        // Display initial table
        displayTables('emas');
    } catch (error) {
        console.error('Error loading CSV data:', error);
        showError();
    }
}

// Load running text from Google Sheets
async function loadRunningText() {
    try {
        const url = `${SHEET_BASE_URL}?gid=${SHEET_CONFIG.runningText.gid}&single=true&output=csv`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const data = parseRunningTextCSV(csvText);
        
        // Process running text data
        processRunningTextData(data);
    } catch (error) {
        console.error('Error loading running text:', error);
        // Fallback text if running text fails to load
        document.getElementById('marqueeText').textContent = "Harga emas terkini - Informasi terupdate setiap hari";
    }
}

// Special parser for running text CSV
function parseRunningTextCSV(csvText) {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 1) return [];
    
    // Jika hanya ada satu baris, anggap sebagai header + data
    if (lines.length === 1) {
        return [{ teks: lines[0].trim() }];
    }
    
    // Jika ada multiple lines, coba parse dengan header
    const headers = lines[0].split(',').map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    
    // Cari kolom yang berisi teks
    const textColumn = headers.find(h => h.includes('teks') || h.includes('text') || h.includes('isi') || h.includes('running')) || headers[0];
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        
        // Jika hanya ada satu kolom, gunakan langsung
        if (values.length === 1) {
            return { teks: values[0] };
        }
        
        // Jika ada multiple columns, cari yang berisi teks
        const textIndex = headers.indexOf(textColumn);
        const teks = textIndex >= 0 && textIndex < values.length ? values[textIndex] : values.join(' ');
        
        return { teks };
    }).filter(item => item.teks && item.teks.trim() !== '');
}

function processRunningTextData(data) {
    if (!data || data.length === 0) {
        document.getElementById('marqueeText').textContent = "Harga emas terkini - Informasi terupdate setiap hari";
        return;
    }
    
    // Get all running text items
    const runningTexts = data.map(item => item.teks).filter(teks => teks && teks.trim() !== '');
    
    if (runningTexts.length === 0) {
        document.getElementById('marqueeText').textContent = "Harga emas terkini - Informasi terupdate setiap hari";
        return;
    }
    
    // Combine all running text with separator
    const marqueeContent = runningTexts.join(' | ');
    
    // Update marquee text
    const marqueeElement = document.getElementById('marqueeText');
    marqueeElement.textContent = marqueeContent;
    
    // Sesuaikan kecepatan berdasarkan panjang teks
    adjustMarqueeSpeed(marqueeContent.length);
}

// Fungsi untuk menyesuaikan kecepatan running text berdasarkan panjang teks
function adjustMarqueeSpeed(textLength) {
    const marqueeElement = document.getElementById('marqueeText');
    const baseDuration = 60; // durasi dasar dalam detik
    const duration = Math.max(baseDuration, textLength / 10); // durasi berdasarkan panjang teks
    
    // Hapus animasi sebelumnya
    marqueeElement.style.animation = 'none';
    
    // Terapkan animasi baru dengan durasi yang disesuaikan
    setTimeout(() => {
        marqueeElement.style.animation = `marquee ${duration}s linear infinite`;
    }, 10);
}

function parseCSVToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
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
                <td>${item.kode || '-'}</td>
                <td class="highlight">${item.harga_jual ? formatCurrency(item.harga_jual) : '-'}</td>
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
