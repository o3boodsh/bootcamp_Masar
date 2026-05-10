const API_URL = "https://bootcamp-masar-4.onrender.com";

// ── Submit Form (CREATE) ──
document.querySelector(".btn-add").addEventListener("click", async () => {
  const pointName = document.getElementById("pointName").value.trim();
  const type = document.getElementById("type").value;
  const area = document.getElementById("area").value;
  const organization = document.getElementById("organization").value;
  const address = document.getElementById("address").value.trim();
  const status = document.getElementById("status").value;

  if (!pointName || !address) {
    showToast("يرجى تعبئة حقل الاسم والعنوان.", "error");
    return;
  }

  const payload = { point_name: pointName, type, area, organization, address, status };

  const btn = document.querySelector(".btn-add");
  setButtonLoading(btn, true);

  try {
    const res = await apiFetch("/api/distribution-points", "POST", payload);
    showToast(`✓ تمت الإضافة: "${res.point_name}"`, "success");
    clearForm();
    loadPoints();
  } catch (e) {
    showToast(`خطأ: ${e.message}`, "error");
  } finally {
    setButtonLoading(btn, false);
  }
});

// ── Load All Points (READ ALL) ──
async function loadPoints() {
  try {
    const data = await apiFetch("/api/distribution-points", "GET");
    let points = [];
    if (Array.isArray(data)) {
      points = data.filter(Boolean);
    } else if (data && typeof data === "object") {
      points = Object.values(data).filter(Boolean);
    }
    points.sort((a, b) => a.id - b.id);
    renderPoints(points);
  } catch (e) {
    console.error("Failed to load points:", e);
  }
}

// ── Delete Point (DELETE) ──
async function deletePoint(id) {
  if (!confirm("هل أنت متأكد من حذف هذه النقطة؟")) return;
  try {
    await apiFetch(`/api/distribution-points/${id}`, "DELETE");
    showToast("تم الحذف بنجاح.", "success");
    loadPoints();
  } catch (e) {
    showToast("فشل الحذف.", "error");
  }
}

// ── Edit Point (UPDATE via PATCH) ──
function openEditModal(point) {
  document.getElementById("edit-modal")?.remove();

  const modal = document.createElement("div");
  modal.id = "edit-modal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.45);
    display:flex;align-items:center;justify-content:center;padding:16px;
  `;

  modal.innerHTML = `
    <div style="
      background:#fff;border-radius:14px;padding:32px 36px;width:100%;max-width:440px;
      border:2px solid var(--teal);box-shadow:0 8px 40px rgba(0,0,0,0.18);
    ">
      <h2 style="font-family:'DM Serif Display',serif;font-size:1.3rem;color:var(--text-dark);margin-bottom:20px">
        تعديل النقطة
      </h2>

      <div class="field">
        <label>Point Name</label>
        <input type="text" id="edit-name" value="${point.point_name}" />
      </div>

      <div class="field">
        <label>Type</label>
        <div class="select-wrap">
          <select id="edit-type">
            ${["Food", "Medical", "Shelter", "Water", "Clothing"].map(o =>
    `<option ${point.type === o ? "selected" : ""}>${o}</option>`).join("")}
          </select>
          <span class="chevron"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
      </div>

      <div class="field">
        <label>Area</label>
        <div class="select-wrap">
          <select id="edit-area">
            ${["Rafah", "Gaza City", "Khan Yunis", "Deir al-Balah", "Jabalia"].map(o =>
      `<option ${point.area === o ? "selected" : ""}>${o}</option>`).join("")}
          </select>
          <span class="chevron"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
      </div>

      <div class="field">
        <label>Organization</label>
        <div class="select-wrap">
          <select id="edit-org">
            ${["Organization 1", "Organization 2", "Organization 3", "UNRWA", "WFP"].map(o =>
        `<option ${point.organization === o ? "selected" : ""}>${o}</option>`).join("")}
          </select>
          <span class="chevron"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
      </div>

      <div class="field">
        <label>Address</label>
        <input type="text" id="edit-address" value="${point.address}" />
      </div>

      <div class="field">
        <label>Status</label>
        <div class="select-wrap">
          <select id="edit-status">
            ${["Available", "Busy", "Closed", "Emergency"].map(o =>
          `<option ${point.status === o ? "selected" : ""}>${o}</option>`).join("")}
          </select>
          <span class="chevron"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:8px">
        <button id="save-edit-btn" style="
          flex:1;height:44px;background:var(--teal);color:#fff;border:none;
          border-radius:10px;font-weight:600;cursor:pointer;font-size:0.9rem;
        ">حفظ التعديلات</button>
        <button onclick="document.getElementById('edit-modal').remove()" style="
          flex:1;height:44px;background:#f0f2f5;color:var(--text-dark);border:none;
          border-radius:10px;font-weight:600;cursor:pointer;font-size:0.9rem;
        ">إلغاء</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById("save-edit-btn").addEventListener("click", async () => {
    const updates = {
      point_name: document.getElementById("edit-name").value.trim(),
      type: document.getElementById("edit-type").value,
      area: document.getElementById("edit-area").value,
      organization: document.getElementById("edit-org").value,
      address: document.getElementById("edit-address").value.trim(),
      status: document.getElementById("edit-status").value,
    };

    if (!updates.point_name || !updates.address) {
      showToast("الاسم والعنوان مطلوبان.", "error");
      return;
    }

    try {
      await apiFetch(`/api/distribution-points/${point.id}`, "PATCH", updates);
      showToast("✓ تم التعديل بنجاح.", "success");
      modal.remove();
      loadPoints();
    } catch (e) {
      showToast(`خطأ: ${e.message}`, "error");
    }
  });
}

// ── Render Points Table ──
function renderPoints(points) {
  document.getElementById("points-table-section")?.remove();
  if (!points || points.length === 0) return;

  const section = document.createElement("div");
  section.id = "points-table-section";
  section.style.cssText =
    "width:100%;max-width:900px;margin:0 auto 40px;background:#fff;border:2px solid var(--teal);border-radius:14px;overflow:hidden;box-shadow:var(--shadow)";

  section.innerHTML = `
    <div style="padding:20px 28px 14px;border-bottom:1px solid var(--border)">
      <h2 style="font-family:'DM Serif Display',serif;font-size:1.2rem;color:var(--text-dark)">
        Distribution Points (${points.length})
      </h2>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
        <thead>
          <tr style="background:var(--teal-light)">
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Name</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Type</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Area</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Organization</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Status</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${points.map(p => `
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:10px 16px;color:var(--text-dark);font-weight:500">${p.point_name}</td>
              <td style="padding:10px 16px;color:var(--text-mid)">${p.type}</td>
              <td style="padding:10px 16px;color:var(--text-mid)">${p.area}</td>
              <td style="padding:10px 16px;color:var(--text-mid)">${p.organization}</td>
              <td style="padding:10px 16px">
                <span style="
                  padding:3px 10px;border-radius:99px;font-size:0.75rem;font-weight:600;
                  background:${statusColor(p.status).bg};color:${statusColor(p.status).text}
                ">${p.status}</span>
              </td>
              <td style="padding:10px 16px">
                <div style="display:flex;gap:6px">
                  <button onclick='openEditModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' style="
                    background:none;border:1px solid var(--teal);color:var(--teal);
                    border-radius:6px;padding:4px 12px;cursor:pointer;font-size:0.75rem;font-weight:600
                  ">✏ Edit</button>
                  <button onclick="deletePoint('${p.id}')" style="
                    background:none;border:1px solid #e53e3e;color:#e53e3e;
                    border-radius:6px;padding:4px 12px;cursor:pointer;font-size:0.75rem;font-weight:600
                  ">🗑 Delete</button>
                </div>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.querySelector("footer").before(section);
}

// ── Shared fetch helper ──
async function apiFetch(path, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function statusColor(status) {
  const map = {
    Available: { bg: "#e6f4f5", text: "#1a6b74" },
    Busy: { bg: "#fff3cd", text: "#856404" },
    Closed: { bg: "#f8d7da", text: "#842029" },
    Emergency: { bg: "#fde8e8", text: "#c53030" },
  };
  return map[status] || { bg: "#eee", text: "#333" };
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.textContent = "جاري الإرسال...";
  } else {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      Add Point`;
  }
}

function clearForm() {
  document.getElementById("pointName").value = "";
  document.getElementById("address").value = "";
  ["type", "area", "organization", "status"].forEach(id => {
    document.getElementById(id).selectedIndex = 0;
  });
}

function showToast(message, type = "success") {
  document.getElementById("toast")?.remove();
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;bottom:28px;right:28px;z-index:9999;
    padding:14px 22px;border-radius:10px;font-size:0.875rem;font-weight:500;
    color:#fff;max-width:360px;line-height:1.4;
    background:${type === "success" ? "#1a6b74" : "#e53e3e"};
    box-shadow:0 4px 20px rgba(0,0,0,0.18);
    animation:slideIn 0.3s ease;
  `;
  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Init ──
loadPoints();