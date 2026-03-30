// ========== CONFIG ==========
const BASE_URL = window.location.origin;

// ========== AUTH CHECK ==========
const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user) {
  window.location.href = "login.html";
}

document.getElementById("userInfo").innerText = user.email + " (" + user.role + ")";

let selectedResource = "";

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

// ========== OPEN BOOKING PANEL ==========
function openBooking(resource) {
  if (user.role === "admin") {
    alert("Admin is not allowed to book resources");
    return;
  }
  selectedResource = resource;
  document.getElementById("bookingPanel").style.display = "block";
  document.getElementById("resourceTitle").innerText    = "Book " + resource;
  document.getElementById("msg").innerText              = "";
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

  const booking = {
    resource: selectedResource,
    date,
    time,
    status: "Pending",
    user: user.email
  };

  fetch(`${BASE_URL}/insert_booking.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking)
  })
  .then(res => res.json())
  .then(data => {
    msg.style.color = "green";
    msg.innerText   = data.message;
    loadHistory();
  })
  .catch(() => {
    msg.style.color = "red";
    msg.innerText   = "Error saving booking";
  });
}

// ========== LOAD HISTORY ==========
function loadHistory() {
  fetch(`${BASE_URL}/get_bookings.php`)
  .then(res => res.json())
  .then(data => {
    renderTable(data);
  })
  .catch(() => {
    console.error("Failed to load bookings");
  });
}

// ========== RENDER TABLE ==========
function renderTable(bookings) {
  const tbody = document.getElementById("history");
  tbody.innerHTML = "";

  if (user.role === "admin") {
    bookings.forEach((b) => {
      tbody.innerHTML += `
        <tr>
          <td>${b.resource}</td>
          <td>${b.date}</td>
          <td>${b.time}</td>
          <td>${b.user_email}</td>
          <td style="color:${b.status === 'Approved' ? 'green' : b.status === 'Rejected' ? 'red' : 'orange'}">${b.status}</td>
          <td>
            ${b.status === "Pending" ? `
              <button onclick="approveBooking(${b.id})">Approve</button>
              <button onclick="rejectBooking(${b.id})">Reject</button>
            ` : "-"}
          </td>
        </tr>
      `;
    });
  } else {
    bookings
      .filter(b => b.user_email === user.email)
      .forEach((b) => {
        tbody.innerHTML += `
          <tr>
            <td>${b.resource}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td>${b.user_email}</td>
            <td style="color:${b.status === 'Approved' ? 'green' : b.status === 'Rejected' ? 'red' : 'orange'}">${b.status}</td>
            <td>
              ${b.status === "Pending" ? `<button onclick="deleteBooking(${b.id})">Delete</button>` : "-"}
            </td>
          </tr>
        `;
      });
  }
}

// ========== APPROVE / REJECT ==========
function approveBooking(id) { updateStatus(id, "Approved"); }
function rejectBooking(id)  { updateStatus(id, "Rejected"); }

function updateStatus(id, status) {
  fetch(`${BASE_URL}/update_booking.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status })
  }).then(() => loadHistory());
}

// ========== DELETE BOOKING ==========
function deleteBooking(id) {
  fetch(`${BASE_URL}/delete-booking.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  }).then(() => loadHistory());
}

// ========== INIT ==========
loadHistory();