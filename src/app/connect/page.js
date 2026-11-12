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

export default function ConnectPage() {
  const [networkInfo, setNetworkInfo] = useState({ addresses: [], port: 3000 });
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [customIp, setCustomIp] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [wifiQrDataUrl, setWifiQrDataUrl] = useState(null);
  const [wifiStatus, setWifiStatus] = useState('Loading hotspot details…');
  const [qrError, setQrError] = useState('');
  const [addressWarning, setAddressWarning] = useState('');

  const host = normaliseHost(customIp);
  const connectUrl = host ? `http://${host}:${networkInfo.port}` : '';

  useEffect(() => {
    const controller = new AbortController();

    const networkRequest = fetch('/api/network', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Network information unavailable'))));
    const settingsRequest = fetch('/api/settings', { signal: controller.signal, cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Settings unavailable'))));

    Promise.all([networkRequest, settingsRequest])
      .then(([{ addresses, port }, settings]) => {
        const browserHost = window.location.hostname;
        const configuredIp = (settings.hotspot_ip || '').trim();
        setNetworkInfo({ addresses, port });
        setNetworkName(settings.hotspot_ssid || '');
        setCustomIp(configuredIp || (addresses.includes(browserHost) ? browserHost : addresses[0] || ''));
        if (configuredIp && !addresses.includes(configuredIp)) {
          setAddressWarning('The saved portal IP was not found on this device. Check the hotspot address in Camp Settings before sharing this QR code.');
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setQrError('Could not load the portal address. Ask an administrator to check the network settings.');
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
          setQrError('Could not create the QR code. Ask an administrator to check the network settings.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectUrl]);

  useEffect(() => {
    const controller = new AbortController();
    const refreshWifi = () => fetch('/api/wifi-qr', { signal: controller.signal, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load QR code');
        return response.json();
      })
      .then((data) => {
        setWifiQrDataUrl(data.image || null);
        if (data.ssid) setNetworkName(data.ssid);
        setWifiStatus(data.configured ? '' : 'An administrator needs to set up the hotspot QR code.');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setWifiStatus('Could not load the hotspot QR code.');
      });
    refreshWifi();
    const interval = setInterval(refreshWifi, 10000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  const steps = [
    { step: '1', icon: '📡', title: 'Create a Mobile Hotspot', desc: 'On this device (Raspberry Pi/laptop), enable Wi-Fi hotspot. Name it something recognizable, such as EMERGENCY-NET.' },
    { step: '2', icon: '📱', title: 'Join the Hotspot', desc: 'Survivors and volunteers scan the Wi-Fi QR code above, or join the hotspot manually with its name and password.' },
    { step: '3', icon: '🌐', title: 'Access the Portal', desc: `After joining, scan the portal QR code or open the displayed LAN address on port ${networkInfo.port}.` },
    { step: '4', icon: '✅', title: 'No Internet Needed', desc: 'Everything is served locally. All data stays on this device. Works without internet or cell coverage.' },
  ];

  return (
    <div className="max-w-3xl mx-auto min-w-0 w-full">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">📱 Connect to This Network</h1>
        <p className="text-slate-400 text-sm mt-0.5">Join the hotspot, then open the local portal · No internet required</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="shrink-0 bg-slate-100 rounded-xl p-3">
            {wifiQrDataUrl ? (
              // QR data URLs are generated locally and do not need image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wifiQrDataUrl} alt="Wi-Fi connection QR code" className="w-28 h-28 sm:w-36 sm:h-36 rounded" />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center text-slate-400 text-xs text-center px-3">
                {wifiStatus}
              </div>
            )}
          </div>
          <div className="w-full">
            <h2 className="font-semibold text-slate-100">1. Join the emergency hotspot</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">Scan this code to join the Wi-Fi network configured by the administrator.</p>
            {networkName && <p className="text-sm text-slate-200">Hotspot: <strong>{networkName}</strong></p>}
            <p className="text-xs text-amber-300 mt-3">Share this code only with people who should be able to join the local emergency network.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* QR Code panel */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col items-center">
          <div className="text-sm font-medium text-slate-400 mb-2">2. Scan to Open Portal</div>
          <p className="mb-4 text-center text-xs text-slate-400">First join the hotspot, then scan this code or type the address below into a browser.</p>
          <div className="bg-slate-100 rounded-xl p-3 mb-4">
            {qrDataUrl ? (
              // QR data URLs are generated locally and do not need image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR Code" className="w-36 h-36 sm:w-48 sm:h-48 rounded" />
            ) : (
              <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center text-slate-400 text-sm">
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
          {addressWarning && <p className="mt-3 text-xs text-amber-300 text-center" role="status">{addressWarning}</p>}
          <p className="mt-4 text-xs text-slate-400">The administrator can change the portal address in Camp Settings.</p>
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
          <div><span className="text-slate-500">2.</span> An administrator enters the same hotspot name and password in Camp Settings.</div>
          <div><span className="text-slate-500">3.</span> Start the portal with <code className="text-cyan-300">npm run build &amp;&amp; npm start</code>.</div>
          <div><span className="text-slate-500">4.</span> If Windows asks, allow Node.js to communicate on <strong>Private networks</strong>.</div>
        </div>
      </div>
    </div>
  );
}
