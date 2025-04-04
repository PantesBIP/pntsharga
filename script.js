// Helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function renderChangeIndicator(change, percentage) {
    if (change === 0) return '<span class="price-change neutral">→ 0%</span>';
    const isPositive = change > 0;
    const arrow = isPositive ? '↑' : '↓';
    const absPercentage = Math.abs(percentage);
    return `<span class="price-change ${isPositive ? 'up' : 'down'}">${arrow} ${absPercentage}%</span>`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');
    
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        gamerNav.classList.toggle('active');
    });

    document.addEventListener('click', function() {
        gamerNav.classList.remove('active');
    });

    gamerNav.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Card click handlers
    const cards = document.querySelectorAll('.card');
    const priceTableContainer = document.getElementById('priceTableContainer');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            loadMainPriceData(type);
            cards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Initialize
    loadMainPriceData('emas');
    cards[0].classList.add('active');
    initCarousel();
});

// Main price table functions
async function loadMainPriceData(type) {
    const priceTableContainer = document.getElementById('priceTableContainer');
    priceTableContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Memuat data...</p></div>';
    
    try {
        const [currentResponse, oldResponse] = await Promise.all([
            fetch('data.json'),
            fetch('old_data.json')
        ]);
        
        const [currentData, oldData] = await Promise.all([
            currentResponse.json(),
            oldResponse.json()
        ]);
        
        displayMainPriceTable(type, currentData[type], oldData[type]);
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

function displayMainPriceTable(type, currentData, oldData) {
    const priceTableContainer = document.getElementById('priceTableContainer');
    
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
        const oldItem = oldData?.find(old => old.code === item.code) || {};
        
        const sellChange = item.sellPrice - (oldItem.sellPrice || item.sellPrice);
        const sellPercentage = oldItem.sellPrice 
            ? ((sellChange) / oldItem.sellPrice * 100).toFixed(2)
            : 0;
        
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

// Carousel functions
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    let currentIndex = 0;
    const slideCount = slides.length;
    
    // Create indicators
    slides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('carousel-indicator');
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });
    
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentIndex);
        });
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }
    
    function goToSlide(index) {
        currentIndex = (index + slideCount) % slideCount;
        updateCarousel();
    }
    
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
    });
    
    loadCarouselData();
}

async function loadCarouselData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        fillCarouselTable(1, data.emas, 'Harga Emas Berbagai Karat');
        fillCarouselTable(2, data.antam, 'Harga Logam Mulia Antam');
        fillCarouselTable(3, data.archi, 'Harga Logam Mulia Archi');
        
    } catch (error) {
        console.error('Error loading carousel data:', error);
        document.querySelectorAll('.table-responsive').forEach(table => {
            table.innerHTML = `<div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data</p>
            </div>`;
        });
    }
}

function fillCarouselTable(slideIndex, data, title) {
    const slide = document.querySelectorAll('.carousel-slide')[slideIndex];
    if (!slide) return;
    
    const tableContainer = slide.querySelector('.table-responsive');
    const titleElement = slide.querySelector('h3');
    
    titleElement.textContent = title;
    
    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<div class="error-message">Data tidak tersedia</div>';
        return;
    }

    let tableHTML = `
        <table class="price-table">
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
                <td>${item.buybackPrice ? formatCurrency(item.buybackPrice) : '-'}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}
