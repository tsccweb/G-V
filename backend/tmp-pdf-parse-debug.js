const fs = require('fs');
const data = fs.readFileSync('node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs', 'utf8');
const lines = data.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Please provide binary data as')) {
    console.log(i + 1, lines[i]);
  }
}
