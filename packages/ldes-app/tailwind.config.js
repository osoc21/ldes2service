// https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js

module.exports = {
  purge: ['./src/**/*.ts', './src/**/*.tsx', './**/*.html'],
  theme: {
    fontFamily: {
      sans: [
        'Flanders Art Sans',
        '-apple-system',
        'BlinkMacSystemFont',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
    },
    extend: {
      colors: {
        gray: {
          50: '#f7f9fc',
          100: '#EDEDED',
          200: '#6B6B6B',
          300: '#E5E5E5',
          400: '#D5D5D5',
          500: '#989898',
          600: '#6B6B6B',
          700: '#6B6B6B',
          800: '#494949',
        },
        blue: {
          300: '#428EEC',
          500: '#0055cc',
          800: '#356196',
        },
      },
      borderColor: theme => ({
        ...theme('colors'),
        DEFAULT: theme('colors.gray.300', 'currentColor'),
      }),
    },
  },
  plugins: [],
};
