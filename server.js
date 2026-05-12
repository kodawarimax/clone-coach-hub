const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  const PORT = parseInt(process.env.PORT || '3200', 10);
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Clone & Coach Hub ready on http://localhost:${PORT}`);
  });
});
