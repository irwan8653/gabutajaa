// Key names for localStorage
const GARBLED_TEXT_KEY = "garbledText";
const QR_CODE_VALUE_KEY = "qrCodeValue";
const MORSE_TEXT_TO_MORSE_KEY = "morseTextToMorse"; // Input teks ke morse generator
const MORSE_OUTPUT_KEY = "morseOutput"; // Hasil morse generator
const MORSE_TRANSLATE_INPUT_KEY = "morseTranslateInput"; // Input morse ke teks penerjemah
const MORSE_TRANSLATE_OUTPUT_KEY = "morseTranslateOutput"; // Hasil morse ke teks penerjemah

// --- PETA SUBTITUSI TETAP UNTUK KONSISTENSI (TEKS ANEH) ---
const ENCRYPTION_MAP = {};
const DECRYPTION_MAP = {};
const alphabet = "abcdefghijklmnopqrstuvwxyz";

for (let i = 0; i < alphabet.length; i++) {
  const originalChar = alphabet[i];
  const encryptedChar = alphabet[alphabet.length - 1 - i];
  ENCRYPTION_MAP[originalChar] = encryptedChar;
  DECRYPTION_MAP[encryptedChar] = originalChar;
}

// --- PETA KODE MORSE (STANDAR INTERNAL) ---
// Ini adalah peta standar untuk konversi internal.
// Titik akan diganti dengan '・' hanya untuk TAMPILAN di UI.
const MORSE_CODE_STANDARD_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
  'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
  'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

// --- REVERSE MORSE MAP (untuk dekode dari standar internal) ---
const REVERSE_MORSE_CODE_MAP = {};
for (const char in MORSE_CODE_STANDARD_MAP) {
    if (MORSE_CODE_STANDARD_MAP.hasOwnProperty(char)) {
        REVERSE_MORSE_CODE_MAP[MORSE_CODE_STANDARD_MAP[char]] = char;
    }
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

// Fungsi untuk mengonversi teks ke Kode Morse (output dengan visual ・)
function textToMorse(text) {
  // 1. Konversi ke Morse standar (dengan . dan -)
  const standardMorse = text.toUpperCase().split('').map(char => {
    if (char === ' ') {
      return '/'; // Spasi antar kata diwakili oleh single slash
    } else if (MORSE_CODE_STANDARD_MAP[char]) {
      return MORSE_CODE_STANDARD_MAP[char];
    } else {
      return ''; // Karakter tidak dikenali diabaikan
    }
  }).filter(Boolean).join(' '); // Gabungkan dengan spasi antar karakter morse

  // 2. Ganti titik standar dengan titik tengah besar untuk tampilan
  return standardMorse.replace(/\./g, '・');
}

// Fungsi untuk mengonversi Kode Morse (input dengan visual ・) ke teks
function morseToText(morseCode) {
    // 1. Normalisasi input: ganti titik tengah besar kembali ke titik standar
    const normalizedMorse = morseCode.replace(/・/g, '.').trim();

    // 2. Pisahkan berdasarkan spasi antar kata (single slash) dan spasi antar karakter morse
    const wordsMorse = normalizedMorse.split(' / '); // Split by word breaks (single slash)
    
    const decodedText = wordsMorse.map(wordMorse => {
        // Handle empty word segments (e.g., if there's " // " for more spaces)
        if (wordMorse.trim() === '') {
            return ''; 
        }
        // Split each word's morse into individual character morse codes
        const charsMorse = wordMorse.split(' ');
        
        return charsMorse.map(charMorse => {
            return REVERSE_MORSE_CODE_MAP[charMorse] || ''; // Decode character, or empty string if not found
        }).join(''); // Join characters to form a word
    }).join(' '); // Join words with space

    return decodedText.toLowerCase(); // Kembali ke huruf kecil sesuai kebiasaan
}


// Fungsi untuk memanggil Gemini API dan mendapatkan saran tema
async function getLLMSuggestion(promptText) {


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
    const apiKey = ""; // Canvas akan menyediakan API key secara otomatis
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

      console.error("Gemini API response structure unexpected:", result);
    }
  
  } finally {
    llmLoadingIndicator.classList.add("hidden");
  }
}

// Dapatkan elemen-elemen DOM utama
const tabTextGenerator = document.getElementById("tabTextGenerator");
const tabQrGenerator = document.getElementById("tabQrGenerator");
const tabMorseGenerator = document.getElementById("tabMorseGenerator"); // Tab Morse baru

const textGeneratorSection = document.getElementById("textGeneratorSection");
const qrCodeGeneratorSection = document.getElementById("qrCodeGeneratorSection");
const morseCodeGeneratorSection = document.getElementById("morseCodeGeneratorSection"); // Bagian Morse baru

// Elemen untuk Teks Aneh Generator
const originalTextInput = document.getElementById("originalText");
const generateBtn = document.getElementById("generateBtn");
const resultTextInput = document.getElementById("resultText");
const copyBtn = document.getElementById("copyBtn");
const copyMessage = document.getElementById("copyMessage");
const llmSuggestionContainer = document.getElementById("llmSuggestionContainer");
const llmSuggestionText = document.getElementById("llmSuggestionText");
const llmLoadingIndicator = document.getElementById("llmLoadingIndicator");

// Elemen untuk QR Code Generator
const qrInput = document.getElementById("qrInput");
const generateQrBtn = document.getElementById("generateQrBtn");
const qrImg = document.getElementById("qrImg");
const qrCodeDisplay = document.getElementById("qrCodeDisplay");
const downloadQrBtn = document.getElementById("downloadQrBtn"); // Tombol download QR
let preQrValue = ""; // Untuk mencegah generate QR yang sama berulang

// Elemen untuk Kode Morse Generator
const morseTextInput = document.getElementById("morseTextInput"); // Input teks untuk Morse (konversi ke morse)
const generateMorseBtn = document.getElementById("generateMorseBtn"); // Tombol Konversi ke Morse
const morseOutput = document.getElementById("morseOutput"); // Output Kode Morse
const copyMorseBtn = document.getElementById("copyMorseBtn"); // Tombol Salin Kode Morse
const copyMorseMessage = document.getElementById("copyMorseMessage"); // Pesan salin Morse

// Elemen untuk Kode Morse Penerjemah
const morseTranslateInput = document.getElementById("morseTranslateInput"); // Input morse untuk penerjemah
const translateMorseBtn = document.getElementById("translateMorseBtn"); // Tombol Terjemahkan Morse
const morseTranslateOutput = document.getElementById("morseTranslateOutput"); // Output teks dari penerjemah

// Tombol Bersihkan Semua
const clearAllBtn = document.getElementById("clearAllBtn");

// Fungsi untuk mengganti tab yang aktif
function showTab(tabId) {
  // Sembunyikan semua section
  textGeneratorSection.classList.add("hidden");
  qrCodeGeneratorSection.classList.add("hidden");
  morseCodeGeneratorSection.classList.add("hidden"); // Sembunyikan section Morse
  
  // Reset warna semua tab button
  tabTextGenerator.classList.remove("bg-indigo-500", "text-white");
  tabTextGenerator.classList.add("bg-gray-200", "text-gray-700");
  tabQrGenerator.classList.remove("bg-indigo-500", "text-white");
  tabQrGenerator.classList.add("bg-gray-200", "text-gray-700");
  tabMorseGenerator.classList.remove("bg-indigo-500", "text-white"); // Reset warna tab Morse
  tabMorseGenerator.classList.add("bg-gray-200", "text-gray-700");

  // Tampilkan section yang dipilih dan atur warna tab button
  if (tabId === "textGenerator") {
    textGeneratorSection.classList.remove("hidden");
    tabTextGenerator.classList.add("bg-indigo-500", "text-white");
  } else if (tabId === "qrGenerator") {
    qrCodeGeneratorSection.classList.remove("hidden");
    tabQrGenerator.classList.add("bg-indigo-500", "text-white");
  } else if (tabId === "morseGenerator") { // Logika untuk tab Morse
    morseCodeGeneratorSection.classList.remove("hidden");
    tabMorseGenerator.classList.add("bg-indigo-500", "text-white");
  }
}

// Event listeners untuk tombol tab
tabTextGenerator.addEventListener("click", () => showTab("textGenerator"));
tabQrGenerator.addEventListener("click", () => showTab("qrGenerator"));
tabMorseGenerator.addEventListener("click", () => showTab("morseGenerator")); // Listener tab Morse

// Event listener untuk 'Buat Teks Aneh' button
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
  llmSuggestionContainer.classList.add("hidden");

  await getLLMSuggestion(originalText);
});

// Event listener untuk 'Salin' (Teks Aneh) button
copyBtn.addEventListener("click", () => {
  resultTextInput.select();
  document.execCommand("copy");
  copyMessage.classList.remove("hidden");
  setTimeout(() => {
    copyMessage.classList.add("hidden");
  }, 2000);
});

// Event listener untuk QR code generation
generateQrBtn.addEventListener("click", () => {
  let qrValue = qrInput.value.trim();
  if (!qrValue || preQrValue === qrValue) return;
  preQrValue = qrValue;
  generateQrBtn.innerText = "Membuat Kode QR...";
  
  // Sembunyikan tombol download saat generate QR baru
  downloadQrBtn.classList.add("hidden"); 

  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrValue}`;
  qrImg.onload = () => {
    qrCodeDisplay.classList.add("active"); // Menampilkan display QR
    generateQrBtn.innerText = "Buat Kode QR";
    localStorage.setItem(QR_CODE_VALUE_KEY, qrValue);
    downloadQrBtn.classList.remove("hidden"); // Tampilkan tombol download setelah QR muncul
  };
  qrImg.onerror = () => {
    generateQrBtn.innerText = "Gagal Membuat QR";
    console.error("Failed to load QR code image.");
    downloadQrBtn.classList.add("hidden"); // Pastikan tersembunyi jika gagal
  };
});

qrInput.addEventListener("keyup", () => {
  if (!qrInput.value.trim()) {
    qrCodeDisplay.classList.remove("active");
    preQrValue = "";
    downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download jika input kosong
  }
});

// Event listener untuk tombol Download QR
downloadQrBtn.addEventListener("click", () => {
  const imageUrl = qrImg.src;
  if (imageUrl) {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `qrcode_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
});

// Event listener untuk tombol 'Konversi ke Kode Morse'
generateMorseBtn.addEventListener("click", () => {
  const text = morseTextInput.value.trim();
  if (!text) {
    morseOutput.value = "Masukkan teks untuk dikonversi!";
    return;
  }
  const morse = textToMorse(text); // Menggunakan fungsi textToMorse yang sudah diubah
  morseOutput.value = morse;
  localStorage.setItem(MORSE_OUTPUT_KEY, morse); // Simpan hasil morse
  localStorage.setItem(MORSE_TEXT_TO_MORSE_KEY, text); // Simpan input teks asli
  copyMorseMessage.classList.add("hidden");
});

// Event listener untuk tombol 'Salin' (Kode Morse)
copyMorseBtn.addEventListener("click", () => {
  morseOutput.select();
  document.execCommand("copy");
  copyMorseMessage.classList.remove("hidden");
  setTimeout(() => {
    copyMorseMessage.classList.add("hidden");
  }, 2000);
});

// Event listener untuk tombol 'Terjemahkan Kode Morse'
translateMorseBtn.addEventListener("click", () => {
  const morseCode = morseTranslateInput.value.trim();
  if (!morseCode) {
    morseTranslateOutput.value = "Masukkan Kode Morse untuk diterjemahkan!";
    return;
  }
  const decodedText = morseToText(morseCode); // Menggunakan fungsi morseToText yang baru
  morseTranslateOutput.value = decodedText;
  localStorage.setItem(MORSE_TRANSLATE_INPUT_KEY, morseCode); // Simpan input morse
  localStorage.setItem(MORSE_TRANSLATE_OUTPUT_KEY, decodedText); // Simpan hasil terjemahan
});


// Event listener untuk 'Bersihkan Semua' button
clearAllBtn.addEventListener("click", () => {
  // Bersihkan Teks Aneh Generator
  originalTextInput.value = "";
  resultTextInput.value = "";
  llmSuggestionText.textContent = "";
  llmSuggestionContainer.classList.add("hidden");
  copyMessage.classList.add("hidden");
  localStorage.removeItem(GARBLED_TEXT_KEY);
  originalTextInput.placeholder = "Masukkan teks asli Anda di sini...";
  resultTextInput.placeholder = "Tulisan aneh akan muncul di sini...";

  // Bersihkan QR Code Generator
  qrInput.value = "";
  qrImg.src = "";
  qrCodeDisplay.classList.remove("active"); // Sembunyikan display QR
  localStorage.removeItem(QR_CODE_VALUE_KEY);
  generateQrBtn.innerText = "Buat Kode QR";
  downloadQrBtn.classList.add("hidden"); // Sembunyikan tombol download

  // Bersihkan Kode Morse Generator
  morseTextInput.value = "";
  morseOutput.value = "";
  copyMorseMessage.classList.add("hidden");
  localStorage.removeItem(MORSE_TEXT_TO_MORSE_KEY); // Hapus input teks morse
  localStorage.removeItem(MORSE_OUTPUT_KEY); // Hapus hasil morse

  // Bersihkan Kode Morse Penerjemah
  morseTranslateInput.value = "";
  morseTranslateOutput.value = "";
  localStorage.removeItem(MORSE_TRANSLATE_INPUT_KEY);
  localStorage.removeItem(MORSE_TRANSLATE_OUTPUT_KEY);
  morseTranslateInput.placeholder = "Tempel atau ketik Kode Morse di sini";
  morseTranslateOutput.placeholder = "Teks asli akan muncul di sini...";


  // Set default text for Text Generator
  originalTextInput.value = "";
  showTab("textGenerator"); // Tampilkan tab teks aneh secara default setelah clear
});

// Muat data dari localStorage saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  const savedGarbledText = localStorage.getItem(GARBLED_TEXT_KEY);
  const savedQrCodeValue = localStorage.getItem(QR_CODE_VALUE_KEY);
  const savedMorseTextToMorse = localStorage.getItem(MORSE_TEXT_TO_MORSE_KEY);
  const savedMorseOutput = localStorage.getItem(MORSE_OUTPUT_KEY);
  const savedMorseTranslateInput = localStorage.getItem(MORSE_TRANSLATE_INPUT_KEY);
  const savedMorseTranslateOutput = localStorage.getItem(MORSE_TRANSLATE_OUTPUT_KEY);

  if (savedGarbledText) {
    resultTextInput.value = savedGarbledText;
    originalTextInput.value = translateGarbledText(savedGarbledText); 
  } else {
    originalTextInput.value = "Ini adalah pesan rahasia yang ingin saya acak!";
  }

  if (savedQrCodeValue) {
    qrInput.value = savedQrCodeValue;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${savedQrCodeValue}`;
    qrCodeDisplay.classList.add("active");
    downloadQrBtn.classList.remove("hidden");
  } else {
    qrImg.src = "";
    qrCodeDisplay.classList.remove("active");
    downloadQrBtn.classList.add("hidden");
  }

  // Muat data untuk Generator Kode Morse
  if (savedMorseTextToMorse) {
    morseTextInput.value = savedMorseTextToMorse;
  }
  if (savedMorseOutput) {
    morseOutput.value = savedMorseOutput;
  }

  // Muat data untuk Penerjemah Kode Morse
  if (savedMorseTranslateInput) {
    morseTranslateInput.value = savedMorseTranslateInput;
  }
  if (savedMorseTranslateOutput) {
    morseTranslateOutput.value = savedMorseTranslateOutput;
  }

  showTab("textGenerator"); // Tampilkan tab teks aneh secara default saat load
});

