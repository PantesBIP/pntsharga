// Konstanta untuk URL spreadsheet
const SPREADSHEET_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?gid=216173443&single=true&output=csv';
const SPREADSHEET_INFO_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub?gid=0&single=true&output=csv';

// Variabel global
let productData = [];
let marqueeText = "🏆 Harga emas terkini 🏆 | 🎉 Diskon khusus untuk pembelian dalam jumlah besar 🎉 | 📞 Hubungi kami untuk informasi lebih lanjut 📞";
let branches = ["Jakarta Pusat", "Bandung", "Surabaya", "Yogyakarta", "Bali", "Medan"];
let currentTabIndex = 0;
let autoSwitchInterval;
let isAutoSwitchEnabled = true;
let tableData = {};

// Helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Fungsi untuk parsing CSV ke JSON
function parseCSVToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            if (['harga_jual', 'buyback', 'harga'].includes(header)) {
                value = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
            }
            obj[header] = value;
        });
        return obj;
    });
}

// Fungsi untuk mengambil data dari spreadsheet
async function fetchData() {
    try {
        // Ambil data produk
        const dataResponse = await fetch(SPREADSHEET_DATA_URL);
        const dataCsvText = await dataResponse.text();
        productData = parseCSVToJSON(dataCsvText);
        
        // Ambil data info (marquee dan cabang)
        const infoResponse = await fetch(SPREADSHEET_INFO_URL);
        const infoCsvText = await infoResponse.text();
        const infoData = parseCSVToJSON(infoCsvText);
        
        // Proses data info
        if (infoData.length > 0) {
            // Ambil teks marquee
            if (infoData[0].marquee) {
                marqueeText = infoData[0].marquee;
            }
            
            // Ambil data cabang
            const branchesData = infoData.filter(item => item.cabang);
            if (branchesData.length > 0) {
                branches = branchesData.map(item => item.cabang);
            }
        }
        
        // Organize data by type
        tableData.emas = productData.filter(row => row.tipe && row.tipe.toLowerCase() === 'emas');
        tableData.antam = productData.filter(row => row.tipe && row.tipe.toLowerCase() === 'antam');
        tableData.archi = productData.filter(row => row.tipe && row.tipe.toLowerCase() === 'archi');
        
        // Update UI dengan data yang telah diambil
        updateMarquee();
        updateBranches();
        groupDataByType();
        
        // Start auto rotation
        if (isAutoSwitchEnabled) {
            startAutoSwitch();
        }
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showError();
        // Fallback data jika terjadi error
        setTimeout(() => {
            productData = [
                { tipe: "Emas", nama: "Emas 24 Karat", harga: 1000000 },
                { tipe: "Emas", nama: "Emas 22 Karat", harga: 900000 },
                { tipe: "Antam", nama: "Antam 1 gram", harga: 1050000 },
                { tipe: "Antam", nama: "Antam 5 gram", harga: 5200000 },
                { tipe: "Archi", nama: "Archi 1 gram", harga: 1040000 },
                { tipe: "Archi", nama: "Archi 2.5 gram", harga: 2550000 }
            ];
            
            tableData.emas = productData.filter(row => row.tipe && row.tipe.toLowerCase() === 'emas');
            tableData.antam = productData.filter(row => row.tipe && row.tipe.toLowerCase() === 'antam');
            tableData.archi = productData.filter(row => row.tipe && row.tipe.toLowerCase() === 'archi');
            
            groupDataByType();
        }, 3000);
    }
}

// Fungsi untuk mengelompokkan data berdasarkan tipe
function groupDataByType() {
    const groupedData = {};
    
    productData.forEach(item => {
        const type = item.tipe || 'Lainnya';
        if (!groupedData[type]) {
            groupedData[type] = [];
        }
        groupedData[type].push(item);
    });
    
    // Urutkan tipe sesuai urutan yang diinginkan
    const typeOrder = ["Emas", "Antam", "Archi"];
    const sortedTypes = Object.keys(groupedData).sort((a, b) => {
        const indexA = typeOrder.indexOf(a);
        const indexB = typeOrder.indexOf(b);
        
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
    });
    
    // Buat array data yang sudah dikelompokkan dan diurutkan
    const sortedData = sortedTypes.map(type => ({
        type,
        items: groupedData[type]
    }));
    
    // Generate tabs dan tabel
    generateTabs(sortedData);
    showTableForCurrentTab(sortedData);
    
    // Set waktu update
    document.getElementById('update-time').textContent = new Date().toLocaleString('id-ID');
}

// Fungsi untuk membuat tabs
function generateTabs(data) {
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.innerHTML = '';
    
    data.forEach((group, index) => {
        const tab = document.createElement('button');
        tab.className = `tab ${index === 0 ? 'active' : ''}`;
        tab.textContent = group.type;
        tab.addEventListener('click', () => {
            // Hapus class active dari semua tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            // Tambah class active ke tab yang diklik
            tab.classList.add('active');
            // Tampilkan tabel yang sesuai
            currentTabIndex = index;
            showTableForCurrentTab(data);
            
            // Reset auto rotation timer
            if (isAutoSwitchEnabled) {
                clearInterval(autoSwitchInterval);
                startAutoSwitch();
            }
        });
        
        tabsContainer.appendChild(tab);
    });
}

// Fungsi untuk menampilkan tabel berdasarkan tab aktif
function showTableForCurrentTab(data) {
    const tableContent = document.getElementById('table-content');
    
    if (data.length === 0) {
        tableContent.innerHTML = '<div class="loading"><p>Tidak ada data yang tersedia</p></div>';
        return;
    }
    
    const currentData = data[currentTabIndex];
    
    // Animate table transition
    animateTableTransition('table-content', currentData.items, currentData.type);
    
    // Update status tombol navigasi
    updateNavigationButtons(data.length);
}

// Fungsi untuk update status tombol navigasi
function updateNavigationButtons(totalTabs) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentTabIndex === 0;
    nextBtn.disabled = currentTabIndex === totalTabs - 1;
}

// Fungsi untuk navigasi tab
function navigateTab(direction, data) {
    const newIndex = currentTabIndex + direction;
    
    if (newIndex >= 0 && newIndex < data.length) {
        // Hapus class active dari semua tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // Tambah class active ke tab baru
        document.querySelectorAll('.tab')[newIndex].classList.add('active');
        
        currentTabIndex = newIndex;
        showTableForCurrentTab(data);
        
        // Reset auto rotation timer
        if (isAutoSwitchEnabled) {
            clearInterval(autoSwitchInterval);
            startAutoSwitch();
        }
    }
}

// Fungsi untuk toggle auto switch
function toggleAutoSwitch() {
    isAutoSwitchEnabled = !isAutoSwitchEnabled;
    const toggleBtn = document.getElementById('auto-toggle');
    
    if (isAutoSwitchEnabled) {
        toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Auto: ON';
        startAutoSwitch();
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-play"></i> Auto: OFF';
        clearInterval(autoSwitchInterval);
    }
}

// Fungsi untuk memulai auto switch
function startAutoSwitch() {
    clearInterval(autoSwitchInterval);
    
    autoSwitchInterval = setInterval(() => {
        const tabs = document.querySelectorAll('.tab');
        const nextIndex = (currentTabIndex + 1) % tabs.length;
        
        // Trigger click on next tab
        if (tabs[nextIndex]) {
            tabs[nextIndex].click();
        }
    }, 30000); // 30 detik
}

// Fungsi untuk update marquee
function updateMarquee() {
    const marqueeElement = document.getElementById('marquee');
    marqueeElement.textContent = marqueeText;
}

// Fungsi untuk update daftar cabang
function updateBranches() {
    const branchesList = document.getElementById('branches-list');
    branchesList.innerHTML = '';
    
    branches.forEach(branch => {
        const branchElement = document.createElement('div');
        branchElement.className = 'branch';
        branchElement.textContent = branch;
        branchesList.appendChild(branchElement);
    });
}

function animateTableTransition(elementId, data, type) {
    const tableElement = document.getElementById(elementId);
    
    // Show loading spinner
    tableElement.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Memuat data...</p>
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
    if (!data || data.length === 0) {
        return '<div class="loading"><p>Data tidak tersedia</p></div>';
    }

    let tableHTML = `
        <div class="table-transition">
            <table>
                <thead>
                    <tr>
                        <th>Nama Produk</th>
                        <th>Harga</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.forEach((item, index) => {
        const productName = item.nama || item.kode || 'Produk';
        const price = item.harga || item.harga_jual || 0;
        
        tableHTML += `
            <tr style="animation-delay: ${index * 0.1}s">
                <td>${productName}</td>
                <td class="highlight">${formatCurrency(price)}</td>
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
        <div class="loading">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Gagal memuat data. Silakan coba lagi.</p>
        </div>
    `;
    document.getElementById('table-content').innerHTML = errorHTML;
}

// Inisialisasi ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Fetch data dari spreadsheet
    fetchData();
    
    // Setup event listeners untuk navigasi
    document.getElementById('prev-btn').addEventListener('click', () => {
        const tabs = document.querySelectorAll('.tab');
        if (tabs.length > 0) {
            navigateTab(-1, Array.from(tabs).map(tab => ({ type: tab.textContent, items: [] })));
        }
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        const tabs = document.querySelectorAll('.tab');
        if (tabs.length > 0) {
            navigateTab(1, Array.from(tabs).map(tab => ({ type: tab.textContent, items: [] })));
        }
    });
    
    document.getElementById('auto-toggle').addEventListener('click', () => {
        toggleAutoSwitch();
    });
});

// CSS animations (akan ditambahkan ke styles.css)
const style = document.createElement('style');
style.textContent = `
    .row-slide-in {
        animation: slideInRow 0.6s ease forwards;
        opacity: 0;
        transform: translateX(-20px);
    }
    
    @keyframes slideInRow {
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .price-updating {
        animation: pulsePrice 1s ease;
    }
    
    @keyframes pulsePrice {
        0% { background-color: transparent; }
        50% { background-color: rgba(218, 165, 32, 0.2); }
        100% { background-color: transparent; }
    }
    
    .table-transition {
        position: relative;
    }
    
    .table-footer {
        text-align: center;
        padding: 10px;
        font-size: 0.9em;
        color: #666;
        border-top: 1px solid #eee;
        margin-top: 15px;
    }
    
    .highlight {
        font-weight: bold;
        color: #b8860b;
    }
`;
document.head.appendChild(style);
