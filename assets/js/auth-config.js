/* ==========================================================================
   PetsMart Social Sign-In Configuration
   ==========================================================================
   Fill in the values below with your own credentials. Nothing will work
   until you do — these are placeholders, not real keys.

   ------------------------------------------------------------------------
   GOOGLE  (free, takes ~5 minutes)
   ------------------------------------------------------------------------
   1. Go to https://console.cloud.google.com/apis/credentials
   2. Create a project (or pick an existing one).
   3. Click "Create Credentials" -> "OAuth client ID".
      - Application type: "Web application"
      - Authorized JavaScript origins: add every origin you'll load the
        site from, e.g.
          http://127.0.0.1:5500
          http://localhost:5500
          https://your-live-domain.com
        (No trailing slash, no path — just the scheme + host + port.)
   4. Copy the "Client ID" (ends in .apps.googleusercontent.com) into
      GOOGLE_CLIENT_ID below.
   5. You do NOT need a client secret for this flow — it all happens
      in the browser via Google Identity Services.

   ------------------------------------------------------------------------
   APPLE  (requires a paid Apple Developer account, $99/yr)
   ------------------------------------------------------------------------
   1. Enroll at https://developer.apple.com/programs/ if you haven't.
   2. In https://developer.apple.com/account/resources/identifiers/list
      create an "App ID" (if you don't have one) AND a separate
      "Services ID" — the Services ID is what you use for web sign-in.
   3. Edit the Services ID -> enable "Sign in with Apple" -> configure:
      - Primary App ID: your App ID
      - Domains and Subdomains: your-live-domain.com
        (Apple will NOT accept 127.0.0.1/localhost — see note below)
      - Return URLs: https://your-live-domain.com/pages/login.html
   4. Copy the Services ID (looks like "com.yourcompany.petsmart.web")
      into APPLE_CLIENT_ID below.
   5. Apple requires a domain-verification file to be hosted at
      /.well-known/apple-developer-domain-association.txt — Apple gives
      you this file to download when you save the Services ID config.

   NOTE ON LOCAL TESTING: Apple Sign In will NOT work on 127.0.0.1 or
   localhost — Apple requires a real HTTPS domain. You can fully build
   and test Google Sign In locally, but you'll only be able to test
   Apple Sign In once this site is deployed to a real domain.
   ========================================================================== */
(function (window) {
  "use strict";

  window.PM_AUTH_CONFIG = {
    // e.g. "1234567890-abcdefghijklmnop.apps.googleusercontent.com"
    GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",

    // e.g. "com.yourcompany.petsmart.web"
    APPLE_CLIENT_ID: "YOUR_APPLE_SERVICES_ID",

    // Must exactly match a "Return URL" configured on the Apple Services ID
    APPLE_REDIRECT_URI: window.location.origin + "/pages/login.html",
  };
})(window);
