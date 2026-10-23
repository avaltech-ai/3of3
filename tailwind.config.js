// Tailwind 設定（建置時使用，不會送到網站）。內容原本寫在 index.html 的 <script>tailwind.config = …</script>，
// 現在改成建置時把用到的樣式產生好、直接放進 index.html（不再載入 cdn.tailwindcss.com）。
// content 由 build_index.js 以 --content 指定（掃描剛產生的 index.html 內容）。
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        peach: { 50: '#FFF5F5', 100: '#FED7D7', 200: '#FEB2B2', 400: '#F87171', 500: '#FF7A85', 600: '#E05362', 700: '#B03040' },   // 700：2026-10-23 新增（網頁一直在用 text-peach-700，但原本沒有這個色階，文字顏色沒有生效）；在 peach-100／50 底色上對比度 ≥ 4.5
        mint: { 50: '#F0FDF4', 100: '#DCFCE7', 400: '#34D399', 500: '#10B981', 600: '#059669' },
        sun: { 50: '#FFFBEB', 100: '#FEF3C7', 400: '#FBBF24', 500: '#F59E0B' },
        berry: { 50: '#F5F3FF', 100: '#EDE9FE', 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED' },
        warmbg: '#FDFBF7'
      },
      fontFamily: {
        sans: ['"Zen Maru Gothic"', '"Noto Sans TC"', 'sans-serif']
      },
      // 網頁一直在用、但 Tailwind 3.4.17 沒有的名稱（2026-10-23 補上定義，數值取自 Tailwind 4 的同名類別）。
      // 在這之前這些類別完全沒有作用：卡片沒有極淡陰影、載入圈圈的邊框寬度是 0（看不見）、遮罩沒有背景模糊。
      boxShadow: {
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      dropShadow: {
        '2xs': '0 1px 0 rgb(0 0 0 / 0.05)'
      },
      backdropBlur: {
        'xs': '4px'
      },
      borderWidth: {
        '3': '3px'
      }
    }
  }
};
