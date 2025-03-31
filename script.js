document.addEventListener('DOMContentLoaded', function() {
   // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');
    
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        gamerNav.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function() {
        gamerNav.classList.remove('active');
    });

    // Prevent menu from closing when clicking inside it
    gamerNav.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Card click handlers
    const cards = document.querySelectorAll('.card');
    const priceTableContainer = document.getElementById('priceTableContainer');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            loadPriceData(type);
            
            // Remove active class from all cards
            cards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            this.classList.add('active');
        });
    });

    // Function to load price data from JSON file
    function loadPriceData(type) {
        // Show loading state
        priceTableContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Memuat data...</p></div>';
        
        // Fetch data from JSON file
        fetch('data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                displayPriceTable(type, data[type]);
            })
            .catch(error => {
                console.error('Error loading price data:', error);
                priceTableContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Gagal memuat data. Silakan coba lagi.</p>
                    </div>
                `;
            });
    }

    // Function to display price table
    function displayPriceTable(type, data) {
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
                    <td>${item.code}</td>
                    <td class="highlight">${formatCurrency(item.sellPrice)}</td>
                    <td>${formatCurrency(item.buybackPrice)}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
            <div class="table-footer">
                <p>Terakhir diperbarui: ${new Date().toLocaleString('id-ID')}</p>
            </div>
        `;

        priceTableContainer.innerHTML = tableHTML;
    }

   // Function to load price data from JSON files
async function loadPriceData(type) {
    // Show loading state
    priceTableContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Memuat data...</p></div>';
    
    try {
        // Fetch both current and old data
        const [currentResponse, oldResponse] = await Promise.all([
            fetch('data.json'),
            fetch('old_data.json')
        ]);
        
        const [currentData, oldData] = await Promise.all([
            currentResponse.json(),
            oldResponse.json()
        ]);
        
        displayPriceTable(type, currentData[type], oldData[type]);
    } catch (error) {
        console.error('Error loading price data:', error);
        priceTableContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data. Silakan coba lagi.</p>
            </div>
        `;
    }
}

// Function to display price table with change indicators
function displayPriceTable(type, currentData, oldData) {
    if (!currentData || currentData.length === 0) {
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
                    <th>Perubahan</th>
                    <th>Harga Buyback</th>
                    <th>Perubahan</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentData.forEach(item => {
        // Find corresponding old item
        const oldItem = oldData?.find(old => old.code === item.code) || {};
        
        // Calculate changes for sell price
        const sellChange = item.sellPrice - (oldItem.sellPrice || item.sellPrice);
        const sellPercentage = oldItem.sellPrice 
            ? ((sellChange) / oldItem.sellPrice * 100).toFixed(2)
            : 0;
        
        // Calculate changes for buyback price
        const buybackChange = item.buybackPrice - (oldItem.buybackPrice || item.buybackPrice);
        const buybackPercentage = oldItem.buybackPrice 
            ? ((buybackChange) / oldItem.buybackPrice * 100).toFixed(2)
            : 0;
        
        tableHTML += `
            <tr>
                <td>${item.code}</td>
                <td class="highlight">${formatCurrency(item.sellPrice)}</td>
                <td>${renderChangeIndicator(sellChange, sellPercentage)}</td>
                <td>${formatCurrency(item.buybackPrice)}</td>
                <td>${item.buybackPrice > 0 ? renderChangeIndicator(buybackChange, buybackPercentage) : '-'}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        <div class="table-footer">
            <p>Terakhir diperbarui: ${new Date().toLocaleString('id-ID')}</p>
        </div>
    `;

    priceTableContainer.innerHTML = tableHTML;
}

// Helper function to render change indicator
function renderChangeIndicator(change, percentage) {
    if (change === 0) return '<span class="price-change neutral">→ 0%</span>';
    
    const isPositive = change > 0;
    const arrow = isPositive ? '↑' : '↓';
    const absPercentage = Math.abs(percentage);
    
    return `
        <span class="price-change ${isPositive ? 'up' : 'down'}">
            ${arrow} ${absPercentage}%
        </span>
    `;
}


    // Helper function to format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Initialize with first card data
    loadPriceData('emas');
    cards[0].classList.add('active');
});
