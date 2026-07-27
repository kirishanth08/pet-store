/**
 * PetsMart - local image defaults and fallback.
 * Pages reference their own content-specific files in assets/images.
 */
(function (global) {
  'use strict';

  var FALLBACK_IMAGE = '../assets/images/icons/pet-image.svg';

  global.PET_IMAGES = {
    default: '../assets/images/hero/hero-banner.webp',
    fallback: FALLBACK_IMAGE,
    product: '../assets/images/products/dry-dog-food-premium.webp',
    pet: '../assets/images/gallery/golden-retriever-photo.webp',
    blog: '../assets/images/blog/dog-summer-safety.webp',
    grooming: '../assets/images/services/pet-grooming-tools.webp',
    gallery: '../assets/images/products/dog-food-kibble-premium.webp',
    thumbnail: '../assets/images/products/dry-dog-food-premium.webp'
  };

  global.getPetImage = function () {
    return global.PET_IMAGES.default;
  };
})(window);


