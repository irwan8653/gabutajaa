// Key names for localStorage
const GARBLED_TEXT_KEY = "garbledText";
const QR_CODE_VALUE_KEY = "qrCodeValue";

// --- PETA SUBTITUSI TETAP UNTUK KONSISTENSI ---
// 'a' akan selalu menjadi 'z', 'b' menjadi 'y', dst.
const ENCRYPTION_MAP = {};
const DECRYPTION_MAP = {};
const alphabet = "abcdefghijklmnopqrstuvwxyz";

for (let i = 0; i < alphabet.length; i++) {
  const originalChar = alphabet[i];
  const encryptedChar = alphabet[alphabet.length - 1 - i];
  ENCRYPTION_MAP[originalChar] = encryptedChar;
  DECRYPTION_MAP[encryptedChar] = originalChar;
}

// Fungsi untuk menghasilkan tulisan yang tidak jelas (garbled)
function generateGarbledText(text) {
  let garbledText = "";
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    let processedChar = char;

    if (char >= "a" && char <= "z") {
      processedChar = ENCRYPTION_MAP[char];
    } else if (char >= "A" && char <= "Z") {
      const lowerChar = char.toLowerCase();
      const encryptedLowerChar = ENCRYPTION_MAP[lowerChar];
      processedChar = encryptedLowerChar.toUpperCase();
    }
    garbledText += processedChar;
  }
  return garbledText;
}

// Fungsi untuk menerjemahkan tulisan yang tidak jelas kembali ke teks asli
function translateGarbledText(garbledText) {
  let originalText = "";
  for (let i = 0; i < garbledText.length; i++) {
    let char = garbledText[i];
    let processedChar = char;

    if (char >= "a" && char <= "z") {
      processedChar = DECRYPTION_MAP[char];
    } else if (char >= "A" && char <= "Z") {
      const lowerChar = char.toLowerCase();
      const decryptedLowerChar = DECRYPTION_MAP[lowerChar];
      processedChar = decryptedLowerChar.toUpperCase();
    }
    originalText += processedChar;
  }
  return originalText;
}

// Fungsi untuk memanggil Gemini API dan mendapatkan saran tema
async function getLLMSuggestion(promptText) {
  llmSuggestionContainer.classList.remove("hidden");
  llmLoadingIndicator.classList.remove("hidden");
  llmSuggestionText.textContent = "";

  try {
    let chatHistory = [];
    chatHistory.push({
      role: "user",
      parts: [
        {
          text: `Berikan ide tema atau konteks kreatif yang singkat dan menarik (maksimal 15 kata) untuk kalimat berikut: '${promptText}'. Hanya berikan idenya saja, tanpa penjelasan.`,
        },
      ],
    });
    const payload = { contents: chatHistory };
    // Replace with your actual Gemini API Key
    const apiKey = "YOUR_GEMINI_API_KEY"; // IMPORTANT: Replace with your actual API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const text = result.candidates[0].content.parts[0].text;
      llmSuggestionText.textContent = text;
    } else {
      llmSuggestionText.textContent =
        "Tidak dapat menghasilkan saran tema saat ini.";
      console.error("Gemini API response structure unexpected:", result);
    }
  } catch (error) {
    llmSuggestionText.textContent = "Terjadi kesalahan saat memanggil AI.";
    console.error("Error calling Gemini API:", error);
  } finally {
    llmLoadingIndicator.classList.add("hidden");
  }
}

// Get elements from DOM
const tabTextGenerator = document.getElementById("tabTextGenerator");
const tabQrGenerator = document.getElementById("tabQrGenerator");
const textGeneratorSection = document.getElementById("textGeneratorSection");
const qrCodeGeneratorSection = document.getElementById(
  "qrCodeGeneratorSection"
);

const originalTextInput = document.getElementById("originalText");
const generateBtn = document.getElementById("generateBtn");
const resultTextInput = document.getElementById("resultText");
const copyBtn = document.getElementById("copyBtn");
const copyMessage = document.getElementById("copyMessage");
const llmSuggestionContainer = document.getElementById(
  "llmSuggestionContainer"
);
const llmSuggestionText = document.getElementById("llmSuggestionText");
const llmLoadingIndicator = document.getElementById("llmLoadingIndicator");
const clearAllBtn = document.getElementById("clearAllBtn");

const qrInput = document.getElementById("qrInput");
const generateQrBtn = document.getElementById("generateQrBtn");
const qrImg = document.getElementById("qrImg");
const qrCodeDisplay = document.getElementById("qrCodeDisplay");
const downloadQrBtn = document.createElement("button"); // Tombol download baru

let preQrValue = ""; // To prevent generating same QR code repeatedly

// Konfigurasi tombol download
downloadQrBtn.id = "downloadQrBtn";
downloadQrBtn.className =
  "button-gradient blue py-2 px-4 text-base font-bold flex-1 mt-4 hidden"; // Hidden by default
downloadQrBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M3 17V5a2 2 0 012-2h10a2 2 0 012 2v12h1a1 1 0 110 2H2a1 1 0 110-2h1zm3-2a1 1 0 000 2h8a1 1 0 100-2H6zm0-8a1 1 0 000 2h8a1 1 0 100-2H6zm0 4a1 1 0 000 2h4a1 1 0 100-2H6zM10 7a1 1 0 011 1v3.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586V8a1 1 0 011-1z" clip-rule="evenodd" />
  </svg>
  Unduh Kode QR
`;
// Masukkan tombol download setelah elemen gambar QR
qrCodeDisplay.parentNode.insertBefore(downloadQrBtn, qrCodeDisplay.nextSibling);

// Function to switch tabs
function showTab(tabId) {
  if (tabId === "textGenerator") {
    textGeneratorSection.classList.remove("hidden");
    qrCodeGeneratorSection.classList.add("hidden");
    tabTextGenerator.classList.add("bg-indigo-500", "text-white");
    tabTextGenerator.classList.remove("bg-gray-200", "text-gray-700");
    tabQrGenerator.classList.remove("bg-indigo-500", "text-white");
    tabQrGenerator.classList.add("bg-gray-200", "text-gray-700");
    downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download saat beralih ke generator teks
  } else if (tabId === "qrGenerator") {
    textGeneratorSection.classList.add("hidden");
    qrCodeGeneratorSection.classList.remove("hidden");
    tabQrGenerator.classList.add("bg-indigo-500", "text-white");
    tabQrGenerator.classList.remove("bg-gray-200", "text-gray-700");
    tabTextGenerator.classList.remove("bg-indigo-500", "text-white");
    tabTextGenerator.classList.add("bg-gray-200", "text-gray-700");
    // Tampilkan tombol download jika ada gambar QR yang aktif
    if (qrImg.src && qrCodeDisplay.classList.contains("active")) {
      downloadQrBtn.classList.remove("hidden");
    }
  }
}

// Event listeners for tab buttons
tabTextGenerator.addEventListener("click", () => showTab("textGenerator"));
tabQrGenerator.addEventListener("click", () => showTab("qrGenerator"));

// Event listener for 'Buat Teks Aneh' button
generateBtn.addEventListener("click", async () => {
  const originalText = originalTextInput.value.trim();
  if (!originalText) {
    originalTextInput.value =
      "Masukkan teks yang ingin diubah terlebih dahulu!";
    return;
  }

  const garbled = generateGarbledText(originalText);
  resultTextInput.value = garbled;

  localStorage.setItem(GARBLED_TEXT_KEY, garbled);

  copyMessage.classList.add("hidden");
  llmSuggestionContainer.classList.add("hidden"); // Sembunyikan saran AI saat generate baru

  await getLLMSuggestion(originalText);
});

// Event listener for 'Salin' button
copyBtn.addEventListener("click", () => {
  resultTextInput.select();
  document.execCommand("copy");
  copyMessage.classList.remove("hidden");
  setTimeout(() => {
    copyMessage.classList.add("hidden");
  }, 2000);
});

// Event listener for QR code generation
generateQrBtn.addEventListener("click", () => {
  let qrValue = qrInput.value.trim();
  if (!qrValue || preQrValue === qrValue) return; // Prevent generating same QR code repeatedly
  preQrValue = qrValue;
  generateQrBtn.innerText = "Membuat Kode QR...";
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrValue}`;
  qrImg.onload = () => {
    qrCodeDisplay.classList.add("active");
    generateQrBtn.innerText = "Buat Kode QR 📸";
    localStorage.setItem(QR_CODE_VALUE_KEY, qrValue); // Save QR value to localStorage
    downloadQrBtn.classList.remove("hidden"); // Tampilkan tombol download setelah QR code berhasil dibuat
  };
  qrImg.onerror = () => {
    generateQrBtn.innerText = "Gagal Membuat QR";
    console.error("Failed to load QR code image.");
    downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download jika gagal
  };
});

qrInput.addEventListener("keyup", () => {
  if (!qrInput.value.trim()) {
    qrCodeDisplay.classList.remove("active");
    preQrValue = ""; // Reset preValue when input is cleared
    downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download jika input kosong
  }
});

// Event listener for 'Unduh Kode QR' button
downloadQrBtn.addEventListener("click", () => {
  const qrCodeUrl = qrImg.src;
  if (qrCodeUrl) {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qrcode.png"; // Nama file default
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert("Tidak ada Kode QR untuk diunduh. Harap buat satu terlebih dahulu.");
  }
});

// Event listener for 'Bersihkan Semua' button
clearAllBtn.addEventListener("click", () => {
  originalTextInput.value = "";
  resultTextInput.value = "";
  llmSuggestionText.textContent = "";
  llmSuggestionContainer.classList.add("hidden");
  copyMessage.classList.add("hidden");
  localStorage.removeItem(GARBLED_TEXT_KEY);
  originalTextInput.placeholder = "Masukkan teks asli Anda di sini...";
  resultTextInput.placeholder = "Tulisan aneh akan muncul di sini...";

  qrInput.value = "";
  qrImg.src = ""; // Clear QR image
  qrCodeDisplay.classList.remove("active");
  localStorage.removeItem(QR_CODE_VALUE_KEY); // Clear QR value from localStorage
  downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download

  // Set default text for Text Generator
  originalTextInput.value = "Ini adalah pesan rahasia yang ingin saya acak!";
  showTab("textGenerator"); // Show text generator tab by default after clearing
});

// Load data from localStorage when page is loaded
document.addEventListener("DOMContentLoaded", () => {
  const savedGarbledText = localStorage.getItem(GARBLED_TEXT_KEY);
  const savedQrCodeValue = localStorage.getItem(QR_CODE_VALUE_KEY);

  if (savedGarbledText) {
    resultTextInput.value = savedGarbledText;
    originalTextInput.value = translateGarbledText(savedGarbledText); // Show original if available
  } else {
    originalTextInput.value = "Ini adalah pesan rahasia yang ingin saya acak!";
  }

  if (savedQrCodeValue) {
    qrInput.value = savedQrCodeValue;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${savedQrCodeValue}`;
    qrCodeDisplay.classList.add("active");
    // Tampilkan tombol download jika ada QR code yang tersimpan
    downloadQrBtn.classList.remove("hidden");
  } else {
    qrImg.src = ""; // Ensure it's empty if no saved QR
    qrCodeDisplay.classList.remove("active");
    downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download jika tidak ada QR
  }

  showTab("textGenerator"); // Default to text generator tab on load
});
