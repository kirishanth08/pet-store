/* ==========================================================================
   PetsMart Toast Notifications (lightweight, no Bootstrap JS toast needed)
   ========================================================================== */
window.pmToast = function (message, type) {
  type = type || "info";
  let container = document.querySelector(".pm-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "pm-toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "fa-circle-check", danger: "fa-circle-exclamation", info: "fa-circle-info" };
  const toast = document.createElement("div");
  toast.className = `pm-toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}" aria-hidden="true"></i>
    <span>${message}</span>
    <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
  `;
  toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};
