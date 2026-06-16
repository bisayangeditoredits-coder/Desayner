import base from './playwright.config.js';

export default {
  ...base,
  use: {
    ...base.use,
    baseURL: 'https://desayner.com',
  },
  webServer: undefined,
};
