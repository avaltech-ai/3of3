const fs = require('fs');
let content = fs.readFileSync('build_index.js', 'utf8');

// Replace the external call logic to remove isNetlify entirely
content = content.replace(
  /const isNetlify = window\.location\.hostname\.includes\('netlify\.app'\) \|\| window\.location\.hostname === 'localhost';[\s\S]*?gasPostViaIframe\(action, payload, successCb, errorCb\);\s*\}\s*\}/m,
  `
        if (action === 'getAppData' || action === 'getAlbums' || action === 'getAlbumPhotos' || action === 'getActivityImages') {
          let url = GAS_API_URL + '?action=' + encodeURIComponent(action);
          if (payload && payload.albumId) url += '&albumId=' + encodeURIComponent(payload.albumId);
          fetch(url, { redirect: 'follow' })
            .then(r => r.json())
            .then(res => { if (successCb) successCb(res); })
            .catch(err => { if (errorCb) errorCb(err); });
        } else {
          // 外部環境備援方案：隱藏 iframe form POST (完全繞過跨域)
          gasPostViaIframe(action, payload, successCb, errorCb);
        }
      }`
);

fs.writeFileSync('build_index.js', content);
