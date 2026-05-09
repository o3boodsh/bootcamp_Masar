const API_URL = "http://localhost:8000";

//  Submit Form 
document.querySelector(".btn-add").addEventListener("click", async () => {
    const pointName = document.getElementById("pointName").value.trim();
    const type = document.getElementById("type").value;
    const area = document.getElementById("area").value;
    const organization = document.getElementById("organization").value;
    const address = document.getElementById("address").value.trim();
    const status = document.getElementById("status").value;

    // Basic validation
    if (!pointName || !address) {
        showToast("Please fill in Point Name and Address.", "error");
        return;
    }

    const payload = {
        point_name: pointName,
        type,
        area,
        organization,
        address,
        status,
    };

    const btn = document.querySelector(".btn-add");
    btn.disabled = true;
    btn.textContent = "Sending...";

    try {
        const response = await fetch(`${API_URL}/api/distribution-points`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Server error");
        }

        const data = await response.json();
        showToast(`✓ Point "${data.point_name}" added successfully! (ID: ${data.id})`, "success");
        clearForm();
        loadPoints(); // Refresh the list
    } catch (error) {
        showToast(`Error: ${error.message}`, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      Add Point`;
    }
});

// ── Load Existing Points ──
async function loadPoints() {
    try {
        const response = await fetch(`${API_URL}/api/distribution-points`);
        const points = await response.json();
        renderPoints(points);
    } catch (error) {
        console.error("Failed to load points:", error);
    }
}

// ── Render Points Table ──
function renderPoints(points) {
    // Remove old table if exists
    const old = document.getElementById("points-table-section");
    if (old) old.remove();

    if (points.length === 0) return;

    const section = document.createElement("div");
    section.id = "points-table-section";
    section.style.cssText =
        "width:100%;max-width:800px;margin:0 auto 40px;background:#fff;border:2px solid var(--teal);border-radius:14px;overflow:hidden;box-shadow:var(--shadow)";

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
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">#</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Name</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Type</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Area</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Organization</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Status</th>
            <th style="padding:10px 16px;text-align:left;color:var(--teal);font-weight:600">Action</th>
          </tr>
        </thead>
        <tbody>
          ${points
            .map(
                (p) => `
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:10px 16px;color:var(--text-light)">${p.id}</td>
              <td style="padding:10px 16px;color:var(--text-dark);font-weight:500">${p.point_name}</td>
              <td style="padding:10px 16px;color:var(--text-mid)">${p.type}</td>
              <td style="padding:10px 16px;color:var(--text-mid)">${p.area}</td>
              <td style="padding:10px 16px;color:var(--text-mid)">${p.organization}</td>
              <td style="padding:10px 16px">
                <span style="
                  padding:3px 10px;border-radius:99px;font-size:0.75rem;font-weight:600;
                  background:${statusColor(p.status).bg};
                  color:${statusColor(p.status).text}
                ">${p.status}</span>
              </td>
              <td style="padding:10px 16px">
                <button onclick="deletePoint(${p.id})" style="
                  background:none;border:1px solid #e53e3e;color:#e53e3e;
                  border-radius:6px;padding:3px 10px;cursor:pointer;font-size:0.75rem;font-weight:600
                ">Delete</button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

    // Insert before footer
    document.querySelector("footer").before(section);
}

// ── Delete Point ──
async function deletePoint(id) {
    if (!confirm("Delete this point?")) return;
    try {
        await fetch(`${API_URL}/api/distribution-points/${id}`, { method: "DELETE" });
        showToast("Point deleted.", "success");
        loadPoints();
    } catch (e) {
        showToast("Failed to delete.", "error");
    }
}

// ── Helpers ──
function statusColor(status) {
    const map = {
        Available: { bg: "#e6f4f5", text: "#1a6b74" },
        Busy: { bg: "#fff3cd", text: "#856404" },
        Closed: { bg: "#f8d7da", text: "#842029" },
        Emergency: { bg: "#f8d7da", text: "#842029" },
    };
    return map[status] || { bg: "#eee", text: "#333" };
}

function clearForm() {
    document.getElementById("pointName").value = "";
    document.getElementById("address").value = "";
    document.getElementById("type").selectedIndex = 0;
    document.getElementById("area").selectedIndex = 0;
    document.getElementById("organization").selectedIndex = 0;
    document.getElementById("status").selectedIndex = 0;
}

function showToast(message, type = "success") {
    // Remove existing toast
    const old = document.getElementById("toast");
    if (old) old.remove();

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
        const style = document.createElement("style");
        style.id = "toast-style";
        style.textContent = `@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ── Init ──
loadPoints();