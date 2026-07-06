/* ==========================================================================
   PetsMart Auth Module
   Client-side authentication & admin data layer backed by localStorage.
   NOTE: This is a front-end demo auth system (no real backend/server).
   Passwords are hashed with SHA-256 + per-user salt before storage, but
   localStorage is still readable on the user's own machine, so this should
   never be used to protect real user data in production.
   ========================================================================== */
(function (window) {
  "use strict";

  const USERS_KEY = "pm_users";
  const SESSION_KEY = "pm_session";
  const PRODUCTS_KEY = "pm_products";
  const ORDERS_KEY = "pm_orders";
  const ACTIVITY_KEY = "pm_activity";

  /* ---------------------------- helpers ---------------------------- */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Auth: failed to parse", key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function randomSalt() {
    const arr = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }

  async function hashPassword(password, salt) {
    return sha256Hex(salt + ":" + password);
  }

  function logActivity(message, meta) {
    const log = readJSON(ACTIVITY_KEY, []);
    log.unshift({
      id: uid("act"),
      message: message,
      meta: meta || {},
      at: new Date().toISOString(),
    });
    writeJSON(ACTIVITY_KEY, log.slice(0, 200));
  }

  /* ------------------------- seed defaults -------------------------- */

  async function seedDefaults() {
    let users = readJSON(USERS_KEY, null);
    if (!users) {
      users = [];
    }

    const hasAdmin = users.some((u) => u.email === "admin@petsmart.com");
    if (!hasAdmin) {
      const adminSalt = randomSalt();
      const adminHash = await hashPassword("Admin@123", adminSalt);
      users.push({
        id: uid("usr"),
        name: "Store Admin",
        email: "admin@petsmart.com",
        salt: adminSalt,
        hash: adminHash,
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
        phone: "",
        address: "",
      });
    }

    if (!readJSON(USERS_KEY, null)) {
      writeJSON(USERS_KEY, users);
    } else if (!users.every((u) => readJSON(USERS_KEY, []).some((existing) => existing.id === u.id))) {
      writeJSON(USERS_KEY, users);
    }

    let products = readJSON(PRODUCTS_KEY, null);
    if (!products) {
      products = [
        { id: uid("prod"), name: "Premium Dry Dog Food (5kg)", category: "Dog", price: 1299, stock: 42, status: "active" },
        { id: uid("prod"), name: "Cat Scratching Post", category: "Cat", price: 1899, stock: 15, status: "active" },
        { id: uid("prod"), name: "Adjustable Dog Leash", category: "Dog", price: 499, stock: 60, status: "active" },
        { id: uid("prod"), name: "Aquarium Fish Food Flakes", category: "Fish", price: 299, stock: 80, status: "active" },
        { id: uid("prod"), name: "Small Pet Exercise Wheel", category: "Small Pet", price: 899, stock: 0, status: "inactive" },
      ];
      writeJSON(PRODUCTS_KEY, products);
    }

    let orders = readJSON(ORDERS_KEY, null);
    if (!orders) {
      const now = Date.now();
      orders = [
        { id: uid("ord"), customer: "Sarah Lee", total: 2598, status: "Delivered", createdAt: new Date(now - 86400000 * 1).toISOString() },
        { id: uid("ord"), customer: "James Carter", total: 899, status: "Processing", createdAt: new Date(now - 86400000 * 2).toISOString() },
        { id: uid("ord"), customer: "Emily Chan", total: 1798, status: "Shipped", createdAt: new Date(now - 86400000 * 4).toISOString() },
      ];
      writeJSON(ORDERS_KEY, orders);
    }
  }

  /* ----------------------------- API -------------------------------- */

  const Auth = {
    ready: seedDefaults(),

    async register({ name, email, password, role }) {
      await this.ready;
      email = String(email || "").trim().toLowerCase();
      const users = readJSON(USERS_KEY, []);

      if (!name || !email || !password) {
        throw new Error("Please fill in all fields.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }
      if (users.some((u) => u.email === email)) {
        throw new Error("An account with that email already exists.");
      }

      const salt = randomSalt();
      const hash = await hashPassword(password, salt);
      const user = {
        id: uid("usr"),
        name: name,
        email: email,
        salt: salt,
        hash: hash,
        role: role === "admin" ? "admin" : "customer",
        status: "active",
        createdAt: new Date().toISOString(),
        phone: "",
        address: "",
      };
      users.push(user);
      writeJSON(USERS_KEY, users);
      logActivity(`New account registered: ${email}`, { userId: user.id });
      return this._publicUser(user);
    },

    async login({ email, password, remember }) {
      await this.ready;
      email = String(email || "").trim().toLowerCase();
      const users = readJSON(USERS_KEY, []);
      const user = users.find((u) => u.email === email);

      if (!user) throw new Error("No account found with that email.");
      if (user.status === "blocked") {
        throw new Error("This account has been blocked. Contact support.");
      }

      const hash = await hashPassword(password, user.salt);
      if (hash !== user.hash) throw new Error("Incorrect password.");

      const session = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginAt: new Date().toISOString(),
        remember: !!remember,
      };
      writeJSON(SESSION_KEY, session);
      logActivity(`${user.name} logged in`, { userId: user.id });
      return this._publicUser(user);
    },

    logout() {
      const s = this.getSession();
      if (s) logActivity(`${s.name} logged out`, { userId: s.userId });
      localStorage.removeItem(SESSION_KEY);
    },

    getSession() {
      return readJSON(SESSION_KEY, null);
    },

    isLoggedIn() {
      return !!this.getSession();
    },

    isAdmin() {
      const s = this.getSession();
      return !!s && s.role === "admin";
    },

    /** Redirect to login if not authenticated. Call at top of protected pages. */
    requireAuth(redirectTo) {
      if (!this.isLoggedIn()) {
        const dest = redirectTo || "login.html";
        const next = encodeURIComponent(window.location.pathname.split("/").pop());
        window.location.href = `${dest}?next=${next}`;
      }
    },

    /** Redirect to login if not an admin. Call at top of admin pages. */
    requireAdmin(redirectTo) {
      const s = this.getSession();
      if (!s) {
        window.location.href = `login.html?next=admin.html`;
        return;
      }
      if (s.role !== "admin") {
        window.location.href = redirectTo || "index.html";
      }
    },

    _publicUser(u) {
      return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
    },

    getCurrentUserProfile() {
      const session = this.getSession();
      if (!session) return null;
      const users = readJSON(USERS_KEY, []);
      const user = users.find((u) => u.id === session.userId);
      if (!user) return null;
      return {
        ...this._publicUser(user),
        phone: user.phone || "",
        address: user.address || "",
      };
    },

    async updateProfile(profile) {
      await this.ready;
      const session = this.getSession();
      if (!session) throw new Error("Please log in to update your profile.");

      const users = readJSON(USERS_KEY, []);
      const user = users.find((u) => u.id === session.userId);
      if (!user) throw new Error("User profile not found.");

      if (profile.name !== undefined) {
        const name = String(profile.name || "").trim();
        if (!name) throw new Error("Name cannot be empty.");
        user.name = name;
      }

      if (profile.email !== undefined) {
        const email = String(profile.email || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Please enter a valid email address.");
        }
        if (users.some((u) => u.id !== user.id && u.email === email)) {
          throw new Error("An account with that email already exists.");
        }
        user.email = email;
      }

      if (profile.phone !== undefined) {
        user.phone = String(profile.phone || "").trim();
      }

      if (profile.address !== undefined) {
        user.address = String(profile.address || "").trim();
      }

      if (profile.password) {
        if (String(profile.password).length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        const salt = randomSalt();
        user.salt = salt;
        user.hash = await hashPassword(profile.password, salt);
      }

      writeJSON(USERS_KEY, users);
      writeJSON(SESSION_KEY, { ...session, name: user.name, email: user.email });
      logActivity(`Profile updated for ${user.email}`, { userId: user.id });
      return this.getCurrentUserProfile();
    },

    /* --------------------- admin data accessors --------------------- */

    listUsers() {
      return readJSON(USERS_KEY, []).map(this._publicUser);
    },

    setUserStatus(userId, status) {
      const users = readJSON(USERS_KEY, []);
      const u = users.find((x) => x.id === userId);
      if (!u) return false;
      u.status = status;
      writeJSON(USERS_KEY, users);
      logActivity(`User ${u.email} set to ${status}`, { userId });
      return true;
    },

    setUserRole(userId, role) {
      const users = readJSON(USERS_KEY, []);
      const u = users.find((x) => x.id === userId);
      if (!u) return false;
      u.role = role === "admin" ? "admin" : "customer";
      writeJSON(USERS_KEY, users);
      logActivity(`User ${u.email} role set to ${u.role}`, { userId });
      return true;
    },

    deleteUser(userId) {
      let users = readJSON(USERS_KEY, []);
      const u = users.find((x) => x.id === userId);
      users = users.filter((x) => x.id !== userId);
      writeJSON(USERS_KEY, users);
      if (u) logActivity(`User ${u.email} deleted`, { userId });
      return true;
    },

    listProducts() {
      return readJSON(PRODUCTS_KEY, []);
    },

    saveProduct(product) {
      const products = readJSON(PRODUCTS_KEY, []);
      if (product.id) {
        const idx = products.findIndex((p) => p.id === product.id);
        if (idx > -1) {
          products[idx] = { ...products[idx], ...product };
          writeJSON(PRODUCTS_KEY, products);
          logActivity(`Product updated: ${product.name}`, { productId: product.id });
          return products[idx];
        }
      }
      const newProduct = { ...product, id: uid("prod") };
      products.push(newProduct);
      writeJSON(PRODUCTS_KEY, products);
      logActivity(`Product added: ${newProduct.name}`, { productId: newProduct.id });
      return newProduct;
    },

    deleteProduct(productId) {
      let products = readJSON(PRODUCTS_KEY, []);
      const p = products.find((x) => x.id === productId);
      products = products.filter((x) => x.id !== productId);
      writeJSON(PRODUCTS_KEY, products);
      if (p) logActivity(`Product deleted: ${p.name}`, { productId });
      return true;
    },

    listOrders() {
      return readJSON(ORDERS_KEY, []);
    },

    setOrderStatus(orderId, status) {
      const orders = readJSON(ORDERS_KEY, []);
      const o = orders.find((x) => x.id === orderId);
      if (!o) return false;
      o.status = status;
      writeJSON(ORDERS_KEY, orders);
      logActivity(`Order ${orderId} marked ${status}`, { orderId });
      return true;
    },

    listActivity(limit) {
      return readJSON(ACTIVITY_KEY, []).slice(0, limit || 50);
    },

    stats() {
      const users = readJSON(USERS_KEY, []);
      const products = readJSON(PRODUCTS_KEY, []);
      const orders = readJSON(ORDERS_KEY, []);
      const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return {
        totalUsers: users.length,
        totalAdmins: users.filter((u) => u.role === "admin").length,
        totalProducts: products.length,
        lowStock: products.filter((p) => Number(p.stock) <= 5).length,
        totalOrders: orders.length,
        revenue: revenue,
      };
    },
  };

  window.PMAuth = Auth;
})(window);
