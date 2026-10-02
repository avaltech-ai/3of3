const fs = require('fs');
let content = fs.readFileSync('build_index.js', 'utf8');

// The original replacement added an extra brace at the end.
content = content.replace(
  `        }
      }
      }
    }`,
  `        }
      }
    }`
);

fs.writeFileSync('build_index.js', content);
