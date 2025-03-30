document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');
    
    mobileMenuBtn.addEventListener('click', function() {
        gamerNav.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.gamer-nav') && !e.target.closest('.mobile-menu-btn')) {
            gamerNav.classList.remove('active');
        }
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
