// Tailwind 設定（建置時使用，不會送到網站）。內容原本寫在 index.html 的 <script>tailwind.config = …</script>，
// 現在改成建置時把用到的樣式產生好、直接放進 index.html（不再載入 cdn.tailwindcss.com）。
// content 由 build_index.js 以 --content 指定（掃描剛產生的 index.html 內容）。
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        peach: { 50: '#FFF5F5', 100: '#FED7D7', 200: '#FEB2B2', 400: '#F87171', 500: '#FF7A85', 600: '#E05362' },
        mint: { 50: '#F0FDF4', 100: '#DCFCE7', 400: '#34D399', 500: '#10B981', 600: '#059669' },
        sun: { 50: '#FFFBEB', 100: '#FEF3C7', 400: '#FBBF24', 500: '#F59E0B' },
        berry: { 50: '#F5F3FF', 100: '#EDE9FE', 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED' },
        warmbg: '#FDFBF7'
      },
      fontFamily: {
        sans: ['"Zen Maru Gothic"', '"Noto Sans TC"', 'sans-serif']
      }
    }
  }
};
