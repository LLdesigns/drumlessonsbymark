import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .nojekyll file exists
const nojekyllPath = path.join(__dirname, '../dist/.nojekyll');
if (!fs.existsSync(nojekyllPath)) {
  fs.writeFileSync(nojekyllPath, '');
  console.log('Created .nojekyll file');
}

// Create a more comprehensive _headers file
const headersContent = `/*
  Content-Type: text/javascript
  Cache-Control: public, max-age=31536000

/assets/*
  Content-Type: text/javascript
  Cache-Control: public, max-age=31536000

/assets/*.js
  Content-Type: text/javascript
  Cache-Control: public, max-age=31536000

/assets/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=31536000

/*.js
  Content-Type: text/javascript
  Cache-Control: public, max-age=31536000

/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=31536000
`;

const headersPath = path.join(__dirname, '../dist/_headers');
fs.writeFileSync(headersPath, headersContent);
console.log('Updated _headers file');

// Create .htaccess for Apache servers
const htaccessContent = `# Set MIME types for JavaScript modules
<Files "*.js">
    Header set Content-Type "text/javascript"
</Files>

# Set MIME types for CSS
<Files "*.css">
    Header set Content-Type "text/css"
</Files>

# Enable CORS for assets
<FilesMatch "\.(js|css)$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>

# Disable Jekyll processing
# This file tells GitHub Pages to not process files with Jekyll
`;

const htaccessPath = path.join(__dirname, '../dist/.htaccess');
fs.writeFileSync(htaccessPath, htaccessContent);
console.log('Updated .htaccess file');

console.log('MIME type fixes applied successfully');
