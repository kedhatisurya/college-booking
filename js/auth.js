// ========== CONFIG ==========
const BASE_URL = window.location.origin;
// 🔐 HARDCODED ADMIN CREDENTIALS (frontend check only)
const ADMIN = {
  email:    "admin@bvrit.ac.in",
  password: "Admin@123",
  role:     "admin"
};
// ========== SIGNUP ==========
function signup() {
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const role     = document.getElementById("signupRole").value;
  const errorBox = document.getElementById("signupErrors");
  errorBox.style.color = "red";
  errorBox.innerHTML   = "";
  let errors = [];
  if (!email.endsWith("@bvrit.ac.in"))
    errors.push("Email must end with @bvrit.ac.in");
  if (password.length < 9)
    errors.push("Password must be at least 9 characters long");
  if (!/[a-z]/.test(password))
    errors.push("Password must contain a lowercase letter");
  if (!/[A-Z]/.test(password))
    errors.push("Password must contain an uppercase letter");
  if (!/\d/.test(password))
    errors.push("Password must contain a digit");
  if (!/[@$!%*?&]/.test(password))
    errors.push("Password must contain a special character");
  const namePart = email.split("@")[0];
  if (namePart.length >= 3 && password.toLowerCase().includes(namePart.toLowerCase()))
    errors.push("Password should not contain your email name");
  if (!role)
    errors.push("Please select a role");
  if (errors.length > 0) {
    errors.forEach(err => {
      const p = document.createElement("p");
      p.innerText = err;
      errorBox.appendChild(p);
    });
    return;
  }
  fetch(`${BASE_URL}/insert_user.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password, role })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message === "User stored") {
      errorBox.style.color = "green";
      errorBox.innerText   = "Signup successful! Redirecting to login...";
      setTimeout(() => window.location.href = "/login", 1500);
    } else {
      errorBox.style.color = "red";
      errorBox.innerText   = data.message || "Signup failed. Try again.";
    }
  })
  .catch(() => {
    errorBox.style.color = "red";
    errorBox.innerText   = "Server error. Please try again.";
  });
}
// ========== LOGIN ==========
function login() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msg      = document.getElementById("loginMsg");
  msg.style.color = "red";
  msg.innerText   = "";
  if (!email || !password) {
    msg.innerText = "Please enter email and password";
    return;
  }
  // Admin shortcut (no DB call needed)
  if (email === ADMIN.email && password === ADMIN.password) {
    localStorage.setItem("loggedInUser", JSON.stringify(ADMIN));
    window.location.href = "/";  // ✅ was /home
    return;
  }
  fetch(`${BASE_URL}/login_user.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
      window.location.href = "/";  // ✅ was /home
    } else {
      msg.innerText = data.message || "Invalid email or password";
    }
  })
  .catch(() => {
    msg.innerText = "Server error. Please try again.";
  });
}