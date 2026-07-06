/* ==========================================================================
   PetsMart Order Management & Tracking Engine
   Pure localStorage, no backend. Works alongside auth.js (PMAuth) for
   login, but reads/writes the exact keys requested by the spec:
     users, products, cart, orders, currentUser, admin
   ========================================================================== */
(function (window) {
  "use strict";

  const KEYS = {
    users: "users",
    products: "products",
    cart: "cart",
    orders: "orders",
    appointments: "appointments",
    currentUser: "currentUser",
    admin: "admin",
  };

  const STATUS_FLOW = [
    "Order Placed",
    "Confirmed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  const CANCELLED = "Cancelled";
  const ALL_STATUSES = STATUS_FLOW.concat([CANCELLED]);

  const COURIERS = ["BlueDart", "Delhivery", "DTDC", "FedEx", "India Post"];
  const PAYMENT_METHODS = ["Cash on Delivery", "Credit Card", "Debit Card", "UPI", "Net Banking"];

  /* ---------------------------- helpers ---------------------------- */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Orders: failed to parse", key, e);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function pad(n, len) {
    return String(n).padStart(len, "0");
  }

  function fmtDateISO(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1, 2)}-${pad(dt.getDate(), 2)}`;
  }

  function fmtTimestamp(d) {
    const dt = d instanceof Date ? d : new Date(d);
    let hours = dt.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${fmtDateISO(dt)} ${pad(hours, 2)}:${pad(dt.getMinutes(), 2)} ${ampm}`;
  }

  function addDays(d, days) {
    const dt = d instanceof Date ? new Date(d) : new Date(d);
    dt.setDate(dt.getDate() + days);
    return dt;
  }

  function money(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });
  }

  function genOrderId(existing) {
    const nums = existing
      .map((o) => parseInt(String(o.orderId).replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 1000) + 1;
    return "ORD" + next;
  }

  function genTrackingNumber() {
    return "TRK" + Math.floor(100000000 + Math.random() * 899999999);
  }

  function genAppointmentId() {
    return "APT" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  const APPOINTMENT_STATUSES = ["Requested", "Confirmed", "Completed", "Cancelled"];

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------- seed defaults -------------------------- */

  function seedProducts() {
    let products = read(KEYS.products, null);
    if (products && products.length) return products;
    products = [
      { id: 1, name: "Premium Dog Food", image: "../assets/images/products/dry-dog-food-premium.webp", price: 1200, category: "Dog" },
      { id: 2, name: "Dog Chew Toy", image: "../assets/images/products/durable-chew-toy-premium.webp", price: 350, category: "Dog" },
      { id: 3, name: "Cat Scratching Post", image: "../assets/images/products/cat-scratching-post-premium.webp", price: 1899, category: "Cat" },
      { id: 4, name: "Cat Treats Pack", image: "../assets/images/products/cat-treats-premium.webp", price: 280, category: "Cat" },
      { id: 5, name: "Aquarium Fish Food", image: "../assets/images/products/tropical-fish-flakes-premium.webp", price: 299, category: "Fish" },
      { id: 6, name: "Small Pet Exercise Wheel", image: "../assets/images/products/exercise-wheel-tunnel-premium.webp", price: 899, category: "Small Pet" },
      { id: 7, name: "Dog Grooming Brush", image: "../assets/images/products/dog-grooming-brush-premium.webp", price: 450, category: "Dog" },
      { id: 8, name: "Bird Seed Mix", image: "../assets/images/products/bird-seed-premium.webp", price: 320, category: "Bird" },
    ];
    write(KEYS.products, products);
    return products;
  }

  function seedOrdersForUser(user) {
    const orders = read(KEYS.orders, []);
    if (orders.some((o) => o.userId === user.id)) return orders;

    const products = seedProducts();
    const now = new Date();

    const sample = [
      {
        items: [{ p: products[0], qty: 2 }],
        status: "Packed",
        daysAgo: 1,
      },
      {
        items: [{ p: products[2], qty: 1 }, { p: products[3], qty: 2 }],
        status: "Shipped",
        daysAgo: 3,
      },
      {
        items: [{ p: products[4], qty: 1 }],
        status: "Delivered",
        daysAgo: 9,
      },
      {
        items: [{ p: products[6], qty: 1 }],
        status: "Order Placed",
        daysAgo: 0,
      },
    ];

    sample.forEach(function (s, idx) {
      const orderDate = addDays(now, -s.daysAgo);
      const expected = addDays(orderDate, 5);
      const items = s.items.map(function (it) {
        return { id: it.p.id, name: it.p.name, image: it.p.image, price: it.p.price, quantity: it.qty };
      });
      const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      orders.push({
        orderId: genOrderId(orders),
        userId: user.id,
        customerName: user.name,
        email: user.email,
        products: items,
        total: total,
        paymentMethod: PAYMENT_METHODS[idx % PAYMENT_METHODS.length],
        address: user.address || "123 Paw Street, Petville, CA 90210",
        status: s.status,
        trackingNumber: genTrackingNumber(),
        courier: COURIERS[idx % COURIERS.length],
        orderDate: fmtDateISO(orderDate),
        expectedDelivery: fmtDateISO(s.status === "Delivered" ? addDays(orderDate, 4) : expected),
        lastUpdated: fmtTimestamp(addDays(now, -Math.max(0, s.daysAgo - 1))),
        statusHistory: STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(s.status) + 1).map(function (st, i) {
          return { status: st, at: fmtTimestamp(addDays(orderDate, i)) };
        }),
      });
    });

    write(KEYS.orders, orders);
    return orders;
  }

  /* ------------------------------ API -------------------------------- */

  const Orders = {
    KEYS: KEYS,
    STATUS_FLOW: STATUS_FLOW,
    ALL_STATUSES: ALL_STATUSES,
    CANCELLED: CANCELLED,

    money: money,
    fmtDateISO: fmtDateISO,
    fmtTimestamp: fmtTimestamp,
    escapeHtml: escapeHtml,

    /** Bridges PMAuth session (pm_session) into the spec's currentUser key, and
     * makes sure a matching record exists in `users`. Call once per page load. */
    syncCurrentUserFromSession() {
      if (!window.PMAuth) return null;
      const session = PMAuth.getSession();
      if (!session) {
        localStorage.removeItem(KEYS.currentUser);
        localStorage.removeItem(KEYS.admin);
        return null;
      }

      let users = read(KEYS.users, []);
      let user = users.find((u) => u.email === session.email);
      if (!user) {
        user = {
          id: "USR" + pad(users.length + 1, 3),
          name: session.name,
          email: session.email,
          address: "123 Paw Street, Petville, CA 90210",
          role: session.role,
        };
        users.push(user);
        write(KEYS.users, users);
      }

      write(KEYS.currentUser, user);
      if (session.role === "admin") {
        write(KEYS.admin, { id: user.id, name: user.name, email: user.email });
      } else {
        localStorage.removeItem(KEYS.admin);
      }

      seedProducts();
      seedOrdersForUser(user);
      return user;
    },

    getCurrentUser() {
      return read(KEYS.currentUser, null);
    },

    isAdmin() {
      return !!read(KEYS.admin, null);
    },

    getProducts() {
      return seedProducts();
    },

    getCart() {
      return read(KEYS.cart, []);
    },

    setCart(cart) {
      write(KEYS.cart, cart);
    },

    /* ------------------------- order queries ------------------------- */

    allOrders() {
      return read(KEYS.orders, []);
    },

    listAppointments() {
      return read(KEYS.appointments, []);
    },

    getAppointment(id) {
      return this.listAppointments().find((a) => a.id === id) || null;
    },

    addAppointment(details) {
      const appointments = this.listAppointments();
      const appointment = {
        id: genAppointmentId(),
        petName: details.petName || "Unknown",
        petType: details.petType || "Other",
        breed: details.breed || "Unknown",
        service: details.service || "Grooming",
        appointmentDate: details.appointmentDate || fmtDateISO(new Date()),
        ownerName: details.ownerName || "Guest",
        phone: details.phone || "",
        status: "Requested",
        requestedAt: fmtTimestamp(new Date()),
        notes: details.notes || "",
      };
      appointments.push(appointment);
      write(KEYS.appointments, appointments);
      return appointment;
    },

    updateAppointmentStatus(id, status) {
      const appointments = this.listAppointments();
      const appointment = appointments.find((a) => a.id === id);
      if (!appointment) throw new Error("Appointment not found.");
      appointment.status = APPOINTMENT_STATUSES.includes(status) ? status : appointment.status;
      appointment.updatedAt = fmtTimestamp(new Date());
      write(KEYS.appointments, appointments);
      return appointment;
    },

    deleteAppointment(id) {
      let appointments = this.listAppointments();
      appointments = appointments.filter((a) => a.id !== id);
      write(KEYS.appointments, appointments);
      return true;
    },

    appointmentsForCurrentUser() {
      const user = this.getCurrentUser();
      if (!user) return this.listAppointments();
      return this.listAppointments().filter((a) => a.ownerName === user.name || a.phone === user.phone);
    },

    /* ------------------------- order queries ------------------------- */
    ordersForCurrentUser() {
      const user = this.getCurrentUser();
      if (!user) return [];
      return this.allOrders()
        .filter((o) => o.userId === user.id)
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    },

    getOrder(orderId) {
      return this.allOrders().find((o) => o.orderId === orderId) || null;
    },

    /* ------------------------- order mutations ------------------------ */

    placeOrder({ products, paymentMethod, address }) {
      const user = this.getCurrentUser();
      if (!user) throw new Error("You must be logged in to place an order.");
      if (!products || !products.length) throw new Error("Cart is empty.");

      const orders = this.allOrders();
      const now = new Date();
      const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const order = {
        orderId: genOrderId(orders),
        userId: user.id,
        customerName: user.name,
        email: user.email,
        products: products,
        total: total,
        paymentMethod: paymentMethod || "Cash on Delivery",
        address: address || user.address,
        status: "Order Placed",
        trackingNumber: genTrackingNumber(),
        courier: COURIERS[Math.floor(Math.random() * COURIERS.length)],
        orderDate: fmtDateISO(now),
        expectedDelivery: fmtDateISO(addDays(now, 5)),
        lastUpdated: fmtTimestamp(now),
        statusHistory: [{ status: "Order Placed", at: fmtTimestamp(now) }],
      };
      orders.push(order);
      write(KEYS.orders, orders);
      this.setCart([]);
      return order;
    },

    updateStatus(orderId, newStatus) {
      const orders = this.allOrders();
      const order = orders.find((o) => o.orderId === orderId);
      if (!order) throw new Error("Order not found.");
      order.status = newStatus;
      order.lastUpdated = fmtTimestamp(new Date());
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({ status: newStatus, at: order.lastUpdated });
      write(KEYS.orders, orders);
      return order;
    },

    cancelOrder(orderId) {
      const order = this.getOrder(orderId);
      if (!order) throw new Error("Order not found.");
      if (!["Order Placed", "Confirmed"].includes(order.status)) {
        throw new Error('Only orders that are "Order Placed" or "Confirmed" can be cancelled.');
      }
      return this.updateStatus(orderId, CANCELLED);
    },

    deleteOrder(orderId) {
      let orders = this.allOrders();
      orders = orders.filter((o) => o.orderId !== orderId);
      write(KEYS.orders, orders);
      return true;
    },

    /* ----------------------------- stats ------------------------------ */

    stats() {
      const orders = this.allOrders();
      const revenue = orders
        .filter((o) => o.status !== CANCELLED)
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return {
        total: orders.length,
        pending: orders.filter((o) => ["Order Placed", "Confirmed", "Packed"].includes(o.status)).length,
        shipped: orders.filter((o) => ["Shipped", "Out for Delivery"].includes(o.status)).length,
        delivered: orders.filter((o) => o.status === "Delivered").length,
        cancelled: orders.filter((o) => o.status === CANCELLED).length,
        revenue: revenue,
      };
    },

    /** Progress percentage 0-100 for the timeline/progress bar. */
    progressPercent(status) {
      if (status === CANCELLED) return 0;
      const idx = STATUS_FLOW.indexOf(status);
      if (idx === -1) return 0;
      return Math.round((idx / (STATUS_FLOW.length - 1)) * 100);
    },
  };

  window.PMOrders = Orders;
})(window);


