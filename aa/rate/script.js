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

// Fungsi untuk parsing CSV ke JSON
function parseCSVToJSON(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentLine = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j] ? currentLine[j].trim() : '';
        }
        
        result.push(obj);
    }
    
    return result;
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
        
        // Update UI dengan data yang telah diambil
        updateMarquee();
        updateBranches();
        groupDataByType();
        
    } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback data jika terjadi error
        productData = [
            { jenis: "Emas", nama: "Emas 24 Karat", harga: "1,000,000" },
            { jenis: "Emas", nama: "Emas 22 Karat", harga: "900,000" },
            { jenis: "Antam", nama: "Antam 1 gram", harga: "1,050,000" },
            { jenis: "Antam", nama: "Antam 5 gram", harga: "5,200,000" },
            { jenis: "Archi", nama: "Archi 1 gram", harga: "1,040,000" },
            { jenis: "Archi", nama: "Archi 2.5 gram", harga: "2,550,000" }
        ];
        groupDataByType();
    }
}

// Fungsi untuk mengelompokkan data berdasarkan tipe
function groupDataByType() {
    const groupedData = {};
    
    productData.forEach(item => {
        if (!groupedData[item.jenis]) {
            groupedData[item.jenis] = [];
        }
        groupedData[item.jenis].push(item);
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
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nama Produk</th>
                    <th>Harga (Rp)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    currentData.items.forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.nama || '-'}</td>
                <td>${item.harga || '-'}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContent.innerHTML = tableHTML;
    
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
    }
}

// Fungsi untuk toggle auto switch
function toggleAutoSwitch(data) {
    isAutoSwitchEnabled = !isAutoSwitchEnabled;
    const toggleBtn = document.getElementById('auto-toggle');
    
    if (isAutoSwitchEnabled) {
        toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Auto: ON';
        startAutoSwitch(data);
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-play"></i> Auto: OFF';
        clearInterval(autoSwitchInterval);
    }
}

// Fungsi untuk memulai auto switch
function startAutoSwitch(data) {
    clearInterval(autoSwitchInterval);
    
    autoSwitchInterval = setInterval(() => {
        const nextIndex = (currentTabIndex + 1) % data.length;
        
        // Hapus class active dari semua tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // Tambah class active ke tab baru
        document.querySelectorAll('.tab')[nextIndex].classList.add('active');
        
        currentTabIndex = nextIndex;
        showTableForCurrentTab(data);
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

// Inisialisasi ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Fetch data dari spreadsheet
    fetchData();
    
    // Setup event listeners untuk navigasi
    document.getElementById('prev-btn').addEventListener('click', () => {
        navigateTab(-1, productData);
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        navigateTab(1, productData);
    });
    
    document.getElementById('auto-toggle').addEventListener('click', () => {
        toggleAutoSwitch(productData);
    });
});

// Fallback jika data tidak berhasil diambil
setTimeout(() => {
    if (productData.length === 0) {
        productData = [
            { jenis: "Emas", nama: "Emas 24 Karat", harga: "1,000,000" },
            { jenis: "Emas", nama: "Emas 22 Karat", harga: "900,000" },
            { jenis: "Antam", nama: "Antam 1 gram", harga: "1,050,000" },
            { jenis: "Antam", nama: "Antam 5 gram", harga: "5,200,000" },
            { jenis: "Archi", nama: "Archi 1 gram", harga: "1,040,000" },
            { jenis: "Archi", nama: "Archi 2.5 gram", harga: "2,550,000" }
        ];
        groupDataByType();
    }
}, 3000);
