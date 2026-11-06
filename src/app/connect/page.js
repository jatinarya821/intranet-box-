'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

function normaliseHost(value) {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

function escapeWifiValue(value) {
  return value.replace(/([\\\\;,:])/g, '\\$1');
}

export default function ConnectPage() {
  const [networkInfo, setNetworkInfo] = useState({ addresses: [], port: 3000 });
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [customIp, setCustomIp] = useState('');
  const [networkName, setNetworkName] = useState('EMERGENCY-NET');
  const [networkPassword, setNetworkPassword] = useState('');
  const [wifiQrDataUrl, setWifiQrDataUrl] = useState(null);
  const [qrError, setQrError] = useState('');

  const host = normaliseHost(customIp);
  const connectUrl = host ? `http://${host}:${networkInfo.port}` : '';
  const wifiPayload = networkName && networkPassword
    ? `WIFI:T:WPA;S:${escapeWifiValue(networkName)};P:${escapeWifiValue(networkPassword)};;`
    : '';

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/network', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(({ addresses, host: requestHost, port }) => {
        const isLanIp = /^(?!127\.)\d{1,3}(?:\.\d{1,3}){3}$/.test(requestHost);
        setNetworkInfo({ addresses, port });
        setCustomIp(isLanIp ? requestHost : addresses[0] || '');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setQrError('Enter this device\'s LAN IP address to generate a shareable QR code.');
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!connectUrl) return undefined;

    let cancelled = false;
    QRCode.toDataURL(connectUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#0f172a', light: '#f1f5f9' },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setQrError('');
        }
      })
      .catch((error) => {
        console.error('QR generation failed', error);
        if (!cancelled) {
          setQrDataUrl(null);
          setQrError('Could not create the QR code. Enter the LAN IP and try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectUrl]);

  useEffect(() => {
    let cancelled = false;

    const qrPromise = wifiPayload
      ? QRCode.toDataURL(wifiPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#f1f5f9' },
      })
      : Promise.resolve(null);

    qrPromise.then((dataUrl) => {
      if (!cancelled) setWifiQrDataUrl(dataUrl);
    }).catch(() => {
      if (!cancelled) setWifiQrDataUrl(null);
    });

    return () => {
      cancelled = true;
    };
  }, [wifiPayload]);

  const steps = [
    { step: '1', icon: '📡', title: 'Create a Mobile Hotspot', desc: 'On this device (Raspberry Pi/laptop), enable Wi-Fi hotspot. Name it something recognizable, such as EMERGENCY-NET.' },
    { step: '2', icon: '📱', title: 'Join the Hotspot', desc: 'Survivors and volunteers scan the Wi-Fi QR code above, or join the hotspot manually with its name and password.' },
    { step: '3', icon: '🌐', title: 'Access the Portal', desc: `After joining, scan the portal QR code or open the displayed LAN address on port ${networkInfo.port}.` },
    { step: '4', icon: '✅', title: 'No Internet Needed', desc: 'Everything is served locally. All data stays on this device. Works without internet or cell coverage.' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">📱 Connect to This Network</h1>
        <p className="text-slate-400 text-sm mt-0.5">Join the hotspot, then open the local portal · No internet required</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="shrink-0 bg-slate-100 rounded-xl p-3">
            {wifiQrDataUrl ? (
              // QR data URLs are generated locally and do not need image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wifiQrDataUrl} alt="Wi-Fi connection QR code" className="w-36 h-36 rounded" />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs text-center px-3">
                Enter the hotspot name and password
              </div>
            )}
          </div>
          <div className="w-full">
            <h2 className="font-semibold text-slate-100">1. Join the emergency hotspot</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">This QR code joins the Wi-Fi network. Configure it to exactly match the hotspot running on this device.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">
                Hotspot name (SSID)
                <input
                  className="mt-1.5 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  value={networkName}
                  onChange={e => setNetworkName(e.target.value)}
                />
              </label>
              <label className="text-xs text-slate-400">
                Hotspot password
                <input
                  type="password"
                  className="mt-1.5 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="At least 8 characters"
                  value={networkPassword}
                  onChange={e => setNetworkPassword(e.target.value)}
                />
              </label>
            </div>
            <p className="text-xs text-amber-300 mt-3">Share this code only with people who should be able to join the local emergency network.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* QR Code panel */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col items-center">
          <div className="text-sm font-medium text-slate-400 mb-4">2. Scan to Open Portal</div>
          <div className="bg-slate-100 rounded-xl p-3 mb-4">
            {qrDataUrl ? (
              // QR data URLs are generated locally and do not need image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-sm">
                Finding LAN address…
              </div>
            )}
          </div>
          {connectUrl && (
            <div className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1.5 rounded-lg text-center break-all">
              {connectUrl}
            </div>
          )}
          {qrError && <p className="mt-3 text-xs text-amber-300 text-center">{qrError}</p>}
          <div className="mt-4 w-full">
            <label className="text-xs text-slate-400 block mb-1.5">
              This device&apos;s LAN IP address:
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                placeholder="192.168.43.1"
                value={customIp}
                onChange={e => setCustomIp(e.target.value)}
              />
            </div>
            {networkInfo.addresses.length > 1 && (
              <p className="mt-2 text-xs text-slate-500">
                Other detected addresses: {networkInfo.addresses.filter(address => address !== host).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Network info panel */}
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <div className="text-sm font-semibold text-slate-200 mb-3">📶 Network Details</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Server Port</span>
                <span className="text-slate-200 font-mono">{networkInfo.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Protocol</span>
                <span className="text-slate-200 font-mono">HTTP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode</span>
                <span className="text-green-400 font-medium">✅ Offline / LAN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Internet Required?</span>
                <span className="text-green-400 font-medium">❌ No</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="text-amber-300 font-medium text-sm mb-2">💡 Find Your IP Address</div>
            <div className="text-amber-200/80 text-xs space-y-1.5">
              <div><strong>Windows:</strong> Run <code className="bg-amber-900/30 px-1 rounded">ipconfig</code> in Command Prompt → look for &quot;IPv4 Address&quot;</div>
              <div><strong>Linux/Pi:</strong> Run <code className="bg-amber-900/30 px-1 rounded">hostname -I</code> in terminal</div>
              <div><strong>Typical hotspot IP:</strong> <code className="bg-amber-900/30 px-1 rounded">192.168.43.1</code></div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold text-slate-100 mb-5">🚀 Setup Guide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300 shrink-0">
                {s.step}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200 mb-0.5">{s.icon} {s.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">📋 Quick Hotspot Setup (Windows)</div>
        <div className="space-y-2 text-xs text-slate-300 bg-slate-900 rounded-lg p-3">
          <div><span className="text-slate-500">1.</span> Open <strong>Settings → Network &amp; internet → Mobile hotspot</strong> and turn it on.</div>
          <div><span className="text-slate-500">2.</span> Edit the network name and password, then enter the same values in the Wi-Fi QR card above.</div>
          <div><span className="text-slate-500">3.</span> Start the portal with <code className="text-cyan-300">npm run build &amp;&amp; npm start</code>.</div>
          <div><span className="text-slate-500">4.</span> If Windows asks, allow Node.js to communicate on <strong>Private networks</strong>.</div>
        </div>
      </div>
    </div>
  );
}
