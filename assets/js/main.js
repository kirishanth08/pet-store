/**
 * Pet Shop & Pet Supplies Store — Main JavaScript
 * Dark mode toggle, RTL toggle, form validation
 */

(function () {
  'use strict';

  /* ---- Cart Badge ---- */
  function getCartCount() {
    var cart = window.PMOrders ? PMOrders.getCart() : JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce(function (sum, item) {
      return sum + (parseInt(item.quantity, 10) || 1);
    }, 0);
  }

  window.updateCartBadge = function () {
    const badge = document.getElementById('navCartBadge');
    if (!badge) {
      return;
    }
    const count = getCartCount();
    badge.textContent = String(count);
    badge.classList.toggle('d-none', count === 0);
  };

  window.updateCartBadge();

  /* ---- Dark Mode Toggle ---- */
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const htmlEl = document.documentElement;
  // Support both the new key `petshop-theme` and legacy `theme` used in some pages
  let savedTheme = localStorage.getItem('petshop-theme');
  if (!savedTheme) savedTheme = localStorage.getItem('theme');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (savedTheme) {
    htmlEl.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
  }

  themeToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const current = htmlEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';

      if (next === 'light') {
        htmlEl.removeAttribute('data-theme');
        localStorage.setItem('petshop-theme', 'light');
        localStorage.setItem('theme', 'light');
      } else {
        htmlEl.setAttribute('data-theme', 'dark');
        localStorage.setItem('petshop-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }

      updateThemeIcons(next);
    });
  });

  function updateThemeIcons(theme) {
    themeToggles.forEach(function (toggle) {
      const icon = toggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  /* ---- RTL Toggle ---- */
  const rtlToggles = document.querySelectorAll('.rtl-toggle');

  // Apply the saved direction preference on every page, even ones (like the
  // admin login page) that don't render a .rtl-toggle button themselves.
  // Previously this whole block — including reading the saved preference —
  // lived inside `if (rtlToggles.length)`, so pages without a toggle button
  // never picked up dir="rtl" set from elsewhere on the site.
  const savedDir = localStorage.getItem('petshop-dir');
  if (savedDir === 'rtl') {
    htmlEl.setAttribute('dir', 'rtl');
    htmlEl.setAttribute('lang', 'ar');
    updateRtlIcons(true);
  }

  if (rtlToggles.length) {
    rtlToggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        const isRtl = htmlEl.getAttribute('dir') === 'rtl';

        if (isRtl) {
          htmlEl.removeAttribute('dir');
          htmlEl.setAttribute('lang', 'en');
          localStorage.setItem('petshop-dir', 'ltr');
          updateRtlIcons(false);
        } else {
          htmlEl.setAttribute('dir', 'rtl');
          htmlEl.setAttribute('lang', 'ar');
          localStorage.setItem('petshop-dir', 'rtl');
          updateRtlIcons(true);
        }
      });
    });
  }

  function updateRtlIcons(isRtl) {
    rtlToggles.forEach(function (toggle) {
      const icon = toggle.querySelector('i');
      if (icon) {
        icon.className = isRtl ? 'fas fa-align-left' : 'fas fa-align-right';
      }
      toggle.setAttribute('aria-label', isRtl ? 'Switch to LTR layout' : 'Switch to RTL layout');
    });
  }

  /* ---- Form Validation ---- */
  const formsToValidate = document.querySelectorAll('[data-validate="true"]');

  formsToValidate.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      const fields = form.querySelectorAll('[required]');

      fields.forEach(function (field) {
        clearFieldError(field);

        if (!field.value.trim()) {
          showFieldError(field, 'This field is required.');
          isValid = false;
          return;
        }

        if (field.type === 'email' && !isValidEmail(field.value)) {
          showFieldError(field, 'Please enter a valid email address.');
          isValid = false;
          return;
        }

        if (field.type === 'tel' && !isValidPhone(field.value)) {
          showFieldError(field, 'Please enter a valid phone number.');
          isValid = false;
          return;
        }

        if (field.type === 'date') {
          const selected = new Date(field.value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selected < today) {
            showFieldError(field, 'Please select a future date.');
            isValid = false;
            return;
          }
        }

        field.classList.add('is-valid');
      });

      if (isValid) {
        if (form.id === 'bookingForm' && window.PMOrders) {
          const appointment = PMOrders.addAppointment({
            petName: document.getElementById('petName').value.trim(),
            petType: document.getElementById('petType').value,
            breed: document.getElementById('breed').value.trim(),
            service: document.getElementById('service').value,
            appointmentDate: document.getElementById('appointmentDate').value,
            ownerName: document.getElementById('ownerName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
          });
          if (appointment) {
            const successMsg = form.querySelector('.form-success-message');
            if (successMsg) {
              successMsg.classList.add('show');
              successMsg.setAttribute('role', 'alert');
              successMsg.textContent = 'Thank you! Your grooming appointment has been submitted. The admin dashboard now has the booking details.';
            }
          }
        }
        const successMsg = form.querySelector('.form-success-message');
        if (successMsg && form.id !== 'bookingForm') {
          successMsg.classList.add('show');
          successMsg.setAttribute('role', 'alert');
        }
        form.reset();
        fields.forEach(function (field) {
          field.classList.remove('is-valid');
        });
      }
    });

    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('input', function () {
        clearFieldError(field);
      });
    });
  });

  function showFieldError(field, message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    field.setAttribute('aria-invalid', 'true');

    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '';
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[\d\s\-+()]{7,20}$/.test(phone.trim());
  }

  /* ---- Detail Page Content Switching ---- */
  const PET_DETAIL_DATA = {
    max: {
      name: 'Max',
      title: 'Max - Golden Retriever Puppy for Sale | PetsMart Pet Details',
      meta: 'Meet Max, a friendly Golden Retriever puppy. Vaccinated, microchipped, and vet checked.',
      breed: 'Golden Retriever',
      age: '12 weeks',
      gender: 'Male',
      colour: 'Golden',
      price: '$850',
      type: 'dog',
      image: '../assets/images/gallery/golden-retriever-photo.webp',
      thumbs: ['../assets/images/gallery/golden-retriever-photo.webp'],
      about: 'Max is a playful and affectionate Golden Retriever puppy raised in a loving home environment. He is socialised with children and other dogs, crate-trained, and ready to join his forever family.',
      personality: 'Curious, gentle, and eager to please. Max loves fetch, belly rubs, and nap time in sunny spots.',
      care: 'Golden Retrievers need daily exercise and regular brushing. Feed a premium puppy food three times daily until six months old.'
    },
    luna: {
      name: 'Luna',
      title: 'Luna - British Shorthair Cat for Sale | PetsMart Pet Details',
      meta: 'Meet Luna, a calm British Shorthair cat with a gentle personality.',
      breed: 'British Shorthair',
      age: '8 months',
      gender: 'Female',
      colour: 'Blue grey',
      price: '$650',
      type: 'cat',
      image: '../assets/images/gallery/ragdoll-cat-portrait.webp',
      thumbs: ['../assets/images/gallery/ragdoll-cat-portrait.webp'],
      about: 'Luna is a calm, affectionate British Shorthair who enjoys quiet company, soft beds, and gentle play.',
      personality: 'Easygoing, tidy, and affectionate on her own schedule. Luna is ideal for a peaceful home.',
      care: 'Brush weekly, offer enrichment toys, and keep her feeding routine consistent with high-quality cat food.'
    },
    splash: {
      name: 'Splash',
      title: 'Splash - Betta Fish for Sale | PetsMart Pet Details',
      meta: 'Meet Splash, a colourful Betta fish ready for a well-kept aquarium.',
      breed: 'Betta Fish',
      age: '6 months',
      gender: 'Male',
      colour: 'Blue and red',
      price: '$25',
      type: 'fish',
      image: '../assets/images/gallery/nemo.jpg',
      thumbs: ['../assets/images/gallery/nemo.jpg'],
      about: 'Splash is an active Betta with bright colour and confident movement, best suited to a filtered, heated tank.',
      personality: 'Alert, curious, and interactive at feeding time.',
      care: 'Keep him in a cycled aquarium with warm water, gentle filtration, and measured feeding.'
    },
    kiwi: {
      name: 'Kiwi',
      title: 'Kiwi - Parakeet for Sale | PetsMart Pet Details',
      meta: 'Meet Kiwi, a cheerful parakeet who loves perches and daily interaction.',
      breed: 'Parakeet',
      age: '1 year',
      gender: 'Female',
      colour: 'Green and yellow',
      price: '$120',
      type: 'bird',
      image: '../assets/images/parakeet-portrait.jpg',
      thumbs: ['../assets/images/parakeet-portrait.jpg'],
      about: 'Kiwi is a bright, social parakeet who enjoys gentle handling, climbing, and soft chatter.',
      personality: 'Lively, observant, and happiest with daily attention.',
      care: 'Provide a spacious cage, varied perches, clean water, seed mix, greens, and supervised out-of-cage time.'
    },
    cotton: {
      name: 'Cotton',
      title: 'Cotton - Holland Lop Rabbit for Sale | PetsMart Pet Details',
      meta: 'Meet Cotton, a young Holland Lop rabbit with a sweet temperament.',
      breed: 'Holland Lop',
      age: '4 months',
      gender: 'Male',
      colour: 'White',
      price: '$95',
      type: 'small',
      image: '../assets/images/gallery/Holland Lop.jpg',
      thumbs: ['../assets/images/gallery/Holland Lop.jpg'],
      about: 'Cotton is a soft, gentle rabbit who enjoys fresh hay, quiet handling, and room to hop.',
      personality: 'Sweet, curious, and calm once comfortable.',
      care: 'Give unlimited hay, daily greens, safe chew toys, and a roomy enclosure with exercise time.'
    },
    buddy: {
      name: 'Buddy',
      title: 'Buddy - Beagle Puppy for Sale | PetsMart Pet Details',
      meta: 'Meet Buddy, a cheerful Beagle puppy with a playful nature.',
      breed: 'Beagle',
      age: '16 weeks',
      gender: 'Male',
      colour: 'Tri-colour',
      price: '$720',
      type: 'dog',
      image: '../assets/images/gallery/beagle-puppy-portrait.webp',
      thumbs: ['../assets/images/gallery/beagle-puppy-portrait.webp'],
      about: 'Buddy is a cheerful Beagle puppy who loves sniffing games, toys, and being part of family activity.',
      personality: 'Friendly, food-motivated, and adventurous.',
      care: 'Beagles need daily walks, scent games, positive training, and secure outdoor spaces.'
    },
    rocky: {
      name: 'Rocky',
      title: 'Rocky - German Shepherd Puppy for Sale | PetsMart Pet Details',
      meta: 'Meet Rocky, a smart German Shepherd puppy ready for active training.',
      breed: 'German Shepherd',
      age: '14 weeks',
      gender: 'Male',
      colour: 'Black and tan',
      price: '$900',
      type: 'dog',
      image: '../assets/images/gallery/german-shepherd-portrait.webp',
      thumbs: ['../assets/images/gallery/german-shepherd-portrait.webp'],
      about: 'Rocky is alert, confident, and quick to learn, ideal for a family ready to continue structured training.',
      personality: 'Loyal, intelligent, and energetic.',
      care: 'Plan daily exercise, early socialisation, obedience training, and regular coat brushing.'
    },
    bella: {
      name: 'Bella',
      title: 'Bella - Persian Cat for Sale | PetsMart Pet Details',
      meta: 'Meet Bella, a gentle Persian cat with a plush coat.',
      breed: 'Persian',
      age: '10 months',
      gender: 'Female',
      colour: 'Cream',
      price: '$550',
      type: 'cat',
      image: '../assets/images/gallery/persian-cat-portrait.webp',
      thumbs: ['../assets/images/gallery/persian-cat-portrait.webp'],
      about: 'Bella is a quiet, affectionate Persian who enjoys relaxed homes and cosy resting spots.',
      personality: 'Gentle, sweet, and calm.',
      care: 'Persians need daily brushing, regular eye cleaning, and quality food to support coat health.'
    },
    nemo: {
      name: 'Nemo',
      title: 'Nemo - Clownfish for Sale | PetsMart Pet Details',
      meta: 'Meet Nemo, a lively clownfish for a stable marine aquarium.',
      breed: 'Clownfish',
      age: '6 months',
      gender: 'Juvenile',
      colour: 'Orange and white',
      price: '$35',
      type: 'fish',
      image: '../assets/images/gallery/betta-fish.webp',
      thumbs: ['../assets/images/gallery/betta-fish.webp'],
      about: 'Nemo is a lively clownfish suitable for a mature saltwater aquarium with stable water parameters.',
      personality: 'Active, bold, and fun to watch.',
      care: 'Maintain marine water quality, avoid overfeeding, and introduce tank mates carefully.'
    },
    rio: {
      name: 'Rio',
      title: 'Rio - Cockatiel for Sale | PetsMart Pet Details',
      meta: 'Meet Rio, a friendly cockatiel who enjoys attention.',
      breed: 'Cockatiel',
      age: '1 year',
      gender: 'Male',
      colour: 'Grey and yellow',
      price: '$150',
      type: 'bird',
      image: '../assets/images/gallery/rio.jpg',
      thumbs: ['../assets/images/gallery/rio.jpg'],
      about: 'Rio is a friendly cockatiel with a soft whistle and an outgoing personality.',
      personality: 'Social, vocal, and curious.',
      care: 'Offer daily interaction, a varied diet, clean cage space, and safe chewable toys.'
    },
    peanut: {
      name: 'Peanut',
      title: 'Peanut - Guinea Pig for Sale | PetsMart Pet Details',
      meta: 'Meet Peanut, a gentle guinea pig who loves hay and hideouts.',
      breed: 'Guinea Pig',
      age: '3 months',
      gender: 'Male',
      colour: 'Brown and white',
      price: '$45',
      type: 'small',
      image: '../assets/images/gallery/guinea-pig-portrait.webp',
      thumbs: ['../assets/images/gallery/guinea-pig-portrait.webp'],
      about: 'Peanut is a gentle guinea pig who enjoys fresh hay, cosy hideouts, and careful handling.',
      personality: 'Sweet, vocal at feeding time, and relaxed with patient owners.',
      care: 'Provide unlimited hay, vitamin C-rich vegetables, clean bedding, and a roomy habitat.'
    },
    daisy: {
      name: 'Daisy',
      title: 'Daisy - Labrador Retriever for Sale | PetsMart Pet Details',
      meta: 'Meet Daisy, a friendly Labrador Retriever with a loving nature.',
      breed: 'Labrador Retriever',
      age: '2 years',
      gender: 'Female',
      colour: 'Yellow',
      price: '$600',
      type: 'dog',
      image: '../assets/images/labrador retriever.jpg',
      thumbs: ['../assets/images/labrador retriever.jpg'],
      about: 'Daisy is an affectionate adult Labrador who loves people, walks, and gentle play.',
      personality: 'Loving, steady, and social.',
      care: 'Maintain daily exercise, measured meals, and regular grooming to keep her healthy.'
    }
  };

  const PRODUCT_DETAIL_DATA = {
    'dry-dog-food': {
      name: 'Premium Dry Dog Food',
      title: 'Premium Dry Dog Food - Royal Canin | PetsMart Product Details',
      meta: 'Premium dry dog food with balanced adult dog nutrition.',
      brand: 'Royal Canin',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      price: '$49.99',
      image: '../assets/images/products/Premium Dry Dog Food.jpg',
      thumbs: ['../assets/images/products/Premium Dry Dog Food.jpg', '../assets/images/gallery/golden-retriever-photo.webp', '../assets/images/products/dog-food-bowl-premium.webp'],
      description: ['Complete dry dog food with quality protein and balanced nutrients for adult dogs.', 'Crunchy kibble supports daily feeding routines and helps keep mealtime simple.'],
      ingredients: 'Chicken meal, rice, poultry fat, vitamins, minerals, omega oils, and probiotics.',
      feeding: 'Feed according to your dog weight and activity level. Always provide fresh water.'
    },
    'cat-treats': {
      name: 'Organic Cat Treats',
      title: 'Organic Cat Treats - Whiskas | PetsMart Product Details',
      meta: 'Organic cat treats in resealable packaging.',
      brand: 'Whiskas',
      badge: 'Cats',
      badgeClass: 'badge-cat',
      price: '$12.99',
      image: '../assets/images/products/Organic Cat Treats.jpg',
      thumbs: ['../assets/images/products/Organic Cat Treats.jpg', '../assets/images/gallery/persian-cat-portrait.webp', '../assets/images/gallery/ragdoll-cat-portrait.webp', '../assets/images/products/plush-cat-bed-premium.webp'],
      description: ['Crunchy organic cat treats made for reward time and enrichment.', 'The resealable pouch keeps every serving fresh between training sessions.'],
      ingredients: 'Chicken, salmon meal, oat flour, catnip, taurine, vitamins, and minerals.',
      feeding: 'Serve as a treat only. Keep treats below 10 percent of daily calories.'
    },
    'aquarium-kit': {
      name: 'Aquarium Starter Kit',
      title: 'Aquarium Starter Kit | PetsMart Product Details',
      meta: 'Aquarium starter kit with filter and lighting.',
      brand: 'Tetra',
      badge: 'Fish',
      badgeClass: 'badge-fish',
      price: '$89.99',
      image: '../assets/images/products/aquarium-starter-kit-premium.webp',
      thumbs: ['../assets/images/products/aquarium-starter-kit-premium.webp', '../assets/images/gallery/nemo.jpg', '../assets/images/products/tropical-fish-flakes-premium.webp'],
      description: ['A beginner-friendly aquarium kit with filtration and bright viewing.', 'Great for first-time fish keepers setting up a stable freshwater tank.'],
      ingredients: 'Glass tank, LED hood, filter, cartridge, setup guide, and water conditioner sample.',
      feeding: 'Cycle the tank before adding fish and test water regularly.'
    },
    'bird-seed': {
      name: 'Premium Bird Seed Mix',
      title: 'Premium Bird Seed Mix | PetsMart Product Details',
      meta: 'Premium seed mix for parakeets and small companion birds.',
      brand: 'Purina',
      badge: 'Birds',
      badgeClass: 'badge-bird',
      price: '$18.99',
      image: '../assets/images/products/bird-seed-premium.webp',
      thumbs: ['../assets/images/products/bird-seed-premium.webp', '../assets/images/gallery/parakeet-portrait.jpg', '../assets/images/gallery/cockatiel-portrait.webp', '../assets/images/products/spacious-bird-cage-premium.webp'],
      description: ['A balanced seed blend for daily feeding and natural foraging.', 'Pairs well with fresh greens and mineral supplements.'],
      ingredients: 'Millet, canary seed, sunflower kernels, oats, dried greens, vitamins, and minerals.',
      feeding: 'Refresh food daily and remove empty hulls from dishes.'
    },
    'hay-bedding': {
      name: 'Hay & Bedding Bundle',
      title: 'Hay and Bedding Bundle | PetsMart Product Details',
      meta: 'Small pet hay and bedding bundle for rabbits and guinea pigs.',
      brand: 'Orijen',
      badge: 'Small Pets',
      badgeClass: 'badge-small',
      price: '$24.99',
      image: '../assets/images/products/hay-bedding-bundle-premium.webp',
      thumbs: ['../assets/images/products/hay-bedding-bundle-premium.webp', '../assets/images/gallery/Holland Lop.jpg', '../assets/images/gallery/guinea-pig-portrait.webp', '../assets/images/products/exercise-wheel-tunnel-premium.webp'],
      description: ['A practical small pet bundle with soft bedding and fresh hay.', 'Designed for rabbits, guinea pigs, and other small companions.'],
      ingredients: 'Timothy hay, paper bedding, natural fibres, and dust-reduced material.',
      feeding: 'Offer unlimited hay and replace soiled bedding regularly.'
    },
    'chew-toy': {
      name: 'Durable Chew Toy',
      title: 'Durable Chew Toy | PetsMart Product Details',
      meta: 'Durable rubber dog chew toy for active dogs.',
      brand: 'Kong',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      price: '$15.99',
      image: '../assets/images/products/durable-chew-toy-premium.webp',
      thumbs: ['../assets/images/products/durable-chew-toy-premium.webp', '../assets/images/gallery/beagle-puppy-portrait.webp', '../assets/images/hero/hero-banner.webp', '../assets/images/products/adjustable-dog-leash-premium.webp'],
      description: ['A tough chew toy for active dogs who need safe play and enrichment.', 'Use for fetch, chewing, or stuffing with treats.'],
      ingredients: 'Pet-safe natural rubber.',
      feeding: 'Supervise play and replace if damaged.'
    },
    'scratching-post': {
      name: 'Cat Scratching Post',
      title: 'Cat Scratching Post | PetsMart Product Details',
      meta: 'Tall cat scratching post with sisal rope.',
      brand: 'Hills',
      badge: 'Cats',
      badgeClass: 'badge-cat',
      price: '$34.99',
      image: '../assets/images/Indoor Cat Enrichment Ideas.jpg',
      thumbs: ['../assets/images/Indoor Cat Enrichment Ideas.jpg', '../assets/images/gallery/ragdoll-cat-portrait.webp', '../assets/images/gallery/persian-cat-portrait.webp', '../assets/images/products/plush-cat-bed-premium.webp'],
      description: ['A sturdy scratching post that supports natural claw care and stretching.', 'Helps protect furniture while giving cats their own activity spot.'],
      ingredients: 'Sisal rope, plush fabric, engineered wood, and stable base.',
      feeding: 'Place near favourite resting areas and reward use with treats.'
    },
    'fish-food': {
      name: 'Tropical Fish Flakes',
      title: 'Tropical Fish Flakes | PetsMart Product Details',
      meta: 'Tropical fish food flakes for daily feeding.',
      brand: 'Tetra',
      badge: 'Fish',
      badgeClass: 'badge-fish',
      price: '$9.99',
      image: '../assets/images/products/tropical-fish-flakes-premium.webp',
      thumbs: ['../assets/images/products/tropical-fish-flakes-premium.webp', '../assets/images/gallery/nemo.jpg', '../assets/images/products/aquarium-starter-kit-premium.webp'],
      description: ['Daily flakes for tropical community fish with colour-supporting nutrition.', 'Easy to portion and suitable for most freshwater tanks.'],
      ingredients: 'Fish meal, shrimp meal, spirulina, yeast, vitamins, and minerals.',
      feeding: 'Feed only what fish consume in two minutes.'
    },
    'flea-treatment': {
      name: 'Frontline Flea Treatment',
      title: 'Frontline Flea Treatment | PetsMart Product Details',
      meta: 'Flea and tick treatment pack for dogs.',
      brand: 'Frontline',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      price: '$9.99',
      image: '../assets/images/products/flea-treatment-premium.webp',
      thumbs: ['../assets/images/products/flea-treatment-premium.webp', '../assets/images/services/pet-grooming-tools.webp', '../assets/images/hero/hero-banner.webp', '../assets/images/products/pet-vitamins-premium.webp'],
      description: ['A simple flea and tick care option for routine protection.', 'Choose the correct size pack for your dog before use.'],
      ingredients: 'Topical parasite control formula.',
      feeding: 'Follow package directions and consult a vet for puppies or sensitive pets.'
    },
    'dog-leash': {
      name: 'Adjustable Dog Leash',
      title: 'Adjustable Dog Leash | PetsMart Product Details',
      meta: 'Adjustable nylon dog leash with padded handle.',
      brand: 'Kong',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      price: '$22.99',
      image: '../assets/images/products/adjustable-dog-leash-premium.webp',
      thumbs: ['../assets/images/products/adjustable-dog-leash-premium.webp', '../assets/images/gallery/german-shepherd-portrait.webp', '../assets/images/gallery/beagle-puppy-portrait.webp', '../assets/images/products/durable-chew-toy-premium.webp'],
      description: ['A comfortable adjustable leash for daily walks and training.', 'The padded handle gives better grip during active outings.'],
      ingredients: 'Nylon webbing, metal clasp, and padded handle.',
      feeding: 'Check clips regularly and pair with a well-fitted collar or harness.'
    },
    'cat-bed': {
      name: 'Plush Cat Bed',
      title: 'Plush Cat Bed | PetsMart Product Details',
      meta: 'Plush washable cat bed for cosy rest.',
      brand: 'Whiskas',
      badge: 'Cats',
      badgeClass: 'badge-cat',
      price: '$39.99',
      image: '../assets/images/products/Plush Cat Bed.jpg',
      thumbs: ['../assets/images/products/Plush Cat Bed.jpg', '../assets/images/products/plush-cat-bed-premium.webp', '../assets/images/gallery/ragdoll-cat-portrait.webp', '../assets/images/gallery/persian-cat-portrait.webp'],
      description: ['A soft cat bed with a washable cover for everyday comfort.', 'Perfect for window spots, bedrooms, or quiet corners.'],
      ingredients: 'Plush fabric, padded filling, and removable cover.',
      feeding: 'Wash cover regularly and place in a calm resting area.'
    },
    'bird-cage': {
      name: 'Spacious Bird Cage',
      title: 'Spacious Bird Cage | PetsMart Product Details',
      meta: 'Bird cage with perches and feeding dishes.',
      brand: 'Ferplast',
      badge: 'Birds',
      badgeClass: 'badge-bird',
      price: '$74.99',
      image: '../assets/images/gallery/Spacious Birds Cage.jpg',
      thumbs: ['../assets/images/gallery/Spacious Birds Cage.jpg', '../assets/images/products/spacious-bird-cage-premium.webp', '../assets/images/gallery/parakeet-portrait.jpg', '../assets/images/gallery/cockatiel-portrait.webp'],
      description: ['A spacious bird cage with perches, dishes, and easy-clean access.', 'Suitable for parakeets, cockatiels, and similar companion birds.'],
      ingredients: 'Powder-coated wire, plastic base, wooden perches, and feed cups.',
      feeding: 'Clean trays often and add toys for enrichment.'
    },
    'dog-vitamins': {
      name: 'Daily Dog Vitamins',
      title: 'Daily Dog Vitamins | PetsMart Product Details',
      meta: 'Daily multivitamin chews for dogs.',
      brand: 'Kong',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      price: '$21.49',
      image: '../assets/images/products/Daily Dog Vitamins.jpg',
      thumbs: ['../assets/images/products/Daily Dog Vitamins.jpg', '../assets/images/products/pet-vitamins-premium.webp', '../assets/images/products/dog-vitamins.webp', '../assets/images/products/dog-food-bowl-premium.webp'],
      description: ['Tasty daily multivitamin chews that support a dog\u2019s coat, joints, and immune health.', 'A simple way to round out mealtime nutrition for dogs of any age.'],
      ingredients: 'Vitamin blend, glucosamine, omega oils, and natural chicken flavoring.',
      feeding: 'Give one chew daily with food, or as advised by your veterinarian.'
    },
    'exercise-wheel': {
      name: 'Exercise Wheel & Tunnel Set',
      title: 'Exercise Wheel and Tunnel Set | PetsMart Product Details',
      meta: 'Small pet exercise wheel and tunnel play set.',
      brand: 'Blue Buffalo',
      badge: 'Small Pets',
      badgeClass: 'badge-small',
      price: '$19.99',
      image: '../assets/images/products/Small pet exercise wheel.jpeg',
      thumbs: ['../assets/images/products/Small pet exercise wheel.jpeg', '../assets/images/products/exercise-wheel-tunnel-premium.webp', '../assets/images/gallery/guinea-pig-portrait.webp', '../assets/images/gallery/Holland Lop.jpg'],
      description: ['A small pet activity set for movement, hiding, and enrichment.', 'Great for creating a more interesting habitat.'],
      ingredients: 'Pet-safe plastic wheel and flexible tunnel.',
      feeding: 'Choose wheel size carefully and inspect parts during cleaning.'
    }
  };

  const BLOG_DETAIL_DATA = {
    'summer-dog-safety': {
      title: 'Summer Safety Tips for Dogs',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      date: '2026-06-10',
      dateText: 'June 10, 2026',
      minutes: '6 min read',
      image: '../assets/images/blog/dog-summer-safety.webp',
      alt: 'Golden retriever playing outdoors in summer',
      intro: 'Warm weather is wonderful for outdoor adventures, but dogs need extra care when temperatures rise.',
      sections: [
        ['Walk at Cooler Times', 'Plan walks in the early morning or evening, when pavement is cooler and shade is easier to find.'],
        ['Hydration Matters', 'Carry water, offer frequent breaks, and watch for heavy panting, drooling, or tiredness.'],
        ['Protect Paws and Skin', 'Avoid hot pavement and never leave a dog inside a parked car, even briefly.']
      ]
    },
    'cat-nutrition': {
      title: 'Understanding Cat Nutrition',
      badge: 'Cats',
      badgeClass: 'badge-cat',
      date: '2026-06-05',
      dateText: 'June 5, 2026',
      minutes: '7 min read',
      image: '../assets/images/Understanding cat Nutrients.jpg',
      alt: 'Cat eating from a bowl of nutritious food',
      intro: 'Cats are obligate carnivores, which means their meals should be built around animal protein and balanced nutrients.',
      sections: [
        ['Protein First', 'Choose cat food with quality animal protein and taurine to support heart, eye, and muscle health.'],
        ['Portions and Routine', 'Measure meals, keep treats limited, and monitor body condition to avoid overfeeding.'],
        ['Hydration Support', 'Wet food, clean water bowls, and fountains can help cats drink more consistently.']
      ]
    },
    'first-aquarium': {
      title: 'Setting Up Your First Aquarium',
      badge: 'Fish',
      badgeClass: 'badge-fish',
      date: '2026-05-28',
      dateText: 'May 28, 2026',
      minutes: '8 min read',
      image: '../assets/images/Setting Up Your First Aquarium.jpg',
      alt: 'Colourful tropical fish in a home aquarium',
      intro: 'A healthy aquarium starts before the first fish arrives. Good setup prevents stress and keeps water stable.',
      sections: [
        ['Cycle the Tank', 'Run filtration and establish beneficial bacteria before adding fish. Test water during the process.'],
        ['Stock Slowly', 'Add fish gradually and choose species that match tank size and water conditions.'],
        ['Maintain Weekly', 'Do partial water changes, clean filter media properly, and avoid overfeeding.']
      ]
    },
    'parakeet-care': {
      title: 'Parakeet Care Essentials',
      badge: 'Birds',
      badgeClass: 'badge-bird',
      date: '2026-05-20',
      dateText: 'May 20, 2026',
      minutes: '6 min read',
      image: '../assets/images/parent-essentials.jpeg',
      alt: 'Green parakeet perched on a branch',
      intro: 'Parakeets are social, clever birds that thrive with space, enrichment, and consistent gentle handling.',
      sections: [
        ['Choose the Right Cage', 'Provide room for movement, multiple perches, and safe toys for daily activity.'],
        ['Balance the Diet', 'Use quality seed or pellets with fresh greens and clean water every day.'],
        ['Build Trust', 'Short daily interactions help parakeets feel secure and confident around people.']
      ]
    },
    'puppy-training': {
      title: 'Puppy Training Basics',
      badge: 'Dogs',
      badgeClass: 'badge-dog',
      date: '2026-05-15',
      dateText: 'May 15, 2026',
      minutes: '7 min read',
      image: '../assets/images/Puppy Training Basics.jpg',
      alt: 'Puppy learning basic obedience training',
      intro: 'Early training gives puppies confidence, structure, and a strong bond with their families.',
      sections: [
        ['Reward Good Choices', 'Use treats, praise, and play to reward behaviours you want your puppy to repeat.'],
        ['Keep Sessions Short', 'Five-minute sessions several times daily work better than long lessons.'],
        ['Practice Consistency', 'Use the same cues and routines so your puppy understands expectations.']
      ]
    },
    'cat-enrichment': {
      title: 'Indoor Enrichment Ideas for Cats',
      badge: 'Cats',
      badgeClass: 'badge-cat',
      date: '2026-05-12',
      dateText: 'May 12, 2026',
      minutes: '5 min read',
      image: '../assets/images/Indoor Cat Enrichment Ideas.jpg',
      alt: 'Indoor cat playing with enrichment toys',
      intro: 'Indoor cats need chances to climb, scratch, stalk, and rest in safe elevated places.',
      sections: [
        ['Create Vertical Space', 'Cat trees, shelves, and window perches give cats secure lookout spots.'],
        ['Rotate Toys', 'Switch toys weekly to keep play fresh and encourage hunting-style movement.'],
        ['Use Food Puzzles', 'Puzzle feeders slow meals and add mental stimulation to daily routines.']
      ]
    }
  };

  const PET_SLUGS = {
    max: 'max',
    luna: 'luna',
    splash: 'splash',
    kiwi: 'kiwi',
    cotton: 'cotton',
    buddy: 'buddy',
    rocky: 'rocky',
    bella: 'bella',
    nemo: 'nemo',
    rio: 'rio',
    peanut: 'peanut',
    daisy: 'daisy'
  };

  const PRODUCT_SLUGS = {
    'premium dry dog food': 'dry-dog-food',
    'organic cat treats': 'cat-treats',
    'aquarium starter kit': 'aquarium-kit',
    'premium bird seed mix': 'bird-seed',
    'hay & bedding bundle': 'hay-bedding',
    'hay and bedding bundle': 'hay-bedding',
    'durable chew toy': 'chew-toy',
    'cat scratching post': 'scratching-post',
    'tropical fish flakes': 'fish-food',
    'frontline flea treatment': 'flea-treatment',
    'adjustable dog leash': 'dog-leash',
    'plush cat bed': 'cat-bed',
    'spacious bird cage': 'bird-cage',
    'exercise wheel & tunnel set': 'exercise-wheel',
    'exercise wheel and tunnel set': 'exercise-wheel',
    'grooming brush set': 'dog-leash',
    'leash & collar bundle': 'dog-leash',
    'leash and collar bundle': 'dog-leash',
    'vitamin chews': 'flea-treatment'
  };

  const BLOG_SLUGS = {
    'summer safety tips for dogs': 'summer-dog-safety',
    'understanding cat nutrition': 'cat-nutrition',
    'setting up your first aquarium': 'first-aquarium',
    'parakeet care essentials': 'parakeet-care',
    'puppy training basics': 'puppy-training',
    'indoor cat enrichment ideas': 'cat-enrichment'
  };

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setMetaDescription(content) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta && content) {
      meta.setAttribute('content', content);
    }
  }

  function setText(selector, text, root) {
    const el = (root || document).querySelector(selector);
    if (el && text !== undefined) {
      el.textContent = text;
    }
  }

  function setImage(el, src, alt) {
    if (!el) return;
    el.src = src;
    el.setAttribute('data-full', src);
    if (alt) {
      el.alt = alt;
    }
  }

  function normaliseTitle(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function updateListingLinks() {
    document.querySelectorAll('a[href="pet-details.html"]').forEach(function (link) {
      const card = link.closest('.card-pet');
      const title = card ? card.querySelector('.card-pet-title') : null;
      const slug = PET_SLUGS[normaliseTitle(title ? title.textContent : '')];
      if (slug) link.href = 'pet-details.html?pet=' + slug;
    });

    document.querySelectorAll('a[href="product-details.html"]').forEach(function (link) {
      const card = link.closest('.card-pet');
      const title = card ? card.querySelector('.card-pet-title') : null;
      const slug = PRODUCT_SLUGS[normaliseTitle(title ? title.textContent : '')];
      if (slug) link.href = 'product-details.html?product=' + slug;
    });

    document.querySelectorAll('a[href="blog-details.html"]').forEach(function (link) {
      const card = link.closest('.card-pet');
      const item = link.closest('li');
      const title = card ? card.querySelector('.card-pet-title') : item;
      const slug = BLOG_SLUGS[normaliseTitle(title ? title.textContent : link.textContent)];
      if (slug) link.href = 'blog-details.html?post=' + slug;
    });
  }

  function applyPetDetails() {
    if (currentPage !== 'pet-details.html') return;
    const pet = PET_DETAIL_DATA[getParam('pet') || 'max'] || PET_DETAIL_DATA.max;
    document.title = pet.title;
    setMetaDescription(pet.meta);
    setText('.breadcrumb-item.active', pet.name);
    setText('#pet-heading', pet.name);
    setText('.card-pet-price.mb-3', pet.price);
    setText('#enquiry-heading', 'Enquire About ' + pet.name);
    const hiddenPet = document.querySelector('input[name="pet"]');
    if (hiddenPet) {
      hiddenPet.value = pet.name + ' - ' + pet.breed;
    }

    const dts = Array.from(document.querySelectorAll('dt'));
    dts.forEach(function (dt) {
      const dd = dt.nextElementSibling;
      if (!dd) return;
      if (dt.textContent.trim() === 'Breed') dd.textContent = pet.breed;
      if (dt.textContent.trim() === 'Age') dd.textContent = pet.age;
      if (dt.textContent.trim() === 'Gender') dd.textContent = pet.gender;
      if (dt.textContent.trim() === 'Colour') dd.textContent = pet.colour;
    });

    setImage(document.getElementById('galleryMain'), pet.image, pet.name + ' - ' + pet.breed);
    document.querySelectorAll('.product-thumbnails img').forEach(function (thumb, index) {
      if (pet.thumbs[index]) {
        thumb.classList.remove('d-none');
        setImage(thumb, pet.thumbs[index], pet.name + ' photo ' + (index + 1));
        thumb.dataset.full = pet.thumbs[index];
        if (index === 0) thumb.classList.add('active');
        else thumb.classList.remove('active');
      } else {
        thumb.classList.add('d-none');
      }
    });

    const headings = Array.from(document.querySelectorAll('h2.h4'));
    headings.forEach(function (heading) {
      const paragraph = heading.nextElementSibling;
      if (!paragraph) return;
      if (heading.textContent === 'About Max' || heading.textContent.indexOf('About ') === 0) {
        heading.textContent = 'About ' + pet.name;
        paragraph.textContent = pet.about;
      }
      if (heading.textContent === 'Personality') paragraph.textContent = pet.personality;
      if (heading.textContent === 'Care Notes') paragraph.textContent = pet.care;
    });

    const message = document.getElementById('enquiryMessage');
    if (message) {
      message.placeholder = 'Tell us about your home and experience with ' + pet.type + 's...';
    }
  }

  function applyProductDetails() {
    if (currentPage !== 'product-details.html') return;
    const product = PRODUCT_DETAIL_DATA[getParam('product') || 'dry-dog-food'] || PRODUCT_DETAIL_DATA['dry-dog-food'];
    document.title = product.title;
    setMetaDescription(product.meta);
    setText('.breadcrumb-item.active', product.name);
    setText('#product-heading', product.name);
    setText('.text-muted.mb-2', 'Brand: ' + product.brand);
    setText('.card-pet-price.mb-4', product.price);

    const badge = document.querySelector('.col-lg-6 .badge-pet');
    if (badge) {
      badge.className = 'badge-pet ' + product.badgeClass + ' mb-2';
      badge.textContent = product.badge;
    }

    setImage(document.getElementById('galleryMain'), product.image, product.name);
    document.querySelectorAll('.product-thumbnails img').forEach(function (thumb, index) {
      if (product.thumbs[index]) {
        thumb.classList.remove('d-none');
        setImage(thumb, product.thumbs[index], product.name + ' photo ' + (index + 1));
        thumb.dataset.full = product.thumbs[index];
        if (index === 0) thumb.classList.add('active');
        else thumb.classList.remove('active');
      } else {
        thumb.classList.add('d-none');
      }
    });

    const optionLabel = document.querySelector('label[for="productSize"]');
    const optionSelect = document.getElementById('productSize');
    if (optionLabel && optionSelect) {
      const isMeasuredProduct = /food|treat|seed|hay|flakes/i.test(product.name);
      optionLabel.textContent = isMeasuredProduct ? 'Size / Weight' : 'Option';
      optionSelect.innerHTML = isMeasuredProduct
        ? '<option selected>Standard pack - ' + product.price + '</option><option>Large pack</option><option>Value pack</option>'
        : '<option selected>Standard - ' + product.price + '</option><option>Gift wrapped</option><option>Reserve for pickup</option>';
    }

    const bodies = document.querySelectorAll('.accordion-body');
    if (bodies[0]) {
      bodies[0].innerHTML = '<p>' + product.description[0] + '</p><p>' + product.description[1] + '</p>';
    }
    if (bodies[1]) bodies[1].innerHTML = '<p>' + product.ingredients + '</p>';
    if (bodies[2]) bodies[2].innerHTML = '<p>' + product.feeding + '</p>';
  }

  function applyBlogDetails() {
    if (currentPage !== 'blog-details.html') return;
    const post = BLOG_DETAIL_DATA[getParam('post') || 'summer-dog-safety'] || BLOG_DETAIL_DATA['summer-dog-safety'];
    document.title = post.title + ' | PetsMart Blog';
    setMetaDescription(post.intro);
    setText('.breadcrumb-item.active', post.title);
    setText('.page-header h1', post.title);

    const badge = document.querySelector('.page-header .badge-pet');
    if (badge) {
      badge.className = 'badge-pet ' + post.badgeClass;
      badge.textContent = post.badge;
    }

    const byline = document.querySelector('.page-header .text-muted');
    if (byline) {
      byline.innerHTML = 'By <strong>Dr. Emily Hartwell</strong> &bull; <time datetime="' + post.date + '">' + post.dateText + '</time> &bull; ' + post.minutes;
    }

    const article = document.querySelector('.blog-article-content');
    if (article) {
      article.innerHTML = '<img src="' + post.image + '" alt="' + post.alt + '" width="800" height="450" loading="lazy">' +
        '<p>' + post.intro + '</p>' +
        post.sections.map(function (section, index) {
          const id = index === 0 ? ' id="article-heading"' : '';
          return '<h2' + id + '>' + section[0] + '</h2><p>' + section[1] + '</p>';
        }).join('') +
        '<blockquote class="testimonial-card"><p>"Thoughtful daily care makes pets more confident, comfortable, and healthy."</p></blockquote>';
    }
  }

  updateListingLinks();
  applyPetDetails();
  applyProductDetails();
  applyBlogDetails();

  /* ---- Product Gallery Thumbnails ---- */
  const galleryMain = document.getElementById('galleryMain');
  const galleryThumbs = document.querySelectorAll('.product-thumbnails img');

  galleryThumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      if (galleryMain) {
        galleryMain.src = thumb.dataset.full || thumb.src.replace(/w=\d+&h=\d+/, 'w=800&h=600');
        galleryMain.alt = thumb.alt;
      }
      galleryThumbs.forEach(function (t) {
        t.classList.remove('active');
      });
      thumb.classList.add('active');
    });
  });

  /* ---- Quantity Picker ---- */
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyInput = document.getElementById('qtyInput');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', function () {
      const val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
      }
    });

    qtyPlus.addEventListener('click', function () {
      const val = parseInt(qtyInput.value, 10) || 1;
      if (val < 99) {
        qtyInput.value = val + 1;
      }
    });
  }

  /* ---- Countdown Timer (Coming Soon) ---- */
  const countdownEl = document.getElementById('countdown');

  if (countdownEl) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    function updateCountdown() {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        countdownEl.innerHTML = '<p>Arriving very soon!</p>';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const daysEl = document.getElementById('countDays');
      const hoursEl = document.getElementById('countHours');
      const minutesEl = document.getElementById('countMinutes');
      const secondsEl = document.getElementById('countSeconds');

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ---- Active Nav Link ---- */
  document.querySelectorAll('.navbar-pet .nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---- Add to Cart ---- */
  document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (currentPage === 'product-details.html' && window.PMOrders) {
        const cartId = getParam('product') || 'dry-dog-food';
        const product = PRODUCT_DETAIL_DATA[cartId] || PRODUCT_DETAIL_DATA['dry-dog-food'];
        const sizeSelect = document.getElementById('productSize');
        const qtyInputEl = document.getElementById('qtyInput');
        const qty = Math.max(1, parseInt(qtyInputEl ? qtyInputEl.value : 1, 10) || 1);
        const sizeLabel = (sizeSelect && sizeSelect.selectedOptions.length) ? sizeSelect.selectedOptions[0].textContent.trim() : '';
        const priceNum = parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;

        const cart = PMOrders.getCart();
        const existing = cart.find(function (item) {
          return item.id === cartId && item.size === sizeLabel;
        });
        if (existing) {
          existing.quantity = (parseInt(existing.quantity, 10) || 0) + qty;
        } else {
          cart.push({
            id: cartId,
            name: product.name,
            image: product.image,
            price: priceNum,
            size: sizeLabel,
            quantity: qty
          });
        }
        PMOrders.setCart(cart);
        if (typeof window.updateCartBadge === 'function') {
          window.updateCartBadge();
        }
        if (typeof window.pmToast === 'function') {
          window.pmToast(qty + ' × ' + product.name + ' added to your cart.', 'success');
        }
      }

      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Added!';
      btn.disabled = true;
      setTimeout(function () {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2000);
    });
  });

  document.querySelectorAll('.btn-book-scroll').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = document.getElementById('bookingForm');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---- Broken Image Fallback ---- */
  const IMAGE_FALLBACK = (window.PET_IMAGES && window.PET_IMAGES.fallback) || '../assets/images/icons/pet-image.svg';

  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.dataset.fallbackApplied) {
        return;
      }
      img.dataset.fallbackApplied = 'true';
      img.src = IMAGE_FALLBACK;
    });
  });

  /* ---- Product Catalog: Filter & Sort ---- */
  const productGrid = document.getElementById('productGrid');
  const sortProducts = document.getElementById('sortProducts');
  const productCount = document.getElementById('productCount');
  const productEmpty = document.getElementById('productEmpty');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const filterSidebar = document.querySelector('.filter-sidebar');

  if (productGrid) {
    const productItems = Array.from(productGrid.querySelectorAll('.product-item'));

    function getCheckedValues(name) {
      if (!filterSidebar) {
        return [];
      }
      return Array.from(filterSidebar.querySelectorAll('input[name="' + name + '"]:checked'))
        .map(function (input) {
          return input.value;
        })
        .filter(function (value) {
          return value !== '';
        });
    }

    function getSelectedPrice() {
      if (!filterSidebar) {
        return '';
      }
      const selected = filterSidebar.querySelector('input[name="price"]:checked');
      return selected ? selected.value : '';
    }

    function matchesPriceRange(price, range) {
      if (!range) {
        return true;
      }
      if (range === 'under-25') {
        return price < 25;
      }
      if (range === '25-50') {
        return price >= 25 && price <= 50;
      }
      if (range === '50-100') {
        return price > 50 && price <= 100;
      }
      if (range === 'over-100') {
        return price > 100;
      }
      return true;
    }

    function productMatchesFilters(item, filters) {
      const petType = item.dataset.petType || '';
      const category = item.dataset.category || '';
      const brand = item.dataset.brand || '';
      const price = parseFloat(item.dataset.price) || 0;

      if (filters.petTypes.length && filters.petTypes.indexOf(petType) === -1) {
        return false;
      }
      if (filters.categories.length && filters.categories.indexOf(category) === -1) {
        return false;
      }
      if (filters.brands.length && filters.brands.indexOf(brand) === -1) {
        return false;
      }
      if (!matchesPriceRange(price, filters.price)) {
        return false;
      }
      return true;
    }

    function sortProductItems(items, sortBy) {
      const sorted = items.slice();

      sorted.sort(function (a, b) {
        const priceA = parseFloat(a.dataset.price) || 0;
        const priceB = parseFloat(b.dataset.price) || 0;
        const nameA = (a.dataset.name || '').toLowerCase();
        const nameB = (b.dataset.name || '').toLowerCase();
        const featuredA = parseInt(a.dataset.featured, 10) || 0;
        const featuredB = parseInt(b.dataset.featured, 10) || 0;

        if (sortBy === 'price-low') {
          return priceA - priceB;
        }
        if (sortBy === 'price-high') {
          return priceB - priceA;
        }
        if (sortBy === 'name-az') {
          return nameA.localeCompare(nameB);
        }
        if (sortBy === 'name-za') {
          return nameB.localeCompare(nameA);
        }
        return featuredA - featuredB;
      });

      return sorted;
    }

    /* ---- Pagination ---- */
    const PRODUCTS_PER_PAGE = 6;
    const paginationNav = document.getElementById('productPagination');
    const paginationList = document.getElementById('paginationList');
    let currentPage = 1;
    let lastSortedVisible = [];

    function renderPagination(totalItems) {
      if (!paginationNav || !paginationList) {
        return;
      }
      const totalPages = Math.max(1, Math.ceil(totalItems / PRODUCTS_PER_PAGE));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      if (totalItems === 0 || totalPages <= 1) {
        paginationNav.classList.add('d-none');
        return;
      }
      paginationNav.classList.remove('d-none');

      const parts = [];
      parts.push(
        '<li class="page-item' + (currentPage === 1 ? ' disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="prev" aria-label="Previous page"' +
        (currentPage === 1 ? ' tabindex="-1"' : '') + '>' +
        '<i class="fas fa-chevron-left" aria-hidden="true"></i></a></li>'
      );
      for (let i = 1; i <= totalPages; i++) {
        parts.push(
          '<li class="page-item' + (i === currentPage ? ' active' : '') + '"' +
          (i === currentPage ? ' aria-current="page"' : '') + '>' +
          '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>'
        );
      }
      parts.push(
        '<li class="page-item' + (currentPage === totalPages ? ' disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="next" aria-label="Next page"' +
        (currentPage === totalPages ? ' tabindex="-1"' : '') + '>' +
        '<i class="fas fa-chevron-right" aria-hidden="true"></i></a></li>'
      );

      paginationList.innerHTML = parts.join('');
    }

    function showPage() {
      const totalPages = Math.max(1, Math.ceil(lastSortedVisible.length / PRODUCTS_PER_PAGE));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const end = start + PRODUCTS_PER_PAGE;

      lastSortedVisible.forEach(function (item, index) {
        const onPage = index >= start && index < end;
        item.classList.toggle('d-none', !onPage);
      });

      renderPagination(lastSortedVisible.length);
    }

    function goToPage(pageAttr) {
      const totalPages = Math.max(1, Math.ceil(lastSortedVisible.length / PRODUCTS_PER_PAGE));
      if (pageAttr === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (pageAttr === 'next') {
        currentPage = Math.min(totalPages, currentPage + 1);
      } else {
        currentPage = Math.min(totalPages, Math.max(1, parseInt(pageAttr, 10) || 1));
      }
      showPage();
      productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (paginationList) {
      paginationList.addEventListener('click', function (e) {
        const link = e.target.closest('[data-page]');
        if (!link) {
          return;
        }
        e.preventDefault();
        const pageItem = link.closest('.page-item');
        if (pageItem && pageItem.classList.contains('disabled')) {
          return;
        }
        goToPage(link.dataset.page);
      });
    }

    function applyProductFilters() {
      const filters = {
        petTypes: getCheckedValues('pet-type'),
        categories: getCheckedValues('category'),
        brands: getCheckedValues('brand'),
        price: getSelectedPrice()
      };
      const sortBy = sortProducts ? sortProducts.value : 'featured';
      const visible = [];

      productItems.forEach(function (item) {
        const show = productMatchesFilters(item, filters);
        item.classList.toggle('d-none', !show);
        if (show) {
          visible.push(item);
        }
      });

      const sortedVisible = sortProductItems(visible, sortBy);
      sortedVisible.forEach(function (item) {
        productGrid.appendChild(item);
      });

      if (productCount) {
        productCount.textContent = String(visible.length);
      }
      if (productEmpty) {
        productEmpty.classList.toggle('d-none', visible.length > 0);
      }

      lastSortedVisible = sortedVisible;
      currentPage = 1;
      showPage();
    }

    function clearProductFilters() {
      if (filterSidebar) {
        filterSidebar.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
          input.checked = false;
        });
        const allPrices = filterSidebar.querySelector('input[name="price"][value=""]');
        if (allPrices) {
          allPrices.checked = true;
        }
      }
      if (sortProducts) {
        sortProducts.value = 'featured';
      }
      applyProductFilters();
    }

    function applyBrandFromUrl() {
      const brandParam = new URLSearchParams(window.location.search).get('brand');
      if (!brandParam || !filterSidebar) {
        return;
      }
      const brandInput = filterSidebar.querySelector('input[name="brand"][value="' + brandParam + '"]');
      if (brandInput) {
        brandInput.checked = true;
      }
    }

    function applyPetTypeFromUrl() {
      const petTypeParam = new URLSearchParams(window.location.search).get('pet-type');
      if (!petTypeParam || !filterSidebar) {
        return;
      }
      const petTypeInput = filterSidebar.querySelector('input[name="pet-type"][value="' + petTypeParam + '"]');
      if (petTypeInput) {
        petTypeInput.checked = true;
      }
    }

    function applyCategoryFromUrl() {
      const categoryParam = new URLSearchParams(window.location.search).get('category');
      if (!categoryParam || !filterSidebar) {
        return;
      }
      const categoryInput = filterSidebar.querySelector('input[name="category"][value="' + categoryParam + '"]');
      if (categoryInput) {
        categoryInput.checked = true;
      }
    }

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', applyProductFilters);
    }
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearProductFilters);
    }
    if (sortProducts) {
      sortProducts.addEventListener('change', applyProductFilters);
    }

    applyBrandFromUrl();
    applyPetTypeFromUrl();
    applyCategoryFromUrl();
    applyProductFilters();
  }

  /* ---- Pets for Sale: Filter ---- */
  const petGrid = document.getElementById('petGrid');
  const filterPetType = document.getElementById('filterPetType');
  const filterAge = document.getElementById('filterAge');
  const filterPrice = document.getElementById('filterPrice');

  if (petGrid) {
    const petItems = Array.from(petGrid.querySelectorAll('.pet-item'));

    function matchesPetPriceRange(price, range) {
      if (!range) {
        return true;
      }
      if (range === 'under-100') {
        return price < 100;
      }
      if (range === '100-500') {
        return price >= 100 && price <= 500;
      }
      if (range === '500-1000') {
        return price > 500 && price <= 1000;
      }
      if (range === 'over-1000') {
        return price > 1000;
      }
      return true;
    }

    function applyPetFilters() {
      const typeValue = filterPetType ? filterPetType.value : '';
      const ageValue = filterAge ? filterAge.value : '';
      const priceValue = filterPrice ? filterPrice.value : '';

      petItems.forEach(function (item) {
        const petType = item.dataset.petType || '';
        const age = item.dataset.age || '';
        const price = parseFloat(item.dataset.price) || 0;
        const show =
          (!typeValue || petType === typeValue) &&
          (!ageValue || age === ageValue) &&
          matchesPetPriceRange(price, priceValue);

        item.classList.toggle('d-none', !show);
      });
    }

    [filterPetType, filterAge, filterPrice].forEach(function (select) {
      if (select) {
        select.addEventListener('change', applyPetFilters);
      }
    });
  }

  /* ---- Newsletter Signup ---- */
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  newsletterForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email || !emailPattern.test(email)) {
        if (typeof window.pmToast === 'function') {
          window.pmToast('Please enter a valid email address.', 'danger');
        }
        if (emailInput) {
          emailInput.focus();
        }
        return;
      }

      if (typeof window.pmToast === 'function') {
        window.pmToast('Subscribed! Welcome to the PetsMart Pet Lovers Club.', 'success');
      } else {
        window.alert('Subscribed! Welcome to the PetsMart Pet Lovers Club.');
      }
      form.reset();
    });
  });

})();


