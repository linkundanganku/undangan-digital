// Inisialisasi PocketBase (Ganti URL di bawah dengan URL server PocketBase Anda, misal Railway/Fly.io)
const pb = new PocketBase("https://rsosr.alwaysdata.net");

// Ambil parameter ?to= dari URL untuk fitur Custom Nama Tamu
const urlParams = new URLSearchParams(window.location.search);
const guestParam = urlParams.get("to");
if (guestParam) {
  document.getElementById("guest-name").innerText =
    decodeURIComponent(guestParam);
}

// Fungsi membuka undangan & memutar musik (jika ada)
function openInvitation() {
  const cover = document.getElementById("cover");
  const mainContent = document.getElementById("main-content");

  cover.style.opacity = "0";
  setTimeout(() => {
    cover.classList.add("hidden");
    mainContent.classList.remove("hidden");
    loadEventData();
    loadWishesAndRsvp();
  }, 500);
}

// Fungsi mengambil data utama acara berdasarkan slug (misal: /?slug=budi-siti)
async function loadEventData() {
  try {
    // Contoh mengambil record pertama dari collection 'events'
    const records = await pb.collection("events").getList(1, 1, {
      sort: "-created",
    });

    if (records.items.length > 0) {
      const ev = records.items[0];
      document.getElementById("cover-title").innerText = ev.title;
      document.getElementById("main-couple-title").innerText = ev.title;
      document.getElementById("main-date").innerText = new Date(
        ev.event_date,
      ).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      document.getElementById("location-name").innerText = ev.location_name;
      document.getElementById("location-address").innerText =
        ev.location_address;
      if (ev.location_map_url) {
        document.getElementById("gmap-link.href").href = ev.location_map_url;
      }
    }
  } catch (error) {
    console.error("Gagal memuat data event:", error);
  }
}

// Fungsi Mengirim RSVP & Ucapan
async function submitRsvp(event) {
  event.preventDefault();

  const name = document.getElementById("rsvp-name").value;
  const attendance = document.getElementById("rsvp-attendance").value;
  const pax = parseInt(document.getElementById("rsvp-pax").value);
  const message = document.getElementById("rsvp-message").value;

  try {
    // Simpan ke collection 'rsvps'
    await pb.collection("rsvps").create({
      guest_name: name,
      attendance: attendance,
      pax: pax,
      message: message,
    });

    // Simpan juga ke collection 'wishes' agar tampil di buku tamu
    await pb.collection("wishes").create({
      name: name,
      comment: message,
    });

    alert(
      "Terima kasih! Ucapan dan konfirmasi kehadiran Anda berhasil dikirim.",
    );
    document.getElementById("rsvp-form").reset();
    loadWishesAndRsvp(); // Refresh list ucapan
  } catch (error) {
    alert("Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
    console.error(error);
  }
}

// Fungsi Load Ucapan & Realtime Listener
async function loadWishesAndRsvp() {
  const wishesList = document.getElementById("wishes-list");

  try {
    const records = await pb.collection("wishes").getList(1, 20, {
      sort: "-created",
    });

    wishesList.innerHTML = "";
    records.items.forEach((item) => {
      wishesList.innerHTML += `
                <div class="bg-white p-4 rounded-xl border border-stone-200 text-sm shadow-xs">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold text-stone-800">${escapeHtml(item.name)}</span>
                        <span class="text-xs text-stone-400">${new Date(item.created).toLocaleDateString("id-ID")}</span>
                    </div>
                    <p class="text-stone-600 text-xs">${escapeHtml(item.comment)}</p>
                </div>
            `;
    });

    // Realtime Subscription agar ucapan langsung muncul tanpa refresh halaman
    pb.collection("wishes").subscribe("*", function (e) {
      if (e.action === "create") {
        const newItem = e.record;
        wishesList.insertAdjacentHTML(
          "afterbegin",
          `
                    <div class="bg-white p-4 rounded-xl border border-stone-200 text-sm shadow-xs animate-pulse">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-semibold text-stone-800">${escapeHtml(newItem.name)}</span>
                            <span class="text-xs text-stone-400">Baru saja</span>
                        </div>
                        <p class="text-stone-600 text-xs">${escapeHtml(newItem.comment)}</p>
                    </div>
                `,
        );
      }
    });
  } catch (error) {
    console.error("Gagal memuat ucapan:", error);
  }
}

// Helper XSS Prevention
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Helper Salin Teks (untuk Rekening)
function copyText(text) {
  navigator.clipboard.writeText(text);
  alert("Nomor rekening berhasil disalin: " + text);
}
