"use strict";

// 1. DARKMODE / LIGHTMODE: chỉ lưu lựa chọn giao diện, không lưu thông tin cá nhân.
const root = document.documentElement;
const themeButton = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");
const colorPreference = window.matchMedia("(prefers-color-scheme: dark)");
let manualTheme = false;

function applyTheme(theme) {
  const dark = theme === "dark";
  root.dataset.theme = dark ? "dark" : "light";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.setAttribute("aria-label", dark ? "Bật chế độ sáng" : "Bật chế độ tối");
  themeIcon.textContent = dark ? "☀" : "☾";
  themeLabel.textContent = dark ? "Chế độ sáng" : "Chế độ tối";
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--primary").trim();
}
let savedTheme;
try { savedTheme = localStorage.getItem("forma-theme"); } catch { /* Vẫn hoạt động nếu trình duyệt chặn lưu trữ. */ }
manualTheme = savedTheme === "dark" || savedTheme === "light";
applyTheme(manualTheme ? savedTheme : colorPreference.matches ? "dark" : "light");
themeButton.addEventListener("click", () => {
  manualTheme = true;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("forma-theme", next); } catch { /* Không bắt buộc lưu trữ. */ }
});
colorPreference.addEventListener?.("change", event => {
  if (!manualTheme) applyTheme(event.matches ? "dark" : "light");
});

// 2. MENU ĐIỆN THOẠI: đóng khi chọn mục hoặc nhấn Escape.
const menuButton = document.querySelector(".menu-toggle");
const nav = document.getElementById("menu-chinh");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Đóng menu điều hướng" : "Mở menu điều hướng");
  menuButton.firstElementChild.textContent = open ? "×" : "☰";
}
menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    menuButton.focus();
  }
});

// 3. CHỌN KHÓA HỌC: dùng dữ liệu từ thẻ HTML, đồng bộ với select và phần tóm tắt.
const form = document.getElementById("registration-form");
const courseSelect = document.getElementById("khoa-muon-hoc");
const successBox = document.getElementById("form-success");
const errorBox = document.getElementById("form-error");
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const courseData = new Map(Array.from(document.querySelectorAll(".course-card"), card => [
  card.dataset.course,
  { name: card.querySelector("h3").textContent, fee: Number(card.dataset.fee), duration: card.dataset.duration }
]));
function updateCourseSummary() {
  const course = courseData.get(courseSelect.value);
  document.getElementById("selected-name").textContent = course ? course.name : "Bạn muốn học điều gì?";
  document.getElementById("selected-detail").textContent = course ? `${course.duration} · ${money.format(course.fee)}` : "Chọn khóa học trong biểu mẫu bên cạnh.";
}
function chooseCourse(id) {
  if (!courseData.has(id)) throw new Error("Khóa học không tồn tại.");
  courseSelect.value = id;
  updateCourseSummary();
  clearFieldError(courseSelect);
  successBox.hidden = true;
}
document.querySelectorAll("[data-select-course]").forEach(link => {
  link.addEventListener("click", () => {
    chooseCourse(link.dataset.selectCourse);
    document.getElementById("ho-ten").focus({ preventScroll: true });
  });
});
courseSelect.addEventListener("change", updateCourseSummary);

// 4. KIỂM TRA BIỂU MẪU: lỗi hiện ngay bên dưới từng trường, không tải lại trang.
const birthday = document.getElementById("ngay-sinh");
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
birthday.max = today;
function clearFieldError(field) {
  field.removeAttribute("aria-invalid");
  const error = document.getElementById(`${field.id}-error`);
  if (error) error.textContent = "";
}
function clearErrors() {
  form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field-error").forEach(error => error.textContent = "");
  errorBox.hidden = true;
  errorBox.textContent = "";
}
form.addEventListener("input", event => {
  successBox.hidden = true;
  clearFieldError(event.target);
  const group = event.target.closest("fieldset");
  if (group) {
    group.removeAttribute("aria-invalid");
    group.querySelector(".field-error").textContent = "";
  }
});
form.addEventListener("change", () => { successBox.hidden = true; });
form.addEventListener("submit", event => {
  event.preventDefault();
  clearErrors();
  successBox.hidden = true;
  let firstInvalid = null;
  let errorCount = 0;
  function error(id, message, errorId = `${id}-error`) {
    const field = document.getElementById(id);
    field.setAttribute("aria-invalid", "true");
    document.getElementById(errorId).textContent = message;
    firstInvalid ??= field.matches("fieldset") ? field.querySelector("input") : field;
    errorCount++;
  }
  const name = document.getElementById("ho-ten");
  const email = document.getElementById("email");
  const phone = document.getElementById("dien-thoai");
  const goal = document.getElementById("muc-tieu");
  name.value = name.value.trim();
  email.value = email.value.trim();
  goal.value = goal.value.trim();
  if (name.value.length < 2) error("ho-ten", "Vui lòng nhập họ và tên (ít nhất 2 ký tự).");
  if (!birthday.value || birthday.validity.badInput) error("ngay-sinh", "Vui lòng chọn ngày sinh hợp lệ.");
  else if (birthday.value > today) error("ngay-sinh", "Ngày sinh không được sau ngày hôm nay.");
  if (!email.value || !email.validity.valid) error("email", "Vui lòng nhập email hợp lệ, ví dụ ban@example.com.");
  const normalizedPhone = phone.value.replace(/[\s.()-]/g, "");
  if (!/^\+?\d{10,15}$/.test(normalizedPhone)) error("dien-thoai", "Nhập số điện thoại từ 10–15 chữ số; có thể bắt đầu bằng +.");
  if (!form.querySelector('input[name="trinhDo"]:checked')) error("trinh-do-group", "Vui lòng chọn trình độ hiện tại.", "trinh-do-error");
  if (!courseData.has(courseSelect.value)) error("khoa-muon-hoc", "Vui lòng chọn một khóa học.");
  const sessions = Array.from(form.querySelectorAll('input[name="caHoc"]:checked'), input => input.value);
  if (!sessions.length) error("ca-hoc-group", "Vui lòng chọn ít nhất một ca học.", "ca-hoc-error");
  if (!goal.value) error("muc-tieu", "Vui lòng chia sẻ mục tiêu học tập của bạn.");
  if (errorCount) {
    errorBox.textContent = `Còn ${errorCount} mục cần kiểm tra. Bạn xem hướng dẫn bên dưới từng trường nhé.`;
    errorBox.hidden = false;
    firstInvalid.focus();
    return;
  }
  const course = courseData.get(courseSelect.value);
  // textContent hiển thị dữ liệu an toàn; không ghép thông tin người dùng vào innerHTML.
  document.getElementById("success-message").textContent = `${name.value}, bạn đã chọn khóa ${course.name}, ca học: ${sessions.join(", ")}. Học phí: ${money.format(course.fee)}.`;
  successBox.hidden = false;
  successBox.focus({ preventScroll: true });
  successBox.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
});
form.addEventListener("reset", () => {
  clearErrors();
  successBox.hidden = true;
  document.getElementById("success-message").textContent = "";
  // Sự kiện reset xảy ra trước lúc trình duyệt đưa các trường về giá trị ban đầu.
  window.setTimeout(updateCourseSummary, 0);
});
document.getElementById("current-year").textContent = String(now.getFullYear());

// 5. HỖ TRỢ WEBMCP (nếu trình duyệt có): chỉ chọn khóa, không gửi đăng ký.
// Dùng chính hàm chooseCourse của nút chọn khóa trên giao diện.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: "stage_course_selection",
      title: "Chọn khóa học cho biểu mẫu",
      description: "Điền sẵn khóa học vào biểu mẫu đăng ký. Không gửi thông tin hoặc hoàn tất đăng ký.",
      inputSchema: { type: "object", properties: { courseId: { type: "string", enum: Array.from(courseData.keys()) } }, required: ["courseId"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input.courseId !== "string" || Object.keys(input).some(key => key !== "courseId")) throw new Error("Dữ liệu khóa học không hợp lệ.");
        chooseCourse(input.courseId);
        document.getElementById("dang-ky").scrollIntoView({ block: "start" });
        return { selectedCourse: courseData.get(input.courseId).name, submitted: false };
      }
    }, { signal: lifecycle.signal })).catch(() => { /* Không ảnh hưởng chức năng thường. */ });
  } catch { /* WebMCP là tiện ích tùy chọn. */ }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
