// ===== المتغيرات =====
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("password");
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const addBtn = document.getElementById("addBtn");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const dateInput = document.getElementById("date");
const cards = document.getElementById("cards");

const searchInput = document.getElementById("searchInput");

// ===== تسجيل الدخول =====
loginBtn.onclick = () => {
  if (passwordInput.value.trim() === "1234") {
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");
  } else {
    alert("كلمة السر غلط");
  }
};

// ===== البيانات =====
let clients = JSON.parse(localStorage.getItem("clients") || "[]");

function save() {
  localStorage.setItem("clients", JSON.stringify(clients));
}

function daysFrom(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

function statusClass(days) {
  if (days >= 30) return "danger";
  if (days >= 15) return "warn";
  if (days >= 7) return "info";
  return "";
}

function sortClientsByDays(list) {
  return list.sort((a, b) => daysFrom(b.date) - daysFrom(a.date));
}

function getAlerts(days, alertHandled) {
  const alerts = [];

  if (days >= 7 && !alertHandled[7])
    alerts.push({ msg: "⏰ مر 7 أيام! اكلم العميل", key: 7 });

  if (days >= 15 && !alertHandled[15])
    alerts.push({ msg: "⚠️ مر 15 يوم! متابعة العميل", key: 15 });

  if (days >= 30) {
    let multiples = Math.floor((days - 30) / 15) + 1;
    for (let m = 0; m <= multiples; m++) {
      let alertDay = 30 + m * 15;
      if (!alertHandled[alertDay]) {
        alerts.push({
          msg: `🔥 مر ${alertDay} يوم! متابعة العميل`,
          key: alertDay
        });
      }
    }
  }

  return alerts;
}

// ===== رسم الكروت =====
function render() {
  cards.innerHTML = "";

  const searchValue = searchInput.value.toLowerCase();

  let filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchValue) ||
    c.phone.includes(searchValue)
  );

  filteredClients = sortClientsByDays(filteredClients);

  filteredClients.forEach((c, i) => {
    const days = daysFrom(c.date);

    if (!c.alertHandled) c.alertHandled = {};

    const card = document.createElement("div");
    card.className = `card ${statusClass(days)}`;

    card.innerHTML = `
      <h3>${c.name}</h3>
      <p>📞 ${c.phone}</p>
      <p>⏱ منذ ${days} يوم</p>

      <div class="alerts"></div>

      <label class="upload-btn voice">
        🎤 رفع فويس
        <input type="file" accept="audio/*" hidden>
      </label>

      <label class="upload-btn call">
        📞🔥 رفع مكالمة
        <input type="file" accept="audio/*" hidden>
      </label>

      <audio controls src="${c.audio || ""}"></audio>

      <textarea placeholder="ملاحظات">${c.notes || ""}</textarea>

      <p>💰 إجمالي المدفوع: <span class="total">${c.totalPaid || 0}</span> جنيه</p>
      <input type="number" class="newAmount" placeholder="المبلغ الجديد">
      <button class="addAmountBtn">💵 إضافة المبلغ</button>

      <button class="doneBtn">✅ تم الدفع بالكامل</button>
    `;

    const alertsDiv = card.querySelector(".alerts");
    const alerts = getAlerts(days, c.alertHandled);

    alerts.forEach(a => {
      const alertBox = document.createElement("div");
      alertBox.className = "alert-box";
      alertBox.innerHTML = `
        <span>${a.msg}</span>
        <button class="alertDoneBtn">تم</button>
      `;

      alertBox.querySelector(".alertDoneBtn").onclick = () => {
        c.alertHandled[a.key] = true;
        save();
        render();
      };

      alertsDiv.appendChild(alertBox);
    });

    card.querySelector("textarea").oninput = (e) => {
      c.notes = e.target.value;
      save();
    };
// ===== رفع الملفات على Cloudinary =====
card.querySelectorAll("input[type=file]").forEach(inp => {
  inp.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "voice_upload");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dhfnrf9fg/auto/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();

      if (data.secure_url) {
        c.audio = data.secure_url;
        save();
        render();
      } else {
        alert("حصل خطأ في الرفع");
      }

    } catch (err) {
      alert("فشل الاتصال");
    }
  };
});


// ===== إضافة عميل =====
addBtn.onclick = () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const date = dateInput.value;

  if (!name || !phone || !date) return alert("املأ كل الحقول");

  clients.push({ name, phone, date });
  save();
  render();

  nameInput.value = "";
  phoneInput.value = "";
  dateInput.value = "";
};

// ===== السيرش لايف =====
searchInput.oninput = () => {
  render();
};

function updateStats() {
  const totalClients = clients.length;
  let clients7 = 0, clients15 = 0, clients30 = 0, clients30plus = 0, totalPaid = 0;

  clients.forEach(c => {
    const days = daysFrom(c.date);
    totalPaid += c.totalPaid || 0;

    if (days < 7) clients7++;
    else if (days < 15) clients15++;
    else if (days <= 30) clients30++;
    else clients30plus++;
  });

  document.getElementById("totalClients").innerText = totalClients;
  document.getElementById("clients7").innerText = clients7;
  document.getElementById("clients15").innerText = clients15;
  document.getElementById("clients30").innerText = clients30;
  document.getElementById("clients30plus").innerText = clients30plus;
  document.getElementById("totalPaid").innerText = totalPaid;
}

// ===== تشغيل =====
render();
