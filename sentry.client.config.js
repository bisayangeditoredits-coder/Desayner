import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://30abb9b0c146f08e7eacc1388f769719@o4511511505534976.ingest.de.sentry.io/4511511510909008",
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
