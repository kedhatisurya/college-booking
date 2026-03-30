const BASE_URL = window.location.origin;

// Auth check
const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user) window.location.href = "login.html";

document.getElementById("userInfo").innerText = user.email + " (" + user.role + ")";

// Show admin filters
if (user.role === "admin") {
  document.getElementById("adminFilters").style.display  = "flex";
  document.getElementById("conflictLegend").style.display = "flex";
  document.getElementById("historyTitle").innerText = "All Booking Requests";
}

let allBookings      = [];
let selectedResource = "";

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

// ========== OPEN BOOKING ==========
function openBooking(resource) {
  if (user.role === "admin") {
    alert("Admin cannot book resources.");
    return;
  }
  selectedResource = resource;
  document.getElementById("bookingPanel").style.display = "block";
  document.getElementById("resourceTitle").innerText    = "Book " + resource;
  document.getElementById("msg").innerText              = "";
  // Set min date to today
  document.getElementById("date").min = new Date().toISOString().split("T")[0];
}

// ========== CONFIRM BOOKING ==========
function confirmBooking() {
  const date  = document.getElementById("date").value;
  const time  = document.getElementById("time").value;
  const msg   = document.getElementById("msg");
  const today = new Date().toISOString().split("T")[0];

  if (!date || !time) {
    msg.style.color = "red";
    msg.innerText   = "Please select date and time";
    return;
  }
  if (date < today) {
    msg.style.color = "red";
    msg.innerText   = "You cannot book for past dates";
    return;
  }

  fetch(`${BASE_URL}/insert_booking.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ resource: selectedResource, date, time, status: "Pending", user: user.email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message === "Booking request submitted successfully!") {
      msg.style.color = "green";
    } else {
      msg.style.color = "red";
    }
    msg.innerText = data.message;
    loadHistory();
  })
  .catch(() => {
    msg.style.color = "red";
    msg.innerText   = "Error saving booking. Try again.";
  });
}

// ========== LOAD HISTORY ==========
function loadHistory() {
  fetch(`${BASE_URL}/get_bookings.php`)
  .then(res => res.json())
  .then(data => {
    allBookings = data;
    filterTable();
  });
}

// ========== FILTER TABLE (admin) ==========
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

  if (resFilter)    filtered = filtered.filter(b => b.resource === resFilter);
  if (statusFilter) filtered = filtered.filter(b => b.status   === statusFilter);

  // Find conflicting slot IDs
  const conflictIds = getConflictIds(allBookings);

  if (conflictFilter === "conflict") {
    filtered = filtered.filter(b => conflictIds.has(String(b.id)));
  }

  // Sort: pending first, then by created_at
  filtered.sort((a, b) => {
    if (a.status === "Pending" && b.status !== "Pending") return -1;
    if (a.status !== "Pending" && b.status === "Pending") return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  renderTable(filtered, conflictIds);
}

// ========== DETECT CONFLICTS ==========
function getConflictIds(bookings) {
  const slotMap  = {};
  const conflicts = new Set();

  bookings.forEach(b => {
    if (b.status === "Rejected") return;
    const key = `${b.resource}|${b.date}|${b.time}`;
    if (!slotMap[key]) slotMap[key] = [];
    slotMap[key].push(String(b.id));
  });

  Object.values(slotMap).forEach(ids => {
    if (ids.length > 1) ids.forEach(id => conflicts.add(id));
  });

  return conflicts;
}

// ========== RENDER TABLE ==========
function renderTable(bookings, conflictIds = new Set()) {
  const tbody = document.getElementById("history");
  tbody.innerHTML = "";

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#999;padding:20px">No bookings found</td></tr>`;
    return;
  }

  if (user.role === "admin") {
    bookings.forEach(b => {
      const isConflict = conflictIds.has(String(b.id));
      const conflictBadge = isConflict ? `<span class="conflict-badge">⚠ CONFLICT</span>` : "";
      const rowClass = isConflict ? "conflict-row" : "";

      tbody.innerHTML += `
        <tr class="${rowClass}">
          <td>${b.resource}</td>
          <td>${b.date}</td>
          <td>${formatTime(b.time)}</td>
          <td>${b.user_email} ${conflictBadge}</td>
          <td style="color:${statusColor(b.status)};font-weight:bold">${b.status}</td>
          <td>
            ${b.status === "Pending" ? `
              <button class="btn-approve" onclick="approveBooking(${b.id})">✔ Approve</button>
              <button class="btn-reject"  onclick="rejectBooking(${b.id})">✘ Reject</button>
            ` : "-"}
          </td>
        </tr>
      `;
    });
  } else {
    bookings.forEach(b => {
      tbody.innerHTML += `
        <tr>
          <td>${b.resource}</td>
          <td>${b.date}</td>
          <td>${formatTime(b.time)}</td>
          <td>${b.user_email}</td>
          <td style="color:${statusColor(b.status)};font-weight:bold">${b.status}</td>
          <td>
            ${b.status === "Pending" ? `<button class="btn-delete" onclick="deleteBooking(${b.id})">Cancel</button>` : "-"}
          </td>
        </tr>
      `;
    });
  }
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

// ========== APPROVE / REJECT / DELETE ==========
function approveBooking(id) {
  const booking = allBookings.find(b => b.id == id);
  if (!booking) return;

  updateStatus(id, "Approved").then(() => {
    allBookings.forEach(b => {
      if (b.id != id &&
          b.resource === booking.resource &&
          b.date === booking.date &&
          b.time === booking.time &&
          b.status === "Pending") {
        updateStatus(b.id, "Rejected");
      }
    });
    loadHistory();
  });
}

function rejectBooking(id) {
  updateStatus(id, "Rejected").then(() => loadHistory());
}

function updateStatus(id, status) {
  return fetch(`${BASE_URL}/update_booking.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id, status })
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

// ========== INIT ==========
loadHistory();