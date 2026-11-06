import { networkInterfaces } from 'node:os';
import { connection, NextResponse } from 'next/server';

function addressPriority(address) {
  if (address.startsWith('192.168.')) return 0;
  if (address.startsWith('10.')) return 1;

  const [first, second] = address.split('.').map(Number);
  if (first === 172 && second >= 16 && second <= 31) return 2;

  return 3;
}

export async function GET(request) {
  await connection();

  const requestUrl = new URL(request.url);
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((network) => network && network.family === 'IPv4' && !network.internal)
    .map((network) => network.address)
    .filter((address, index, all) => all.indexOf(address) === index)
    .sort((a, b) => addressPriority(a) - addressPriority(b));

  return NextResponse.json({
    addresses,
    host: requestUrl.hostname,
    port: Number(requestUrl.port || 3000),
  });
}
