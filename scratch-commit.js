const { execSync } = require('child_process');
const cwd = 'C:\\Users\\Dell\\.gemini\\antigravity\\scratch\\dafe.ild-studio';
try {
  execSync('git add -A', { cwd, stdio: 'inherit' });
  const status = execSync('git status --short', { cwd }).toString();
  console.log('Status:\n', status);
  if (status.trim()) {
    execSync('git commit -m "Add real Seedance 2.5 API endpoints, real vertical crop and 15s trailer exporter, and real Stripe integration"', { cwd, stdio: 'inherit' });
    console.log('Committed successfully.');
  }
} catch (err) {
  console.error('Error:', err.message);
}
