/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bạn có thể thêm màu vàng GoldInsight vào đây để dùng cho tiện
        gold: '#FFDA91',
      }
    },
  },
  plugins: [],
}