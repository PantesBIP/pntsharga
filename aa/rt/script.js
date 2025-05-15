// Add this at the top with other variables
let runningTextData = [];

// Add this function to load running text data
async function loadRunningTextData() {
    try {
        // Replace with your actual Google Sheets URL for running text
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/YOUR_SPREADSHEET_ID/pub?gid=0&single=true&output=csv');
        const csvText = await response.text();
        const data = Papa.parse(csvText, { header: true }).data;
        
        // Filter out empty rows and format the data
        runningTextData = data.filter(row => row.text && row.text.trim() !== '')
                             .map(row => ({
                                 text: row.text,
                                 icon: row.icon || 'fa-info-circle' // Default icon
                             }));
        
        updateRunningText();
    } catch (error) {
        console.error('Error loading running text data:', error);
        // Fallback data
        runningTextData = [
            { text: "Harga emas diperbarui setiap 15 menit", icon: "fa-sync-alt" },
            { text: "Gratis konsultasi investasi emas", icon: "fa-comments" },
            { text: "Belanja emas dengan harga terbaik", icon: "fa-shopping-cart" }
        ];
        updateRunningText();
    }
}

function updateRunningText() {
    const runningTextElement = document.querySelector('.running-text');
    
    if (!runningTextData.length) return;
    
    // Duplicate the data for seamless looping
    const doubledData = [...runningTextData, ...runningTextData];
    
    runningTextElement.innerHTML = doubledData.map(item => 
        `<span><i class="fas ${item.icon}"></i> ${item.text}</span>`
    ).join('');
    
    // Adjust animation duration based on content length
    const totalWidth = runningTextElement.scrollWidth;
    const duration = Math.max(30, totalWidth / 50); // Adjust speed here
    
    runningTextElement.style.animationDuration = `${duration}s`;
    
    // Pause animation on hover
    runningTextElement.addEventListener('mouseenter', () => {
        runningTextElement.style.animationPlayState = 'paused';
    });
    
    runningTextElement.addEventListener('mouseleave', () => {
        runningTextElement.style.animationPlayState = 'running';
    });
}

// Update the DOMContentLoaded event to load running text
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const gamerNav = document.querySelector('.gamer-nav');

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

    loadPriceData();
    loadRunningTextData(); // Add this line
    setInterval(rotateTables, 25000); // Rotate every 40 seconds
});
