const os = require('os');
const networkInterfaces = os.networkInterfaces();

function getLocalIP() {
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
}

console.log(getLocalIP());