/* ==========================================================================
   PetsMart Auth UI helpers
   Updates the navbar login/logout control on every page and wires up
   password show/hide toggles. Include after auth.js.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async function () {
  if (!window.PMAuth) return;
  await PMAuth.ready;

  // Password show/hide toggles (used on login/register/admin)
  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btn.innerHTML = isPw
        ? '<i class="fas fa-eye-slash" aria-hidden="true"></i>'
        : '<i class="fas fa-eye" aria-hidden="true"></i>';
    });
  });

  // Update navbar auth link to reflect session state
  const navAuthLink = document.getElementById('navAuthLink');
  if (navAuthLink) {
    const session = PMAuth.getSession();
    if (session) {
      // Admins browsing the public storefront shouldn't see a link that
      // jumps them into the admin dashboard — just hide the login button
      // and leave the logout button so they can sign out from anywhere.
      navAuthLink.classList.add('d-none');

      // Add a logout button if not already present
      if (!document.getElementById('navLogoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.id = 'navLogoutBtn';
        logoutBtn.className = 'btn-pet btn-pet-outline btn-pet-sm me-2';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt" aria-hidden="true"></i> Log Out';
        logoutBtn.setAttribute('aria-label', 'Log out');
        logoutBtn.addEventListener('click', function () {
          PMAuth.logout();
          window.location.href = 'login.html';
        });
        navAuthLink.insertAdjacentElement('afterend', logoutBtn);
      }
    }
  }
});
