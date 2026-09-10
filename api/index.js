const fs = require('node:fs');
const path = require('node:path');

module.exports = function handler(req, res) {
  const file = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const start = file.indexOf('<!DOCTYPE html>');
  const end = file.lastIndexOf('</html>');

  if (start < 0 || end < start) {
    res.statusCode = 500;
    res.end('Invalid index.html');
    return;
  }

  const source = file.slice(start, end + '</html>'.length);
  let html = '';

  for (let i = 0; i < source.length; i++) {
    if (source[i] !== '\\') {
      html += source[i];
      continue;
    }

    if (source[i + 1] === '\n' || source[i + 1] === '\r') {
      if (source[i + 1] === '\r' && source[i + 2] === '\n') i++;
      i++;
      continue;
    }

    if (source[i + 1] === '{' || source[i + 1] === '}' || source[i + 1] === '\\') {
      html += source[++i];
      continue;
    }

    if (source[i + 1] === "'" && /^[0-9a-fA-F]{2}$/.test(source.slice(i + 2, i + 4))) {
      html += Buffer.from(source.slice(i + 2, i + 4), 'hex').toString('latin1');
      i += 3;
      continue;
    }

    html += '\\';
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.statusCode = 200;
  res.end(html);
};
