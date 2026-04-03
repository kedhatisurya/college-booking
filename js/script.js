const BASE_URL = window.location.origin;

const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user) window.location.href = "/login";

document.getElementById("userInfo").innerText = user.email + " (" + user.role + ")";

if (user.role === "admin") {
  document.getElementById("adminFilters").style.display   = "flex";
  document.getElementById("conflictLegend").style.display = "flex";
  document.getElementById("historyTitle").innerText = "All Booking Requests";
}

let allBookings      = [];
let selectedResource = "";

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "/login";
}

// ========== OPEN BOOKING ==========
function openBooking(resource) {
  if (user.role === "admin") { alert("Admin cannot book resources."); return; }
  selectedResource = resource;
  document.getElementById("bookingPanel").style.display = "block";
  document.getElementById("resourceTitle").innerText    = "Book " + resource;
  document.getElementById("msg").innerText              = "";
  document.getElementById("date").min = new Date().toISOString().split("T")[0];
}

// ========== CONFIRM BOOKING ==========
function confirmBooking() {
  const date  = document.getElementById("date").value;
  const time  = document.getElementById("time").value;
  const msg   = document.getElementById("msg");
  const today = new Date().toISOString().split("T")[0];

  if (!date || !time) {
    msg.style.color = "red"; msg.innerText = "Please select date and time"; return;
  }
  if (date < today) {
    msg.style.color = "red"; msg.innerText = "You cannot book for past dates"; return;
  }

  fetch(`${BASE_URL}/insert_booking.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ resource: selectedResource, date, time, user: user.email })
  })
  .then(res => res.json())
  .then(data => {
    msg.style.color = data.message === "Booking request submitted successfully!" ? "green" : "red";
    msg.innerText   = data.message;
    loadHistory();
  })
  .catch(() => { msg.style.color = "red"; msg.innerText = "Error saving booking. Try again."; });
}

// ========== LOAD HISTORY ==========
function loadHistory() {
  fetch(`${BASE_URL}/get_bookings.php`)
  .then(res => res.json())
  .then(data => { allBookings = data; filterTable(); });
}

// ========== FILTER TABLE ==========
function filterTable() {
  let filtered = [...allBookings];

  if (user.role !== "admin") {
    filtered = filtered.filter(b => b.user_email === user.email);
    renderTable(filtered);
    return;
  }

  const resFilter      = document.getElementById("filterResource")?.value || "";
  const statusFilter   = document.getElementById("filterStatus")?.value   || "";
  const conflictFilter = document.getElementById("filterConflict")?.value || "";

  if (resFilter)                  filtered = filtered.filter(b => b.resource === resFilter);
  if (statusFilter)               filtered = filtered.filter(b => b.status   === statusFilter);
  if (conflictFilter === "conflict") filtered = filtered.filter(b => b.is_conflict == 1);

  renderTable(filtered);
}

// ========== RENDER TABLE ==========
function renderTable(bookings) {
  const tbody  = document.getElementById("history");
  const header = document.getElementById("tableHeader");
  tbody.innerHTML = "";

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#999;padding:20px">No bookings found</td></tr>`;
    return;
  }

  if (user.role === "admin") {
    // Admin header: Resource | Date | Time | User | Status | Action
    header.innerHTML = `
      <th>Resource</th><th>Date</th><th>Time</th>
      <th>User</th><th>Status</th><th>Action</th>
    `;
    bookings.forEach(b => {
      const isConflict  = b.is_conflict == 1;
      const rowClass    = isConflict ? "conflict-row" : "";
      const badge       = isConflict ? `<span class="conflict-badge">⚠ CONFLICT</span>` : "";
      tbody.innerHTML += `
        <tr class="${rowClass}">
          <td>${b.resource}</td>
          <td>${b.date}</td>
          <td>${formatTime(b.time)}</td>
          <td>${b.user_email} ${badge}</td>
          <td style="color:${statusColor(b.status)};font-weight:bold">${b.status}</td>
          <td>
            ${b.status === "Pending" ? `
              <button class="btn-approve" onclick="approveBooking(${b.id})">✔ Approve</button>
              <button class="btn-reject"  onclick="rejectBooking(${b.id})">✘ Reject</button>
            ` : "-"}
          </td>
        </tr>`;
    });
  } else {
    // User header: Resource | Date | Time | Status (no User, no Action)
    header.innerHTML = `
      <th>Resource</th><th>Date</th><th>Time</th><th>Status</th>
    `;
    bookings.forEach(b => {
      tbody.innerHTML += `
        <tr>
          <td>${b.resource}</td>
          <td>${b.date}</td>
          <td>${formatTime(b.time)}</td>
          <td style="color:${statusColor(b.status)};font-weight:bold">${b.status}</td>
        </tr>`;
    });
  }
}

// ========== APPROVE ==========
function approveBooking(id) {
  const booking = allBookings.find(b => b.id == id);
  if (!booking) return;

  updateStatus(id, "Approved").then(() => {
    // Auto-reject all other pending bookings for same slot
    const others = allBookings.filter(b =>
      b.id != id &&
      b.resource === booking.resource &&
      b.date     === booking.date &&
      b.time     === booking.time &&
      b.status   === "Pending"
    );
    Promise.all(others.map(b => updateStatus(b.id, "Rejected")))
      .then(() => loadHistory());
  });
}

function rejectBooking(id) {
  updateStatus(id, "Rejected").then(() => {
    // If no more conflicts for that slot, clear is_conflict on remaining pending
    const booking = allBookings.find(b => b.id == id);
    if (booking) {
      const remaining = allBookings.filter(b =>
        b.id != id &&
        b.resource === booking.resource &&
        b.date     === booking.date &&
        b.time     === booking.time &&
        b.status   === "Pending"
      );
      if (remaining.length === 1) {
        // Only one left — no longer a conflict
        clearConflict(remaining[0].id);
      }
    }
    loadHistory();
  });
}

function updateStatus(id, status) {
  return fetch(`${BASE_URL}/update_booking.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id, status })
  });
}

function clearConflict(id) {
  fetch(`${BASE_URL}/update_booking.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id, clear_conflict: true })
  });
}

function deleteBooking(id) {
  if (!confirm("Cancel this booking request?")) return;
  fetch(`${BASE_URL}/delete-booking.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id })
  }).then(() => loadHistory());
}

// ========== HELPERS ==========
function formatTime(time) {
  const map = {
    "8-9":"8:00-9:00","9-10":"9:00-10:00","10-11":"10:00-11:00",
    "11-12":"11:00-12:00","12-13":"12:00-1:00","13-14":"1:00-2:00",
    "14-15":"2:00-3:00","15-16":"3:00-4:00","16-17":"4:00-5:00"
  };
  return map[time] || time;
}

function statusColor(status) {
  if (status === "Approved") return "green";
  if (status === "Rejected") return "red";
  return "orange";
}

loadHistory();