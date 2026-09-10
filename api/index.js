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

  // The uploaded index.html is an RTF-wrapped HTML document. Decode the
  // RTF escapes before sending it to the browser. In particular, the app's
  // JavaScript contains RTF Unicode controls such as \\u8722; leaving those
  // controls intact makes the browser reject the entire script.
  let html = source
    .replace(/\\\\\r?\n/g, '')
    .replace(/\\\\\{/g, '{')
    .replace(/\\\\\}/g, '}')
    .replace(/\\\\\\\\/g, '\\\\')
    .replace(/\\\\uc-?\d+/g, '')
    .replace(/\\\\u(-?\d+)\??\s?/g, (_, n) => {
      let code = Number(n);
      if (code < 0) code += 65536;
      return String.fromCharCode(code);
    })
    .replace(/\\\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\\(?:par|line)\b/g, '\n')
    .replace(/\\\\tab\b/g, '\t');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.statusCode = 200;
  res.end(html);
};
