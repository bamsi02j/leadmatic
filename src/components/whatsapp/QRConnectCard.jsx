import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, RefreshCw, CheckCircle, WifiOff, Loader2 } from "lucide-react";

// Mock QR code data URL using a placeholder pattern
const MOCK_QR = "data:image/svg+xml;base64," + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#111118"/>
  <rect x="10" y="10" width="60" height="60" fill="none" stroke="#7C3AED" stroke-width="4"/>
  <rect x="20" y="20" width="40" height="40" fill="#7C3AED"/>
  <rect x="130" y="10" width="60" height="60" fill="none" stroke="#7C3AED" stroke-width="4"/>
  <rect x="140" y="20" width="40" height="40" fill="#7C3AED"/>
  <rect x="10" y="130" width="60" height="60" fill="none" stroke="#7C3AED" stroke-width="4"/>
  <rect x="20" y="140" width="40" height="40" fill="#7C3AED"/>
  ${Array.from({length: 40}, (_, i) => `<rect x="${20 + (i % 10) * 16}" y="${80 + Math.floor(i / 10) * 16}" width="10" height="10" fill="${Math.random() > 0.5 ? '#7C3AED' : 'none'}"/>`).join('')}
</svg>
`);

export default function QRConnectCard({ session, onRefresh, onConnect }) {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const status = session?.status || "disconnected";

  useEffect(() => {
    if (status === "waiting_qr") {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(60);
    }
  }, [status]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setCountdown(60);
    await onRefresh?.();
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (status === "connected") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-surface p-8 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">WhatsApp Connecté</h3>
        <p className="text-muted-foreground text-sm mb-2">
          Numéro : <span className="text-foreground font-medium">{session?.phone_number || "Inconnu"}</span>
        </p>
        <p className="text-xs text-muted-foreground">Les messages sont synchronisés en temps réel</p>

        <div className="mt-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
          <span className="text-sm text-emerald-400 font-medium">Session active</span>
        </div>

        <button
          onClick={handleRefresh}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <WifiOff className="w-3 h-3" />
          Déconnecter
        </button>
      </motion.div>
    );
  }

  if (status === "waiting_qr") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-surface p-8 flex flex-col items-center text-center"
      >
        <h3 className="text-xl font-bold text-foreground mb-2">Scanner le QR Code</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Ouvrez WhatsApp sur votre téléphone → Menu → Appareils connectés → Connecter un appareil
        </p>

        <div className="relative">
          <motion.div
            className="w-52 h-52 rounded-2xl overflow-hidden animated-border border-2 border-primary/50 p-2"
            animate={{ borderColor: ["rgba(124,58,237,0.3)", "rgba(124,58,237,0.8)", "rgba(124,58,237,0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <img src={MOCK_QR} alt="QR Code" className="w-full h-full object-contain rounded-xl" />
          </motion.div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">
            {countdown}s
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-foreground transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-surface p-8 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 rounded-full bg-white/8 flex items-center justify-center mb-5">
        <Smartphone className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Connecter WhatsApp</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Connectez votre compte WhatsApp pour synchroniser vos messages et gérer vos leads automatiquement.
      </p>

      <button
        onClick={() => { onConnect?.(); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000); }}
        disabled={isLoading}
        className="gradient-violet glow-violet text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
        Connecter WhatsApp
      </button>
    </motion.div>
  );
}