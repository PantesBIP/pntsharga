document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');
    
    mobileMenuBtn.addEventListener('click', function() {
        gamerNav.classList.toggle('active');
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

    // Function to load price data via AJAX
    function loadPriceData(type) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                const priceData = data[type];
                displayPriceTable(type, priceData);
            })
            .catch(error => {
                console.error('Error loading price data:', error);
                priceTableContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Gagal memuat data harga. Silakan coba lagi.</p>
                    </div>
                `;
            });
    }

  // Function to display price table
function displayPriceTable(type, data) {
    // Buat container scrollable untuk mobile
    let tableHTML = `
        <div class="table-responsive">
            <table class="price-table show fade-in">
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
        </div>
        <div class="table-footer">
            <p>Terakhir diperbarui: ${new Date().toLocaleString()}</p>
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
});
