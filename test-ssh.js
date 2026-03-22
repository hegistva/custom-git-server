const crypto = require('crypto');
try {
  const key = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGo2v2d+lH2mR1mG5F/H5z6N8F4b5W5C9+0T0g/O+H/T u@h';
  const pubKey = crypto.createPublicKey({ key, format: 'ssh', type: 'spki' }); // actually node 20 supports just { key } if it's PEM... wait, for ssh?
  console.log("createPublicKey worked?", pubKey.export({ format: 'pem', type: 'spki' }));
} catch (e) {
  console.log("Err:", e.message);
}

try {
  const keyBlob = Buffer.from('AAAAC3NzaC1lZDI1NTE5AAAAIGo2v2d+lH2mR1mG5F/H5z6N8F4b5W5C9+0T0g/O+H/T', 'base64');
  const digest = crypto.createHash('sha256').update(keyBlob).digest('base64');
  console.log('Fingerprint:', 'SHA256:' + digest.replace(/=$/, ''));
} catch (e) {
  console.log(e);
}
