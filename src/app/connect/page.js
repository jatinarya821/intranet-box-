'use client';
import { useEffect, useState, useRef } from 'react';

export default function ConnectPage() {
  const [networkInfo, setNetworkInfo] = useState({ ip: null, port: 3000 });
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [customIp, setCustomIp] = useState('');
  const [loading, setLoading] = useState(false);

  const generateQR = async (url) => {
    setLoading(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#f1f5f9',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error('QR generation failed', e);
    }
    setLoading(false);
  };

  const connectUrl = customIp
    ? `http://${customIp}:${networkInfo.port}`
    : `http://localhost:${networkInfo.port}`;

  useEffect(() => {
    generateQR(connectUrl);
  }, [connectUrl]);

  const steps = [
    { step: '1', icon: '📡', title: 'Create a Mobile Hotspot', desc: 'On this device (Raspberry Pi/laptop), enable Wi-Fi hotspot. Name it something recognizable like "EMERGENCY-NET".' },
    { step: '2', icon: '📱', title: 'Others Scan & Connect', desc: 'Survivors/volunteers use their phone to scan the QR code or manually connect to the hotspot and open a browser.' },
    { step: '3', icon: '🌐', title: 'Access the Portal', desc: `Open a browser and go to http://<this-device-IP>:${networkInfo.port} — all modules work offline!` },
    { step: '4', icon: '✅', title: 'No Internet Needed', desc: 'Everything is served locally. All data stays on this device. Works without internet or cell coverage.' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">📱 Connect to This Network</h1>
        <p className="text-slate-400 text-sm mt-0.5">Share this QR code so others can join · No internet required</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* QR Code panel */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col items-center">
          <div className="text-sm font-medium text-slate-400 mb-4">Scan to Open Portal</div>
          <div className="bg-slate-100 rounded-xl p-3 mb-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-sm">
                {loading ? 'Generating QR…' : 'Enter IP below'}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1.5 rounded-lg text-center break-all">
            {connectUrl}
          </div>
          <div className="mt-4 w-full">
            <label className="text-xs text-slate-400 block mb-1.5">
              Set this device&apos;s IP (from hotspot settings):
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                placeholder="192.168.43.1"
                value={customIp}
                onChange={e => setCustomIp(e.target.value)}
              />
              <button
                onClick={() => generateQR(`http://${customIp}:${networkInfo.port}`)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors shrink-0"
              >
                Update QR
              </button>
            </div>
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
              <div><strong>Windows:</strong> Run <code className="bg-amber-900/30 px-1 rounded">ipconfig</code> in Command Prompt → look for "IPv4 Address"</div>
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
        <div className="space-y-1 text-xs font-mono text-slate-300 bg-slate-900 rounded-lg p-3">
          <div><span className="text-slate-500"># In PowerShell (as Admin):</span></div>
          <div className="text-green-300">netsh wlan set hostednetwork mode=allow ssid=&quot;EMERGENCY-NET&quot; key=&quot;disaster123&quot;</div>
          <div className="text-green-300">netsh wlan start hostednetwork</div>
          <div className="mt-2"><span className="text-slate-500"># Then start this server:</span></div>
          <div className="text-cyan-300">npm run build &amp;&amp; npm start</div>
        </div>
      </div>
    </div>
  );
}
