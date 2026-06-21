import base from './playwright.config.js';

const config = {
  ...base,
  use: {
    ...base.use,
    baseURL: 'https://desayner.com',
  },
  webServer: undefined,
};

export default config;
