// Add this at the top with other global variables
let previousPrices = {};

// Replace your existing animateTableTransition function with this:
function animateTableTransition(elementId, data, type) {
  const tableElement = document.getElementById(elementId);
  
  // Fade out existing table
  if (tableElement.innerHTML) {
    tableElement.style.opacity = '0';
    tableElement.style.transition = 'opacity 0.4s ease';
  }
  
  setTimeout(() => {
    tableElement.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-sync-alt fa-spin"></i>
      </div>
    `;
    tableElement.style.opacity = '1';
    
    setTimeout(() => {
      tableElement.innerHTML = generateTableHTML(data, type);
      
      const rows = tableElement.querySelectorAll('tbody tr');
      rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        row.style.transition = `all 0.5s ease ${index * 0.1}s`;
        
        setTimeout(() => {
          row.style.opacity = '1';
          row.style.transform = 'translateY(0)';
        }, 50);
        
        // Highlight price changes
        const kode = data[index]?.kode;
        if (kode && previousPrices[kode]) {
          const hargaCells = row.querySelectorAll('.highlight');
          const currentHargaJual = data[index].harga_jual;
          const currentBuyback = data[index].buyback;
          
          if (currentHargaJual > previousPrices[kode].harga_jual) {
            hargaCells[0].classList.add('price-up');
          } else if (currentHargaJual < previousPrices[kode].harga_jual) {
            hargaCells[0].classList.add('price-down');
          }
          
          if (currentBuyback > previousPrices[kode].buyback) {
            hargaCells[1].classList.add('price-up');
          } else if (currentBuyback < previousPrices[kode].buyback) {
            hargaCells[1].classList.add('price-down');
          }
          
          setTimeout(() => {
            hargaCells[0].classList.remove('price-up', 'price-down');
            hargaCells[1].classList.remove('price-up', 'price-down');
          }, 2000);
        }
      });
      
      // Pulse animation for prices
      const prices = tableElement.querySelectorAll('.highlight');
      prices.forEach(price => {
        price.classList.add('price-updating');
        setTimeout(() => {
          price.classList.remove('price-updating');
        }, 1200);
      });
    }, 500);
  }, 400);
}

// Update your displayTables function to track previous prices:
function displayTables(type) {
  const data = tableData[type];
  if (!data || data.length === 0) {
    showError();
    return;
  }

  // Store current prices before update
  const currentPrices = {};
  data.forEach(item => {
    currentPrices[item.kode] = {
      harga_jual: item.harga_jual,
      buyback: item.buyback
    };
  });

  // Split data
  const half = Math.ceil(data.length / 2);
  const leftData = data.slice(0, half);
  const rightData = data.slice(half);

  animateTableTransition('emasTableLeft', leftData, type);
  animateTableTransition('emasTableRight', rightData, type);

  // Store current prices for next comparison
  previousPrices = currentPrices;

  // Animate headers
  document.querySelectorAll('.table-wrapper h3').forEach(header => {
    header.textContent = type.toUpperCase();
    header.classList.add('table-title-animate');
    setTimeout(() => {
      header.classList.remove('table-title-animate');
    }, 1500);
  });
}

// Update generateTableHTML to include transition classes:
function generateTableHTML(data, type) {
  if (data.length === 0) {
    return '<div class="no-data">Data tidak tersedia</div>';
  }

  let tableHTML = `
    <div class="table-transition table-fade">
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

  data.forEach((item, index) => {
    tableHTML += `
      <tr style="animation-delay: ${index * 0.1}s">
        <td>${item.kode || '-'}</td>
        <td class="highlight price-change">${formatCurrency(item.harga_jual || 0)}</td>
        <td class="highlight price-change">${item.buyback ? formatCurrency(item.buyback) : '-'}</td>
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
