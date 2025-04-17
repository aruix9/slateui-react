const liquidPreset = require('@emdgroup-liquid/liquid/dist/css/tailwind-preset.cjs');

module.exports = {
  presets: [liquidPreset],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Adjust this path according to your project structure
    "./public/index.html",
  ],
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {},
  },
  plugins: [],
};

