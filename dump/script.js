// Konfigurasi Sheet
const SHEET_CONFIG = {
  harga: { gid: "216173443", name: "Harga" },
  runningText: { gid: "1779766141", name: "RunningText" },
  iklan: { gid: "1303897065", name: "Iklan" },
};

// Base URL untuk Google Sheets
const SHEET_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFH0squhL_c2KoNryfBrysWZEKTTUpthg_1XVE-fT3r7-ew1_lkbFqENefrlBLHClis53FyDdNiUkh/pub";

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

let tableData = {};
let currentTableType = "emas";
let rotationInterval;
let videoTimeout;
let videoPlayed = false;
let adsData = [];
let currentSessionAds = [];
let youtubeIframe = null;
let isMuted = false;
let currentVideoIndex = 0;
let activeAds = [];
let videoTimer = null;
let isYouTubeAPILoaded = false;

// Load data and initialize
document.addEventListener("DOMContentLoaded", function () {
  console.log("Memuat aplikasi harga emas...");

  const leftNavBtn = document.querySelector(".left-nav");
  const rightNavBtn = document.querySelector(".right-nav");

  // Navigation buttons
  leftNavBtn.addEventListener("click", function () {
    navigateTables("left");
  });

  rightNavBtn.addEventListener("click", function () {
    navigateTables("right");
  });

  // Load initial data
  loadPriceData();
  loadRunningText();
  loadAdsData();

  // Start rotation interval
  startRotationInterval();

  // Setup event listeners untuk interaksi pengguna
  setupUserInteractionListeners();

  // Load YouTube API immediately
  loadYouTubeAPI();

  // Adjust table font size based on content
  adjustTableFontSize();
});

function adjustTableFontSize() {
  // Function to adjust font size based on table content
  const adjustFontSizeForTable = (tableElement) => {
    if (!tableElement) return;
    
    const rows = tableElement.querySelectorAll('tr');
    if (rows.length > 10) { // Jika ada banyak data
      tableElement.style.fontSize = '0.85rem';
    } else if (rows.length > 5) {
      tableElement.style.fontSize = '0.9rem';
    } else {
      tableElement.style.fontSize = '0.95rem';
    }
  };

  // Observe changes in table content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        const leftTable = document.querySelector('#priceTableLeft table');
        const rightTable = document.querySelector('#priceTableRight table');
        
        if (leftTable) adjustFontSizeForTable(leftTable);
        if (rightTable) adjustFontSizeForTable(rightTable);
      }
    });
  });

  // Observe both table containers
  const leftTableContainer = document.getElementById('priceTableLeft');
  const rightTableContainer = document.getElementById('priceTableRight');
  
  if (leftTableContainer) {
    observer.observe(leftTableContainer, { childList: true, subtree: true });
  }
  if (rightTableContainer) {
    observer.observe(rightTableContainer, { childList: true, subtree: true });
  }
}

// ... (fungsi-fungsi lainnya tetap sama seperti sebelumnya)
// ... (loadYouTubeAPI, setupUserInteractionListeners, handleUserInteraction, dll.)

function loadYouTubeAPI() {
  if (!isYouTubeAPILoaded) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    isYouTubeAPILoaded = true;
  }
}

function setupUserInteractionListeners() {
  document.addEventListener("click", handleUserInteraction);
  document.addEventListener("touchstart", handleUserInteraction);
  document.addEventListener("keydown", handleUserInteraction);
}

function handleUserInteraction() {
  document.removeEventListener("click", handleUserInteraction);
  document.removeEventListener("touchstart", handleUserInteraction);
  document.removeEventListener("keydown", handleUserInteraction);

  console.log("Interaksi pengguna terdeteksi, autoplay diizinkan");
}

function startRotationInterval() {
  if (rotationInterval) clearInterval(rotationInterval);

  rotationInterval = setInterval(function () {
    navigateTables("right");
  }, 25000);
}

function navigateTables(direction) {
  const types = ["emas", "antam", "archi"];
  const currentIndex = types.indexOf(currentTableType);
  let nextIndex;

  if (direction === "right") {
    nextIndex = (currentIndex + 1) % types.length;
  } else {
    nextIndex = (currentIndex - 1 + types.length) % types.length;
  }

  currentTableType = types[nextIndex];
  displayTables(currentTableType);

  if (currentTableType === "archi" && hasActiveAds() && !videoPlayed) {
    showVideoAfterDelay();
  }
}

function hasActiveAds() {
  activeAds = adsData.filter(
    (ad) =>
      ad.status &&
      ad.status.toLowerCase() === "active" &&
      ad.video_url &&
      isValidYouTubeUrl(ad.video_url) &&
      !currentSessionAds.includes(ad.video_url)
  );

  console.log("Iklan aktif tersedia:", activeAds.length);
  return activeAds.length > 0;
}

function isValidYouTubeUrl(url) {
  if (!url) return false;

  const cleanUrl = url.trim();
  if (!cleanUrl) return false;

  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
  return youtubePattern.test(cleanUrl);
}

function convertToEmbedUrl(url) {
  if (!url) return "";

  const cleanUrl = url.trim();
  let videoId = "";

  if (cleanUrl.includes("youtube.com/watch?v=")) {
    videoId = cleanUrl.split("v=")[1];
    const ampersandPosition = videoId.indexOf("&");
    if (ampersandPosition !== -1) {
      videoId = videoId.substring(0, ampersandPosition);
    }
  } else if (cleanUrl.includes("youtu.be/")) {
    videoId = cleanUrl.split("youtu.be/")[1];
    const questionMarkPosition = videoId.indexOf("?");
    if (questionMarkPosition !== -1) {
      videoId = videoId.substring(0, questionMarkPosition);
    }
  } else if (cleanUrl.includes("youtube.com/embed/")) {
    videoId = cleanUrl.split("embed/")[1];
    const slashPosition = videoId.indexOf("/");
    if (slashPosition !== -1) {
      videoId = videoId.substring(0, slashPosition);
    }
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`;
  }

  return cleanUrl;
}

function showVideoAfterDelay() {
  if (videoTimeout) clearTimeout(videoTimeout);

  videoTimeout = setTimeout(function () {
    showVideo();
  }, 5000);
}

function showVideo() {
  if (activeAds.length === 0) {
    console.log("Tidak ada iklan aktif yang belum ditampilkan");
    videoPlayed = true;
    return;
  }

  // Reset index jika melebihi jumlah video
  if (currentVideoIndex >= activeAds.length) {
    currentVideoIndex = 0;
  }

  const selectedAd = activeAds[currentVideoIndex];
  const videoContainer = document.getElementById("videoContainer");
  const videoWrapper = document.querySelector(".video-wrapper");

  console.log(
    "Menampilkan video:",
    currentVideoIndex + 1,
    "dari",
    activeAds.length,
    "-",
    selectedAd.video_url
  );

  // Sembunyikan tabel
  document.getElementById("tableEmas").style.display = "none";
  document.getElementById("tableAntam").style.display = "none";

  // Bersihkan video wrapper dan buat iframe
  videoWrapper.innerHTML = "";

  const embedUrl = convertToEmbedUrl(selectedAd.video_url);
  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.width = "100%";
  iframe.height = "400";
  iframe.frameBorder = "0";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.style.borderRadius = "8px";
  iframe.title = "Video Promo " + (currentVideoIndex + 1);
  iframe.id = "youtube-iframe";

  youtubeIframe = iframe;

  // Tambahkan controls
  const controlsDiv = document.createElement("div");
  controlsDiv.className = "video-controls";

  // Video counter
  const videoCounter = document.createElement("div");
  videoCounter.className = "video-counter";
  videoCounter.innerHTML = `<span>${currentVideoIndex + 1}/${
    activeAds.length
  }</span>`;

  // Volume button
  const volumeBtn = document.createElement("button");
  volumeBtn.className = "volume-btn";
  volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  volumeBtn.onclick = toggleMute;

  // Volume slider
  const volumeSlider = document.createElement("div");
  volumeSlider.className = "volume-slider";
  volumeSlider.innerHTML = `
        <i class="fas fa-volume-down"></i>
        <input type="range" id="volume-control" min="0" max="100" value="100" step="1">
        <i class="fas fa-volume-up"></i>
    `;

  const volumeControl = volumeSlider.querySelector("#volume-control");
  volumeControl.addEventListener("input", function () {
    setVolume(this.value);
  });

  // Skip button
  const skipBtn = document.createElement("button");
  skipBtn.className = "skip-btn";
  skipBtn.innerHTML = '<i class="fas fa-forward"></i> Lewati';
  skipBtn.onclick = function () {
    playNextVideo();
  };

  controlsDiv.appendChild(videoCounter);
  controlsDiv.appendChild(volumeBtn);
  controlsDiv.appendChild(volumeSlider);
  controlsDiv.appendChild(skipBtn);

  videoWrapper.appendChild(iframe);
  videoWrapper.appendChild(controlsDiv);

  // Tampilkan container video
  videoContainer.classList.add("active");
  videoPlayed = true;

  // Setup YouTube Player untuk iframe ini
  setupYouTubePlayer();

  // Set timer untuk video berikutnya (jika ada)
  setupVideoTimer();
}

function setupYouTubePlayer() {
  // Gunakan interval untuk memastikan iframe sudah siap
  const checkReady = setInterval(() => {
    if (document.getElementById("youtube-iframe")) {
      clearInterval(checkReady);

      // Buat player YouTube baru
      new YT.Player("youtube-iframe", {
        events: {
          onReady: (event) => onPlayerReady(event),
          onStateChange: (event) => onPlayerStateChange(event),
        },
      });
    }
  }, 100);
}

function setupVideoTimer() {
  // Clear existing timer
  if (videoTimer) clearTimeout(videoTimer);

  // Set timer untuk 30 detik, lalu lanjut ke video berikutnya
  videoTimer = setTimeout(function () {
    playNextVideo();
  }, 30000);
}

function playNextVideo() {
  console.log("Memainkan video berikutnya...");

  // Tambahkan video saat ini ke session agar tidak diulang
  if (activeAds[currentVideoIndex]) {
    currentSessionAds.push(activeAds[currentVideoIndex].video_url);
  }

  // Pindah ke video berikutnya
  currentVideoIndex++;

  if (currentVideoIndex < activeAds.length) {
    // Masih ada video berikutnya, tampilkan
    showVideo();
  } else {
    // Semua video sudah ditampilkan, sembunyikan
    hideVideo();
  }
}

// YouTube API callback
window.onYouTubeIframeAPIReady = function () {
  console.log("YouTube API siap digunakan");
  // Tidak perlu melakukan apa-apa di sini karena kita membuat player manually
};

function onPlayerReady(event) {
  console.log("Player siap untuk video", currentVideoIndex + 1);

  // Set volume ke 100% (tidak mute)
  event.target.setVolume(100);
  event.target.unMute();

  // Coba play video - gunakan timeout untuk memastikan
  setTimeout(() => {
    try {
      event.target.playVideo();
      console.log("Video diputar otomatis");
    } catch (error) {
      console.log("Autoplay diblokir, menunggu interaksi pengguna");
      // Jika autoplay diblokir, tampilkan tombol play manual
      showPlayButton();
    }
  }, 1000);
}

function onPlayerStateChange(event) {
  console.log("Status player berubah:", event.data);

  // Jika video selesai (status = 0), lanjut ke video berikutnya
  if (event.data === YT.PlayerState.ENDED) {
    console.log("Video selesai, melanjutkan ke video berikutnya...");
    playNextVideo();
  }
}

function showPlayButton() {
  const videoWrapper = document.querySelector(".video-wrapper");
  const playBtn = document.createElement("button");
  playBtn.className = "play-btn";
  playBtn.innerHTML = '<i class="fas fa-play"></i> Putar Video';
  playBtn.style.position = "absolute";
  playBtn.style.top = "50%";
  playBtn.style.left = "50%";
  playBtn.style.transform = "translate(-50%, -50%)";
  playBtn.style.backgroundColor = "var(--primary)";
  playBtn.style.color = "white";
  playBtn.style.border = "none";
  playBtn.style.padding = "15px 25px";
  playBtn.style.borderRadius = "8px";
  playBtn.style.cursor = "pointer";
  playBtn.style.zIndex = "90";
  playBtn.onclick = function () {
    if (youtubeIframe && youtubeIframe.player) {
      youtubeIframe.player.playVideo();
    }
    playBtn.remove();
  };

  videoWrapper.appendChild(playBtn);
}

function toggleMute() {
  if (youtubeIframe && youtubeIframe.player) {
    isMuted = !isMuted;
    if (isMuted) {
      youtubeIframe.player.mute();
      document.querySelector(".volume-btn i").className = "fas fa-volume-mute";
    } else {
      youtubeIframe.player.unMute();
      document.querySelector(".volume-btn i").className = "fas fa-volume-up";
    }
  }
}

function setVolume(volume) {
  if (youtubeIframe && youtubeIframe.player) {
    youtubeIframe.player.setVolume(volume);
    if (volume > 0) {
      isMuted = false;
      document.querySelector(".volume-btn i").className = "fas fa-volume-up";
    } else {
      isMuted = true;
      document.querySelector(".volume-btn i").className = "fas fa-volume-mute";
    }
  }
}

function hideVideo() {
  const videoContainer = document.getElementById("videoContainer");
  const videoWrapper = document.querySelector(".video-wrapper");

  console.log("Menyembunyikan video, semua video telah ditampilkan");

  // Hentikan video jika sedang diputar
  if (youtubeIframe && youtubeIframe.player) {
    try {
      youtubeIframe.player.stopVideo();
    } catch (error) {
      console.log("Tidak dapat menghentikan video:", error);
    }
  }

  // Clear timer
  if (videoTimer) clearTimeout(videoTimer);

  // Bersihkan iframe
  videoWrapper.innerHTML = "";
  youtubeIframe = null;

  // Reset video index untuk sesi berikutnya
  currentVideoIndex = 0;

  // Sembunyikan container video
  videoContainer.classList.remove("active");

  // Tampilkan kembali tabel
  document.getElementById("tableEmas").style.display = "block";
  document.getElementById("tableAntam").style.display = "block";
}

// Load and parse CSV from Google Sheets - Harga
async function loadPriceData() {
  try {
    console.log("Memuat data harga...");
    const url = `${SHEET_BASE_URL}?gid=${SHEET_CONFIG.harga.gid}&single=true&output=csv`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);

    tableData.emas = data.filter(
      (row) => row.tipe && row.tipe.toLowerCase() === "emas"
    );
    tableData.antam = data.filter(
      (row) => row.tipe && row.tipe.toLowerCase() === "antam"
    );
    tableData.archi = data.filter(
      (row) => row.tipe && row.tipe.toLowerCase() === "archi"
    );

    console.log(
      "Data loaded - Emas:",
      tableData.emas.length,
      "Antam:",
      tableData.antam.length,
      "Archi:",
      tableData.archi.length
    );

    displayTables("emas");
  } catch (error) {
    console.error("Error loading CSV data:", error);
    showError();
  }
}

// Load running text from Google Sheets
async function loadRunningText() {
  try {
    console.log("Memuat running text...");
    const url = `${SHEET_BASE_URL}?gid=${SHEET_CONFIG.runningText.gid}&single=true&output=csv`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const data = parseRunningTextCSV(csvText);

    processRunningTextData(data);
  } catch (error) {
    console.error("Error loading running text:", error);
    document.getElementById("marqueeText").textContent =
      "Harga emas terkini - Informasi terupdate setiap hari";
  }
}

// Load ads data from Google Sheets
async function loadAdsData() {
  try {
    console.log("Memuat data iklan...");
    const url = `${SHEET_BASE_URL}?gid=${SHEET_CONFIG.iklan.gid}&single=true&output=csv`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    adsData = parseAdsCSV(csvText);
    console.log("Ads data loaded:", adsData.length, "iklan");
  } catch (error) {
    console.error("Error loading ads data:", error);
  }
}

// Special parser for ads CSV
function parseAdsCSV(csvText) {
  const lines = csvText.trim().split("\n");

  if (lines.length < 1) return [];

  if (lines.length === 1) {
    const values = lines[0].split(",").map((v) => v.trim());
    if (values.length >= 7) {
      return [
        {
          judul: values[0],
          deskripsi: values[1],
          video_url: values[2],
          gambar_url: values[3],
          link1: values[4],
          link2: values[5],
          status: values[6],
        },
      ];
    }
    return [];
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.toLowerCase().trim().replace(/\s+/g, "_"));

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj = {};

      headers.forEach((header, index) => {
        if (index < values.length) {
          obj[header] = values[index];
        }
      });

      return obj;
    })
    .filter(
      (ad) =>
        ad.video_url &&
        ad.video_url.trim() !== "" &&
        ad.status &&
        ad.status.toLowerCase() === "active"
    );
}

// Special parser for running text CSV
function parseRunningTextCSV(csvText) {
  const lines = csvText.trim().split("\n");

  if (lines.length < 1) return [];

  if (lines.length === 1) {
    return [{ teks: lines[0].trim() }];
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.toLowerCase().trim().replace(/\s+/g, "_"));

  const textColumn =
    headers.find(
      (h) =>
        h.includes("teks") ||
        h.includes("text") ||
        h.includes("isi") ||
        h.includes("running")
    ) || headers[0];

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim());

      if (values.length === 1) {
        return { teks: values[0] };
      }

      const textIndex = headers.indexOf(textColumn);
      const teks =
        textIndex >= 0 && textIndex < values.length
          ? values[textIndex]
          : values.join(" ");

      return { teks };
    })
    .filter((item) => item.teks && item.teks.trim() !== "");
}

function processRunningTextData(data) {
  if (!data || data.length === 0) {
    document.getElementById("marqueeText").textContent =
      "Harga emas terkini - Informasi terupdate setiap hari";
    return;
  }

  const runningTexts = data
    .map((item) => item.teks)
    .filter((teks) => teks && teks.trim() !== "");

  if (runningTexts.length === 0) {
    document.getElementById("marqueeText").textContent =
      "Harga emas terkini - Informasi terupdate setiap hari";
    return;
  }

  const marqueeContent = runningTexts.join(" | ");

  const marqueeElement = document.getElementById("marqueeText");
  marqueeElement.textContent = marqueeContent;

  adjustMarqueeSpeed(marqueeContent.length);
}

function adjustMarqueeSpeed(textLength) {
  const marqueeElement = document.getElementById("marqueeText");
  const baseDuration = 60;
  const duration = Math.max(baseDuration, textLength / 10);

  marqueeElement.style.animation = "none";

  setTimeout(() => {
    marqueeElement.style.animation = `marquee ${duration}s linear infinite`;
  }, 10);
}

function parseCSVToJSON(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      let value = values[index] || "";
      if (["harga_jual", "buyback"].includes(header)) {
        value = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
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

  updateTableTitles(type);

  const half = Math.ceil(data.length / 2);
  const leftData = data.slice(0, half);
  const rightData = data.slice(half);

  updateTable("priceTableLeft", leftData, type);
  updateTable("priceTableRight", rightData, type);
}

function updateTableTitles(type) {
  const tableTitles = document.querySelectorAll(".table-title");

  if (type === "emas") {
    tableTitles[0].textContent = "Harga Emas";
    tableTitles[1].textContent = "Harga Emas";
  } else if (type === "antam") {
    tableTitles[0].textContent = "Harga Antam";
    tableTitles[1].textContent = "Harga Antam";
  } else if (type === "archi") {
    tableTitles[0].textContent = "Harga Archi";
    tableTitles[1].textContent = "Harga Archi";
  }
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

  data.forEach((item) => {
    tableHTML += `
            <tr>
                <td>${item.kode || "-"}</td>
                <td class="highlight">${
                  item.harga_jual ? formatCurrency(item.harga_jual) : "-"
                }</td>
                <td class="highlight">${
                  item.buyback ? formatCurrency(item.buyback) : "-"
                }</td>
            </tr>
        `;
  });

  tableHTML += `
            </tbody>
        </table>
    `;

  tableElement.innerHTML = tableHTML;

  // Adjust font size after table is updated
  setTimeout(() => {
    const table = tableElement.querySelector('table');
    if (table) {
      adjustFontSizeForTable(table);
    }
  }, 100);
}

function adjustFontSizeForTable(tableElement) {
  if (!tableElement) return;
  
  const rows = tableElement.querySelectorAll('tr');
  if (rows.length > 10) { // Jika ada banyak data
    tableElement.style.fontSize = '0.85rem';
  } else if (rows.length > 5) {
    tableElement.style.fontSize = '0.9rem';
  } else {
    tableElement.style.fontSize = '0.95rem';
  }
}

function showError() {
  const errorHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Gagal memuat data. Silakan coba lagi.</p>
        </div>
    `;
  document.getElementById("priceTableLeft").innerHTML = errorHTML;
  document.getElementById("priceTableRight").innerHTML = errorHTML;
}

// Reset session ketika halaman di-refresh
window.addEventListener("beforeunload", function () {
  currentSessionAds = [];
  videoPlayed = false;
  currentVideoIndex = 0;
});

// Handle visibility change
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    if (rotationInterval) clearInterval(rotationInterval);
    if (videoTimer) clearTimeout(videoTimer);
  } else {
    startRotationInterval();
  }
});
