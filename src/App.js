import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Minus, Plus, Image as ImageIcon, Video, Check,
  Sparkles,
  X, Monitor,
  Zap, CheckCircle2,
  Grid, DownloadCloud, FileImage,
  ShieldCheck, Cpu, Activity, Target, Lock, ServerOff, HelpCircle as HelpIcon, Info, MessageCircleQuestion, FileQuestion, ZoomIn, Maximize,
  Download, Eye, Shield, Github, Settings, ChevronRight, Loader2, Menu, Trash2, RefreshCcw, Archive, Layers, Smartphone, Wand2, AlertTriangle, Cookie, Scale, MousePointerClick, ListChecks, Scissors, Files, Move
} from 'lucide-react';

// --- ICONS (Custom) ---
const DownloadIcon = ({ size = 24, strokeWidth = 2.5, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

// --- ANIMATION WRAPPER COMPONENT (Sadece Editör İçin Kaldı) ---
const FadeInSection = ({ children, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className={`${className} transition-all duration-700 ease-out transform ${isVisible ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md'}`}>
      {children}
    </div>
  );
};

// --- CUSTOM HOOK FOR MODAL TRANSITIONS ---
const useModalTransition = (isOpen, duration = 300) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // GÜNCELLEME: setTimeout ile küçük bir gecikme (50ms) ekleyerek 
      // tarayıcının DOM'u render etmesine ve başlangıç stilini (opacity-0) 
      // algılamasına fırsat veriyoruz. Bu sayede açılış animasyonu tetikleniyor.
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  return { isRendered, isVisible };
};

// --- CONSTANTS ---
const SPLITTER_STATUS_MSGS = [
  "Medya verisi tuvale işleniyor...",
  "Dikey segmentasyon sınırları kilitleniyor...",
  "HD Piksel pürüzsüzleştirme aktif...",
  "Parçalar yüksek çözünürlükte paketleniyor."
];

const DEFAULT_SETTINGS = {
  splitCount: 4,
  downloadFormat: 'png',
  autoEnhance: false,
  hdMode: false,
  optimizeMode: false,
  smartCrop: false,
  ultraHdMode: false
};

const FEATURE_DETAILS = {
  aiEnhance: {
    title: "AI ENHANCE",
    icon: Sparkles,
    color: "text-pink-500",
    shortDesc: "Renkleri ve kontrastı otomatik canlandırır.",
    desc: "Yapay zeka algoritmaları fotoğrafın renk dengesini, doygunluğunu ve kontrastını analiz eder. Soluk renkleri canlandırır ve profesyonel bir görünüm kazandırır."
  },
  hdMode: {
    title: "HD KALİTE",
    icon: Cpu,
    color: "text-blue-400",
    shortDesc: "Kenar tırtıklarını giderir ve netleştirir.",
    desc: "Çıktı alma sürecinde gelişmiş pikselleri yumuşatarak kenar tırtıklarını giderir. Instagram'ın sıkıştırma algoritmasına karşı görüntüyü netleştirir."
  },
  optimize: {
    title: "OPTIMIZE",
    icon: Activity,
    color: "text-green-400",
    shortDesc: "Kaliteyi koruyarak dosya boyutunu düşürür.",
    desc: "Görselin kalitesini gözle görülür şekilde düşürmeden dosya boyutunu %30-40 oranında sıkıştırır. Instagram hikaye ve gönderileri için ideal yükleme hızı sağlar."
  },
  smartCrop: {
    title: "SMART CROP",
    icon: Target,
    color: "text-purple-400",
    shortDesc: "Gereksiz kenar boşluklarını temizler.",
    desc: "Fotoğrafın kenarlarındaki gereksiz veya boş alanları analiz eder ve %5 oranında 'Safe Zoom' yaparak ana objeyi merkeze odaklar."
  },
  ultraHd: {
    title: "ULTRA HD İNDİR",
    icon: Zap,
    color: "text-yellow-400",
    shortDesc: "Çözünürlüğü yapay zeka ile 2 katına çıkarır.",
    desc: "Super-Resolution (Süper Çözünürlük) teknolojisi kullanır. Mevcut görseli sanal olarak genişletip eksik pikselleri tamamlayarak çözünürlüğü 2 katına (2x Upscale) çıkarır."
  }
};

// --- SUB-COMPONENTS ---

const FeatureToggle = ({ featureKey, state, onToggle, onInfo }) => {
  const details = FEATURE_DETAILS[featureKey];
  const Icon = details.icon;

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => onToggle(featureKey, !state)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon size={16} className={details.color} />
          <span className="text-[12px] font-black text-white uppercase tracking-tight">{details.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onInfo(details); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/10 rounded-full hover:bg-white/20 text-gray-400 hover:text-white"
            title="Detaylı Bilgi"
            aria-label={`${details.title} Hakkında Bilgi`}
          >
            <Info size={10} />
          </button>
        </div>
        <div className={`w-9 h-5 rounded-full transition-all relative ${state ? details.color.replace('text-', 'bg-') : 'bg-white/10'}`}>
          <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${state ? 'right-1 bg-black' : 'left-1 bg-white/30'}`} />
        </div>
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase mt-1.5 opacity-80">{details.shortDesc}</p>
    </div>
  );
};

const FeatureInfoModal = ({ info, onClose }) => {
  const { isRendered, isVisible } = useModalTransition(!!info);
  if (!isRendered || !info) return null;
  const Icon = info.icon;

  return (
    <div
      className={`fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`bg-[#1a1a1a] border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-xl bg-white/5 ${info.color}`}><Icon size={24} /></div><h3 className="text-lg font-black text-white uppercase">{info.title}</h3></div>
        <p className="text-sm text-gray-300 leading-relaxed">{info.desc}</p>
        <button onClick={onClose} className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors">Tamam</button>
      </div>
    </div>
  );
};

const PrivacyModal = ({ isOpen, onClose }) => {
  const { isRendered, isVisible } = useModalTransition(isOpen);
  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-3xl w-full p-6 md:p-10 relative shadow-2xl my-auto transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="p-3 bg-green-500/10 rounded-2xl animate-pulse"><ShieldCheck size={32} className="text-green-500" /></div>
          <div><h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Güvenlik ve Gizlilik Protokolü</h2><p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Son Güncelleme: 11.01.2026 • Sürüm 4.0 (Secure Build)</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Lock size={18} className="text-blue-400" /><span className="uppercase tracking-tight text-xs">İstemci Taraflı İşleme</span></h3><p className="text-gray-400 leading-relaxed text-xs">Dump Splitter, dosyalarınızı <strong>uzak bir sunucuya (Cloud) yüklemez.</strong> Tüm işlemler tarayıcınızın belleğinde (HTML5 Canvas) gerçekleşir. Verileriniz cihazınızdan asla dışarı çıkmaz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><ServerOff size={18} className="text-red-400" /><span className="uppercase tracking-tight text-xs">Sunucu Kaydı Yoktur</span></h3><p className="text-gray-400 leading-relaxed text-xs">Uygulama sunucusuz çalışır. Fotoğraflarınız loglanmaz veya kaydedilmez. Sayfayı yenilediğinizde (F5), tüm geçici veriler RAM'den silinir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Eye size={18} className="text-purple-400" /><span className="uppercase tracking-tight text-xs">AI Modeli Eğitilmez</span></h3><p className="text-gray-400 leading-relaxed text-xs">Kullanılan algoritmalar yereldir. Görselleriniz, herhangi bir yapay zeka modelini eğitmek veya yüz taraması yapmak amacıyla <strong>kullanılmaz.</strong></p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Shield size={18} className="text-yellow-400" /><span className="uppercase tracking-tight text-xs">Sıfır İz Politikası</span></h3><p className="text-gray-400 leading-relaxed text-xs">Kişisel verileriniz, IP adresiniz veya kullanım alışkanlıklarınız hiçbir üçüncü taraf ile paylaşılmaz. Uygulama tamamen anonimdir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors md:col-span-2"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Cookie size={18} className="text-amber-500" /><span className="uppercase tracking-tight text-xs">Çerez (Cookie) Kullanımı</span></h3><p className="text-gray-400 leading-relaxed text-xs">Sitemizde sizi takip eden hiçbir çerez (cookie) veya reklam izleyicisi bulunmamaktadır. Tarayıcınızda sadece siteyi çalıştırmak için gerekli olan yerel veriler tutulur.</p></div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4 text-center">
          <a href="https://github.com/irmaakq/Dump-Splitter" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-2xl border border-white/10 transition-all group w-full md:w-auto justify-center">
            <Github size={20} className="text-white group-hover:scale-110 transition-transform" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-white font-bold uppercase tracking-wide">Kaynak Kodları İncele</span>
              <span className="text-[10px] text-gray-500 font-medium">GitHub üzerinden erişilebilir</span>
            </div>
            <ChevronRight size={16} className="text-gray-600 ml-2 group-hover:text-white transition-colors" />
          </a>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest max-w-md">Şeffaflık politikamız gereği bu projenin tüm kodları açık kaynaklıdır. <br className="hidden md:block" />KVKK ve GDPR standartlarına uygun olarak tasarlanmıştır.</p>
          <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">Güvenlik Protokollerini Onayla ve Devam Et</button>
        </div>
      </div>
    </div>
  );
};

const HowToModal = ({ isOpen, onClose }) => {
  const { isRendered, isVisible } = useModalTransition(isOpen);
  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-[#0f0f0f] border border-white/10 rounded-[40px] max-w-lg w-full p-8 md:p-10 relative shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full" aria-label="Kapat"><X size={24} /></button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
            <HelpIcon size={32} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">KULLANIM REHBERİ</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">PROFESYONEL BİR DUMP NASIL OLUŞTURULUR?</p>
        </div>

        <div className="space-y-8 relative px-2">
          {/* Timeline Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-20 rounded-full hidden md:block"></div>

          {/* STEP 1 */}
          <div className="relative flex flex-col md:flex-row items-start gap-6 group">
            <div className="relative z-10 w-14 h-14 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:border-blue-500/50 group-hover:scale-110 transition-all shrink-0">
              <span className="text-blue-400 font-black text-xl">1</span>
            </div>
            <div className="flex-1 bg-white/[0.03] p-5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Upload size={18} className="text-blue-400" />
                <h3 className="text-white font-black text-sm uppercase tracking-wide">Medyayı Yükle</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Yüksek çözünürlüklü fotoğraf veya videonuzu yükleyin. Sürükle-bırak yapabilir veya dosya seçiciyi kullanabilirsiniz.
                <span className="block mt-2 text-blue-400/80 font-bold text-[10px] uppercase">İPUCU: Panoramik, yatay veya dikey 'Dump' fotoğraflarınızda harika sonuçlar verir. Format fark etmeksizin her türlü görseli bölebilirsiniz.</span>
              </p>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative flex flex-col md:flex-row items-start gap-6 group">
            <div className="relative z-10 w-14 h-14 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:border-purple-500/50 group-hover:scale-110 transition-all shrink-0">
              <span className="text-purple-400 font-black text-xl">2</span>
            </div>
            <div className="flex-1 bg-white/[0.03] p-5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Settings size={18} className="text-purple-400" />
                <h3 className="text-white font-black text-sm uppercase tracking-wide">Düzenle & Ayarla</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-3">
                Sol menüden parça sayısını (1-10) seçin. Formatı (PNG/JPG) belirleyin.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/20 p-2 rounded-lg border border-white/5 text-[10px] text-gray-400"><span className="text-purple-400 font-bold">Smart Crop:</span> Kenar boşluklarını temizler.</div>
                <div className="bg-black/20 p-2 rounded-lg border border-white/5 text-[10px] text-gray-400"><span className="text-green-400 font-bold">Optimize:</span> Instagram için boyutu küçültür.</div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="relative flex flex-col md:flex-row items-start gap-6 group">
            <div className="relative z-10 w-14 h-14 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:border-pink-500/50 group-hover:scale-110 transition-all shrink-0">
              <span className="text-pink-400 font-black text-xl">3</span>
            </div>
            <div className="flex-1 bg-white/[0.03] p-5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Wand2 size={18} className="text-pink-400" />
                <h3 className="text-white font-black text-sm uppercase tracking-wide">Kaliteyi Artır (AI)</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Eğer fotoğrafınız soluksa veya düşük kaliteliyse bu modları açın:
              </p>
              <ul className="mt-2 space-y-1 text-[10px] text-gray-500 font-medium">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-pink-500 rounded-full"></div> <strong>AI Enhance:</strong> Renkleri canlandırır.</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> <strong>HD Kalite:</strong> Pikselleri yumuşatır.</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-yellow-500 rounded-full"></div> <strong>Ultra HD:</strong> Çözünürlüğü 2 katına çıkarır.</li>
              </ul>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="relative flex flex-col md:flex-row items-start gap-6 group">
            <div className="relative z-10 w-14 h-14 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:border-green-500/50 group-hover:scale-110 transition-all shrink-0">
              <span className="text-green-400 font-black text-xl">4</span>
            </div>
            <div className="flex-1 bg-white/[0.03] p-5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <DownloadCloud size={18} className="text-green-400" />
                <h3 className="text-white font-black text-sm uppercase tracking-wide">İndir ve Paylaş</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Tüm parçaları tek seferde <strong>ZIP</strong> olarak indirebilir veya resimlerin üzerine tıklayarak tek tek kaydedebilirsiniz. Artık Instagram'da paylaşmaya hazır!
              </p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-xl mt-10 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95">Anladım, Başlayalım</button>
      </div>
    </div>
  );
};

const AboutModal = ({ isOpen, onClose }) => {
  const { isRendered, isVisible } = useModalTransition(isOpen);
  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-4xl w-full p-8 md:p-10 relative shadow-2xl overflow-y-auto max-h-[90vh] transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" aria-label="Kapat"><X size={24} /></button>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <span className="font-black italic text-3xl tracking-tighter">D</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-2">DUMP SPLITTER</h2>
          <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-[0.2em]">Instagram İçin Profesyonel Dump Bölme Aracı</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers size={24} />
            </div>
            <h3 className="text-white font-black text-lg uppercase tracking-wide mb-2">Profesyonel Dump Bölme</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Bu sitenin asıl amacı, fotoğraflarınızı Instagram 'Dump' formatına uygun şekilde, kalite kaybı olmadan parçalara ayırmaktır. Dikey veya yatay fark etmez.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="text-white font-black text-lg uppercase tracking-wide mb-2">Yapay Zeka Destekli</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Sadece kesmekle kalmaz; soluk renkleri canlandırır (AI Enhance), düşük çözünürlüğü yükseltir (Ultra HD) ve sıkıştırma kaybını önler.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-white font-black text-lg uppercase tracking-wide mb-2">Gizlilik Odaklı</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Fotoğraflarınız asla sunucuya yüklenmez. Tüm işlemler tarayıcınızın içinde (Client-Side) gerçekleşir. %100 güvenli ve anonimdir.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video size={24} />
            </div>
            <h3 className="text-white font-black text-lg uppercase tracking-wide mb-2">Video Desteği</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Sadece fotoğraf değil, videoları da yükleyebilirsiniz. Videonuzun o anki karesini yüksek kalitede yakalar ve parçalara ayırır.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Açık Kaynak & Ücretsiz
          </div>
          <p className="text-[10px] text-gray-600 max-w-md mx-auto">
            Bu proje, topluluk için geliştirilmiş, kar amacı gütmeyen açık kaynaklı bir yazılımdır.
          </p>
        </div>
        <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-xl mt-8 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] active:scale-95">Harika, Başlayalım!</button>
      </div>
    </div>
  );
};

const FAQModal = ({ isOpen, onClose }) => {
  const { isRendered, isVisible } = useModalTransition(isOpen);
  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-3xl w-full p-8 relative shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" aria-label="Kapat"><X size={24} /></button>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 text-center flex items-center justify-center gap-3"><MessageCircleQuestion size={28} className="text-blue-400" /> Sıkça Sorulan Sorular</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><FileQuestion size={14} className="text-yellow-400" /> Video yükleyebilir miyim?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, video dosyalarını (MP4, MOV vb.) sisteme yükleyebilirsiniz. Ancak sistem videoları parça parça kesip video olarak vermez. Videonun o anki karesini <strong>yüksek kaliteli bir fotoğraf</strong> olarak yakalar ve bunu parçalara ayırır.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Lock size={14} className="text-green-400" /> Fotoğraflarım güvende mi?</h3><p className="text-gray-400 text-xs leading-relaxed">Kesinlikle. Sitemiz "Client-Side" (İstemci Taraflı) çalışır. Yüklediğiniz dosyalar sunucuya gönderilmez, sadece tarayıcınızın geçici hafızasında (RAM) işlenir. Sayfayı kapattığınız an her şey silinir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Monitor size={14} className="text-purple-400" /> Hangi cihazlarda çalışır?</h3><p className="text-gray-400 text-xs leading-relaxed">Dump Splitter; iPhone, Android, Tablet ve Bilgisayar (PC/Mac) tarayıcılarında sorunsuz çalışır. Herhangi bir uygulama indirmenize gerek yoktur.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Check size={14} className="text-blue-400" /> Ücretli mi, Sınır var mı?</h3><p className="text-gray-400 text-xs leading-relaxed">Tamamen ücretsizdir. Üyelik veya kredi sistemi yoktur. Performansın düşmemesi için aynı anda en fazla 20 dosya yükleyebilirsiniz ancak işlem bitince listeyi temizleyip tekrar yükleyebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ImageIcon size={14} className="text-pink-400" /> Hangi formatlar destekleniyor?</h3><p className="text-gray-400 text-xs leading-relaxed">Giriş olarak JPG, PNG, WEBP, HEIC (tarayıcı desteğine göre) ve popüler video formatlarını kabul eder. Çıktı olarak PNG, JPG veya WEBP formatında indirebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Download size={14} className="text-orange-400" /> İndirme çalışmıyor?</h3><p className="text-gray-400 text-xs leading-relaxed">Eğer indirme başlamazsa tarayıcınızın "Pop-up engelleyicisini" kontrol edin veya sayfayı yenileyip (F5) tekrar deneyin. Tek tek indirmek için parçanın üzerindeki ok işaretine basmanız yeterlidir.</p></div>

          {/* YENİ EKLENEN SORULAR */}
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /> AI Enhance renkleri bozar mı?</h3><p className="text-gray-400 text-xs leading-relaxed">Hayır, yapay zeka fotoğrafın doğal yapısını bozmadan sadece soluk renkleri, kontrastı ve doygunluğu optimize eder. Aşırı filtreli bir görünüm yerine profesyonel ve canlı bir sonuç verir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><DownloadCloud size={14} className="text-sky-400" /> Uygulamayı telefonuma indirebilir miyim?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet! Dump Splitter bir PWA (Progressive Web App) uygulamasıdır. Tarayıcınızın menüsünden (Safari'de "Paylaş" &rarr; "Ana Ekrana Ekle", Chrome'da "Uygulamayı Yükle") diyerek telefonunuza uygulama gibi kurabilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Target size={14} className="text-rose-400" /> Smart Crop fotoğrafımı keser mi?</h3><p className="text-gray-400 text-xs leading-relaxed">Smart Crop, fotoğrafın sadece en dışındaki %2'lik "ölü alanı" temizler. Bu işlem, ana objeyi merkeze daha iyi odaklamak ve Instagram'da daha profesyonel bir çerçeveleme sağlamak için yapılır.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Zap size={14} className="text-teal-400" /> Ultra HD modunda dosya boyutu artar mı?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, Ultra HD modu fotoğrafın çözünürlüğünü 2 katına çıkardığı (Upscale) için dosya boyutu artabilir. Ancak bu, Instagram'ın sıkıştırma algoritmasına karşı fotoğrafınızın netliğini korumasını sağlar.</p></div>

          {/* KULLANICI İSTEĞİ İLE EKLENEN YENİ SORULAR - GÜNCELLENMİŞ VERSİYON */}
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Menu size={14} className="text-indigo-400" /> ANA MENÜYE NASIL GİDİLİR?</h3><p className="text-gray-400 text-xs leading-relaxed">Sol üst köşedeki "D" logosuna veya "Dump Splitter" yazısına tıklayarak istediğiniz zaman ana başlangıç ekranına dönebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><RefreshCcw size={14} className="text-red-400" /> YENİ YÜKLEME NEDİR?</h3><p className="text-gray-400 text-xs leading-relaxed">"Yeni Yükleme" butonu, mevcut çalışma alanını tamamen temizler. Listede 20/20 fotoğraf olsa bile hepsi silinir ve sıfırdan başlamanızı sağlar.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Archive size={14} className="text-amber-400" /> TOPLU İNDİR BASINCA NEDEN BAZI İMAGELER İNMİYOR?</h3><p className="text-gray-400 text-xs leading-relaxed">Bazı dosya türleri toplu indirme (ZIP) sırasında teknik nedenlerle atlanabilir. Eğer bir fotoğraf inmezse, sol taraftaki listeden o fotoğrafın üzerine tıklayıp tekrar 'TÜMÜNÜ İNDİR' butonuna basabilir veya parçanın üzerindeki tekli indirme butonunu kullanarak indirebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Settings size={14} className="text-lime-400" /> EDİTÖRDEKİ ÖZELLİKLER (AI, HD, OPTIMIZE) NE İŞE YARAR?</h3><p className="text-gray-400 text-xs leading-relaxed">Bu özellikler fotoğrafınızı geliştirmenizi sağlar: <strong>AI Enhance</strong> renkleri canlandırır, <strong>HD Mode</strong> netliği artırır, <strong>Optimize</strong> boyutu küçültür, <strong>Smart Crop</strong> kadrajı düzeltir ve <strong>Ultra HD</strong> çözünürlüğü yükseltir. Her özelliğin yanındaki bilgi butonuna basarak daha detaylı açıklama görebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Grid size={14} className="text-violet-400" /> NEDEN 3 SÜTUN (YAN YANA 3) YERİNE HEP 2 SÜTUN BÖLÜYOR?</h3><p className="text-gray-400 text-xs leading-relaxed">Instagram'da en iyi görünüm için 2 sütunlu yapı standarttır. Eğer 3 sütun (yan yana 3 parça) yapılsaydı, her bir parça "kürdan gibi" ince ve dar olurdu. Bu da fotoğrafın anlaşılmaz görünmesine neden olur. Bu yüzden sistem, görsel kalitesini korumak için 3 yerine 2 sütunlu (daha geniş parçalı) düzeni kullanır.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Activity size={14} className="text-cyan-400" /> HD & OPTIMIZE AÇINCA NEDEN FARK GÖREMİYORUM?</h3><p className="text-gray-400 text-xs leading-relaxed">Bu özellikler filtre değil, teknik kalite ayarlarıdır. <strong>HD Mode</strong> sıkıştırmayı kapatır (%100 Kalite), <strong>Optimize</strong> ise boyutu küçültür. Gözle görülür bir değişim (renk, netlik) istiyorsanız <strong>AI Enhance</strong> özelliğini açmalısınız.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /> HATA RAPORU NEDİR?</h3><p className="text-gray-400 text-xs leading-relaxed">Eğer indirme sırasında teknik bir sorun (hafıza dolması vb.) oluşursa, size bozuk dosya vermek yerine <strong>Hata_Raporu.txt</strong> dosyası verilir. Bu dosyayı açarak sorunun nedenini ve 'Tekrar Dene', 'Tekli İndir' gibi çözüm yollarını Türkçe olarak okuyabilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Smartphone size={14} className="text-emerald-400" /> İNDİRİLEN DOSYALAR NEREYE KAYDEDİLİYOR?</h3><p className="text-gray-400 text-xs leading-relaxed"><strong>iPhone (iOS):</strong> İndirilenler 'Fotoğraflar'a değil, mavi renkli <strong>'Dosyalar'</strong> uygulamasına kaydedilir. <strong>Android:</strong> Direkt 'Galeri' veya 'İndirilenler' klasörüne iner. Bildirim panelinden hemen ulaşabilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Scale size={14} className="text-gray-300" /> HİÇBİR AYAR SEÇMEZSEM KALİTE DÜŞER Mİ?</h3><p className="text-gray-400 text-xs leading-relaxed">Asla. Varsayılan mod, fotoğrafınızı "Dengeli ve Sağlıklı" bir kalitede (%95) ve orijinal çözünürlüğünde işler. Fotoğrafınız bozulmaz veya pikselleşmez. Ekstra ayarlar (HD, AI vb.) sadece özel iyileştirmeler içindir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointerClick size={14} className="text-stone-400" /> TEKLİ VEYA TOPLU İNDİRME ARASINDA KALİTE FARKI VAR MI?</h3><p className="text-gray-400 text-xs leading-relaxed">Hayır, hiçbir fark yoktur. İster tek tek indirin, ister 'Tümünü İndir' butonunu kullanın; sistem aynı işlem motorunu kullanır. Kalite, çözünürlük veya renklerde asla bir kayıp yaşanmaz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ListChecks size={14} className="text-lime-300" /> HER FOTOĞRAFA FARKLI AYAR YAPARSAM KORUNUR MU?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, kesinlikle. 20 fotoğraf yükleyip her birine farklı ayar (birine HD, diğerine 3 parça vb.) yapabilirsiniz. 'Tümünü İndir' dediğinizde sistem sırayla her fotoğrafı kendi özel ayarıyla işleyip indirir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Scissors size={14} className="text-rose-300" /> EN İYİ SONUCU ALMAK İÇİN KAÇA BÖLMELİYİM?</h3><p className="text-gray-400 text-xs leading-relaxed">Altın kural: Fotoğrafınızın doğal yapısına (yani içindeki kare sayısına) göre bölün. Örneğin 4 kareli bir Dump fotoğrafınız varsa, en sağlıklı sonuç için 4 parçaya bölün. Eğer 4 kareli fotoğrafı 10'a bölerseniz, parçalar anlamsız ve çok küçük olur.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Files size={14} className="text-indigo-300" /> TOPLU İNDİR İLE TÜMÜNÜ İNDİR ARASINDA FARK VAR MI?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, kapsam farkı vardır. <strong>"Tümünü İndir"</strong> butonu sadece o an ekranda gördüğünüz 1 fotoğrafın parçalarını indirir. <strong>"Toplu İndir"</strong> ise sol listedeki 10-20 fotoğrafın tamamını, her biri ayrı klasör olacak şekilde tek bir paket (ZIP) halinde indirir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><RefreshCcw size={14} className="text-orange-400" /> NEDEN UYGULAMADAN ÇIKINCA VEYA YENİLEYİNCE HER ŞEY SİLİNİYOR?</h3><p className="text-gray-400 text-xs leading-relaxed">Bu bir hata değil, güvenlik tercihidir. Fotoğraflarınız sadece geçici hafızada (RAM) tutulur. Sayfayı yenilediğinizde veya uygulamayı <strong>tamamen kapattığınızda</strong> her şey silinir. Ancak; <strong>uygulamayı kapatmadan</strong> sadece ana ekrana dönerseniz veya başka bir uygulamaya/sekmeye geçip geri dönerseniz <strong>resimleriniz gitmez</strong>, kaldığınız yerden devam edebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Trash2 size={14} className="text-red-400" /> YENİDEN BÖL, SİL VE SIFIRLA NE İŞE YARAR?</h3><p className="text-gray-400 text-xs leading-relaxed"><strong>Yeniden Böl:</strong> Mevcut ayarlarla işlemi tekrar başlatır. Olası bir takılma durumunda (bug) sayfayı yenilemeden düzeltmenizi sağlar.<br /><strong>Sil:</strong> Sadece o an seçili olan fotoğrafı siler.<br /><strong>Sıfırla:</strong> Seçili fotoğraf hariç, listedeki diğer tüm fotoğrafları temizler.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Layers size={14} className="text-blue-400" /> YAN TARAFTAKİ 1/20 VE (+) İKONU NE İŞE YARAR?</h3><p className="text-gray-400 text-xs leading-relaxed"><strong>1/20:</strong> Sol taraftaki menüde, şu an kaç fotoğraf yüklü olduğunu ve kotanızı gösterir (En fazla 20).<br /><strong>(+) İkonu:</strong> Mevcut listenizi silmeden, üzerine yeni fotoğraflar eklemenizi sağlar. Böylece tek seferde birden çok albümü birleştirip toplu işlem yapabilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Grid size={14} className="text-violet-400" /> PARÇA SAYISI (3, 4, 6, 9) NEDEN FARKLI BÖLÜNÜYOR?</h3><p className="text-gray-400 text-xs leading-relaxed"><strong>Çift Sayılar (4, 6, 8, 10):</strong> Sistem bunları 'Izgara' mantığıyla 2 sütuna böler. Bu yüzden parçalar dikey ve karemsi görünür.<br /><strong>Tek Sayılar (3, 5, 7, 9):</strong> 2'ye tam bölünemedikleri için 'Şerit' mantığıyla tek sütuna (alt alta) böler. Bu yüzden parçalar yatay ve ince görünür. Bu normal bir durumdur.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><FileImage size={14} className="text-yellow-500" /> HANGİ FORMATI (JPG, PNG, WEBP) SEÇMELİYİM?</h3><p className="text-gray-400 text-xs leading-relaxed"><strong>JPG:</strong> En yaygın format. Paylaşım için ideal ve dengelidir.<br /><strong>PNG:</strong> Kayıpsız kalitedir. Keskinlik çok önemlidir ama dosya boyutu yüksek olabilir.<br /><strong>WEBP:</strong> Hem yüksek kalite hem de düşük boyut sunan yeni nesil formattır. Instagram destekler.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Github size={14} className="text-white" /> BU SİTE AÇIK KAYNAK KODLU MU?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, Dump Splitter %100 Açık Kaynaklıdır (Open Source). Kodlarımızı şeffaf bir şekilde GitHub üzerinde inceleyebilir, geliştirebilir veya güvenliğini kendiniz test edebilirsiniz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-green-500" /> BU SİTE LİSANSLI MI?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, bu proje <strong>GNU Genel Kamu Lisansı v2.0 (GPLv2)</strong> ile korunmaktadır. Bu lisans, yazılımın özgürce kullanılmasına, dağıtılmasına ve değiştirilmesine izin verirken, özgürlüğünün korunmasını da garanti altına alır.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Move size={14} className="text-purple-400" /> ALTTAKİ SİYAH ÇUBUK (BAR) NEDİR? (+), (-) VE İKONLAR NE YAPAR?</h3><p className="text-gray-400 text-xs leading-relaxed">Bu <strong>Kontrol Paneli</strong> size şunları sunar:<br /><strong>Çözünürlük (Örn: 1080x1920):</strong> Fotoğrafınızın o anki çıkış boyutunu gösterir.<br /><strong>(- / +) ve %:</strong> Ekranda fotoğrafı <strong>yakınlaştırıp uzaklaştırmanızı</strong> sağlar. Bu sadece görünümü değiştirir, fotoğrafın boyutunu bozmaz.<br /><strong>Kare İkon:</strong> Yakınlaştırmayı sıfırlar (%100 yapar).<br /><strong>Hareket:</strong> Paneli sağa-sola sürükleyebilirsiniz. Kullanım kolaylığı için alt kısıma sabitlenmiştir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Files size={14} className="text-indigo-400" /> TOPLU FOTOĞRAF VİDEO YÜKLEYEBİLİR / SÜRÜKLEYEBİLİR MİYİM?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet! İsterseniz 'Dosya Yükle' butonuna basıp galerinizden birden fazla fotoğrafı aynı anda seçebilir, isterseniz de bilgisayardan klasördeki fotoğrafları tutup topluca ekranın içine sürükleyebilirsiniz (Drag & Drop). Sistem hepsini sıraya dizecektir. (Tek seferde en fazla 20 adet yükleyebilirsiniz).</p></div>
        </div>
        <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-xl mt-8 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">Tamamdır, Anladım</button>
      </div>
    </div>
  );
};

const Header = ({
  isEditor,
  onGoHome,
  onUpload,
  onDownload,
  isDownloading,
  onMobileMenuToggle,
  onShowAbout,
  onShowHowTo,
  onShowFAQ,
  onShowPrivacy,
  splitCount // EKLENDİ: Buton kontrolü için
}) => (
  <header className={`fixed top-0 left-0 right-0 z-[70] px-4 md:px-8 py-2 md:py-4 flex items-center justify-between backdrop-blur-3xl transition-all ${isEditor ? 'bg-black/90 border-b border-white/5' : 'bg-transparent'}`}>
    <div className="flex items-center gap-3 md:gap-6 ml-0 md:ml-10">
      <div
        className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all"
        onClick={onGoHome}
        title="Ana Menüye Dön"
        role="button"
        aria-label="Ana Menüye Dön"
        tabIndex={0}
      >
        <div className="w-10 h-10 md:w-10 md:h-10 bg-white text-black rounded-xl flex flex-shrink-0 items-center justify-center font-black italic shadow-2xl transition-all text-xl md:text-2xl tracking-tighter group-hover:scale-105">D</div>
        <span className="hidden md:block text-lg md:text-2xl font-black tracking-tighter uppercase italic">Dump Splitter</span>
      </div>
    </div>

    <div className="flex items-center gap-2 md:gap-4 justify-end">
      {isEditor && (
        <>
          <button
            onClick={onUpload}
            className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-lg border border-white/10 whitespace-nowrap"
          >
            <Upload size={16} /> <span className="whitespace-nowrap">Yeni Yükleme</span>
          </button>

          {/* SAĞ BUTTON: TÜMÜNÜ İNDİR - SADECE PARÇA SAYISI 1'DEN BÜYÜKSE GÖSTER */}
          {splitCount > 1 && (
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className={`bg-white text-black px-4 md:px-6 py-2 md:py-2.5 mr-2 md:mr-0 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] whitespace-nowrap ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
              <span className="whitespace-nowrap">{isDownloading ? 'İndiriliyor...' : 'Tümünü İndir'}</span>
            </button>
          )}

        </>
      )}

      <div className="flex items-center justify-center">
        {!isEditor && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-3 bg-white/10 rounded-full text-white border border-white/10 active:scale-95 transition-all"
            aria-label="Menüyü Aç"
          >
            <Menu size={24} />
          </button>
        )}

        <div className="hidden md:flex flex-wrap justify-end gap-3">
          {!isEditor && (
            <>
              <button onClick={onShowAbout} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><Info size={12} /> DUMP SPLITTER NEDİR?</button>
              <button onClick={onShowHowTo} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><HelpIcon size={12} /> Nasıl Kullanılır?</button>
              <button onClick={onShowFAQ} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><MessageCircleQuestion size={12} /> SSS</button>
              <button onClick={onShowPrivacy} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><ShieldCheck size={12} /> Gizlilik</button>
            </>
          )}
        </div>
      </div>
    </div>
  </header>
);

const MobileMenu = ({ isOpen, onClose, onShowAbout, onShowHowTo, onShowFAQ, onShowPrivacy }) => {
  const { isRendered, isVisible } = useModalTransition(isOpen);
  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
      <div className={`flex flex-col gap-6 text-center w-full max-w-sm transform transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
        <button onClick={onShowAbout} className="text-lg font-black text-white uppercase tracking-widest py-4 border-b border-white/10 hover:text-gray-300">DUMP SPLITTER NEDİR?</button>
        <button onClick={onShowHowTo} className="text-lg font-black text-white uppercase tracking-widest py-4 border-b border-white/10 hover:text-gray-300">Nasıl Kullanılır?</button>
        <button onClick={onShowFAQ} className="text-lg font-black text-white uppercase tracking-widest py-4 border-b border-white/10 hover:text-gray-300">Sıkça Sorulan Sorular</button>
        <button onClick={onShowPrivacy} className="text-lg font-black text-white uppercase tracking-widest py-4 border-b border-white/10 hover:text-gray-300">Gizlilik</button>
      </div>
    </div>
  );
};


const App = () => {
  const [page, setPage] = useState('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notificationType, setNotificationType] = useState('success'); // 'success' | 'error'
  const [aiLogs, setAiLogs] = useState([]);

  // Sürükleme efekti için state
  const [isDragging, setIsDragging] = useState(false);

  // İçerik animasyonu için state
  const [isContentReady, setIsContentReady] = useState(true);

  // Batch Download State
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  // MODAL STATES
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [featureInfo, setFeatureInfo] = useState(null);

  // Mobil Menü State'i
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- AYARLAR (LOCAL STATE - SADECE AKTİF FOTOĞRAFI TEMSİL EDER) ---
  const [splitCount, setSplitCount] = useState(DEFAULT_SETTINGS.splitCount);
  const [downloadFormat, setDownloadFormat] = useState(DEFAULT_SETTINGS.downloadFormat);
  const [autoEnhance, setAutoEnhance] = useState(DEFAULT_SETTINGS.autoEnhance);
  const [hdMode, setHdMode] = useState(DEFAULT_SETTINGS.hdMode);
  const [optimizeMode, setOptimizeMode] = useState(DEFAULT_SETTINGS.optimizeMode);
  const [smartCrop, setSmartCrop] = useState(DEFAULT_SETTINGS.smartCrop);
  const [ultraHdMode, setUltraHdMode] = useState(DEFAULT_SETTINGS.ultraHdMode);

  // İndirme işlemi kontrolü
  const [isDownloading, setIsDownloading] = useState(false);

  // ZOOM & BOYUTLAR
  const [zoom, setZoom] = useState(100);
  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });

  // --- DOCK DRAG LOGIC ---
  const [dockPos, setDockPos] = useState({ x: 0, y: 0 });
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dockRef = useRef(null);
  const containerRef = useRef(null);

  // --- FEEDBACK CONTROL REF ---
  const skipFeedbackRef = useRef(false);

  // --- POINTER EVENTS STATE (ZOOM/PAN) ---
  const evCache = useRef([]);
  const prevDiff = useRef(-1);

  const removeEvent = (ev) => {
    const index = evCache.current.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
    if (index > -1) {
      evCache.current.splice(index, 1);
    }
  };

  const handlePointerDown = (e) => {
    // Ignore buttons
    if (e.target.closest('button')) return;

    e.preventDefault();
    // Cache the event
    evCache.current.push(e);

    const imgContainer = e.currentTarget;
    imgContainer.setPointerCapture(e.pointerId);

    // If starting a pan (1 finger), store initial state
    if (evCache.current.length === 1) {
      const img = imgContainer.querySelector('img');
      if (img) {
        const style = window.getComputedStyle(img);
        const matrix = new DOMMatrix(style.transform);
        img.dataset.panStart = JSON.stringify({
          x: e.clientX,
          y: e.clientY,
          tx: matrix.m41,
          ty: matrix.m42
        });
      }
    }
  };

  const handlePointerMove = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();

    // Find this event in the cache and update it
    const index = evCache.current.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId);
    if (index > -1) {
      evCache.current[index] = e;
    } else {
      return; // Event not tracked
    }

    // MULTI-TOUCH (PINCH ZOOM)
    if (evCache.current.length === 2) {
      const curDiff = Math.hypot(
        evCache.current[0].clientX - evCache.current[1].clientX,
        evCache.current[0].clientY - evCache.current[1].clientY
      );

      if (prevDiff.current > 0) {
        // Calculate zoom change
        const diff = curDiff - prevDiff.current;
        if (Math.abs(diff) > 2) { // Threshold
          const sensitivity = 0.5;
          setZoom(prev => Math.max(10, Math.min(200, prev + (diff * sensitivity))));
        }
      }
      prevDiff.current = curDiff;
    }
    // SINGLE TOUCH (PAN)
    else if (evCache.current.length === 1) {
      // MOBILE GUARD: Mobilde yanlışlıkla kaydırmayı önlemek için 1024px altında PAN işlemini engelle.
      if (window.innerWidth < 1024) return;

      const imgContainer = e.currentTarget;
      const img = imgContainer.querySelector('img');
      if (img && img.dataset.panStart) {
        const startState = JSON.parse(img.dataset.panStart);
        const dx = e.clientX - startState.x;
        const dy = e.clientY - startState.y;
        img.style.transform = `translate(${startState.tx + dx}px, ${startState.ty + dy}px)`;
      }
    }
  };

  const handlePointerUp = (e) => {
    removeEvent(e);
    const imgContainer = e.currentTarget;
    if (imgContainer.hasPointerCapture(e.pointerId)) {
      imgContainer.releasePointerCapture(e.pointerId);
    }

    if (evCache.current.length < 2) {
      prevDiff.current = -1;
    }

    // Clean up pan state
    if (evCache.current.length === 0) {
      const img = imgContainer.querySelector('img');
      if (img) delete img.dataset.panStart;
    }
  };
  useEffect(() => {
    // 1. JSZip
    if (!window.JSZip) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // 2. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  const handleDockPointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDraggingDock(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    dragStartRef.current = {
      x: clientX - dockPos.x,
      y: clientY - dockPos.y
    };
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handleDockPointerMove = (e) => {
    if (!isDraggingDock) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    let nextX = clientX - dragStartRef.current.x;
    // Y konumunu hesaplamayı devre dışı bırakıyoruz
    // let nextY = clientY - dragStartRef.current.y; 

    // Sınırlandırma Mantığı (Container'a göre)
    if (dockRef.current && containerRef.current) {
      const dockRect = dockRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const dockW = dockRect.width;
      // const dockH = dockRect.height;
      const containerW = containerRect.width;
      // const containerH = containerRect.height;

      const margin = 10; // Kenarlardan 10px boşluk

      // X Ekseni Sınırları (Container merkezine göre)
      const minX = -(containerW / 2) + (dockW / 2) + margin;
      const maxX = (containerW / 2) - (dockW / 2) - margin;

      nextX = Math.max(minX, Math.min(maxX, nextX));
    }

    setDockPos({ x: nextX, y: 0 }); // Y'yi 0'a sabitle
  };

  const handleDockPointerUp = () => {
    setIsDraggingDock(false);
  };

  // DOSYA LİSTESİ: { url, type, id, settings: {...} }
  const [fileList, setFileList] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [splitSlides, setSplitSlides] = useState([]);

  const fileInputRef = useRef(null);
  const shouldResetList = useRef(false);
  const activeUrlsRef = useRef([]);

  // --- MEMORY CLEANUP HELPER ---
  const cleanupFile = useCallback((url) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    activeUrlsRef.current = activeUrlsRef.current.filter(u => u !== url);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all URLs on unmount
      activeUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      activeUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('privacy_accepted');
    if (!hasAccepted) {
      setShowPrivacy(true);
    }
  }, []);

  useEffect(() => {
    setZoom(100);
  }, [uploadedFile]);

  // --- AYAR GÜNCELLEME YÖNETİCİSİ ---
  const updateSetting = (key, value) => {
    let stateKey = key;

    switch (key) {
      case 'splitCount':
        setSplitCount(value);
        stateKey = 'splitCount';
        break;
      case 'downloadFormat':
        setDownloadFormat(value);
        stateKey = 'downloadFormat';
        break;

      case 'aiEnhance': setAutoEnhance(value); stateKey = 'autoEnhance'; break;
      case 'hdMode': setHdMode(value); stateKey = 'hdMode'; break;
      case 'optimize': setOptimizeMode(value); stateKey = 'optimizeMode'; break;
      case 'smartCrop': setSmartCrop(value); stateKey = 'smartCrop'; break;
      case 'ultraHd': setUltraHdMode(value); stateKey = 'ultraHdMode'; break;

      case 'autoEnhance': setAutoEnhance(value); break;
      case 'optimizeMode': setOptimizeMode(value); break;
      case 'ultraHdMode': setUltraHdMode(value); break;
    }

    if (uploadedFile) {
      setFileList(prevList => prevList.map(item => {
        if (item.url === uploadedFile) {
          return {
            ...item,
            settings: {
              ...item.settings,
              [stateKey]: value
            }
          };
        }
        return item;
      }));
    }

    skipFeedbackRef.current = true;
  };

  // --- DOSYA DEĞİŞTİRME YÖNETİCİSİ ---
  const handleSwitchFile = (fileItem) => {
    if (uploadedFile === fileItem.url) return;

    skipFeedbackRef.current = true;

    const s = fileItem.settings || DEFAULT_SETTINGS;

    setSplitCount(s.splitCount ?? DEFAULT_SETTINGS.splitCount);
    setDownloadFormat(s.downloadFormat || DEFAULT_SETTINGS.downloadFormat);
    setAutoEnhance(s.autoEnhance ?? DEFAULT_SETTINGS.autoEnhance);
    setHdMode(s.hdMode ?? DEFAULT_SETTINGS.hdMode);
    setOptimizeMode(s.optimizeMode ?? DEFAULT_SETTINGS.optimizeMode);
    setSmartCrop(s.smartCrop ?? DEFAULT_SETTINGS.smartCrop);
    setUltraHdMode(s.ultraHdMode ?? DEFAULT_SETTINGS.ultraHdMode);

    setUploadedFile(fileItem.url);
    setFileType(fileItem.type);
  };

  const showToast = (msg, type = 'success') => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => {
      setNotification(null);
      setNotificationType('success');
    }, 3000);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      shouldResetList.current = false;
      fileInputRef.current.click();
    }
  };

  const triggerNewUpload = () => {
    if (fileInputRef.current) {
      shouldResetList.current = true;
      fileInputRef.current.click();
    }
  };

  const handleGoHome = () => {
    // SADELEŞTİRİLDİ: Tek seferde animasyonlu geçiş
    setPage('landing');
    setUploadedFile(null);
    setFileList([]);
    setSplitSlides([]);
    setZoom(100);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteCurrent = (e) => {
    e.stopPropagation();
    if (!uploadedFile || fileList.length === 0) return;

    const currentIndex = fileList.findIndex(f => f.url === uploadedFile);
    if (currentIndex === -1) return;

    // Clean up memory for the deleted file
    cleanupFile(uploadedFile);

    const newList = fileList.filter((_, i) => i !== currentIndex);
    setFileList(newList);

    if (newList.length > 0) {
      let nextIndex = currentIndex;
      if (nextIndex >= newList.length) {
        nextIndex = newList.length - 1;
      }

      skipFeedbackRef.current = true;

      const nextFile = newList[nextIndex];

      const s = nextFile.settings || DEFAULT_SETTINGS;
      setSplitCount(s.splitCount ?? DEFAULT_SETTINGS.splitCount);
      setDownloadFormat(s.downloadFormat || DEFAULT_SETTINGS.downloadFormat);
      setAutoEnhance(s.autoEnhance ?? DEFAULT_SETTINGS.autoEnhance);
      setHdMode(s.hdMode ?? DEFAULT_SETTINGS.hdMode);
      setOptimizeMode(s.optimizeMode ?? DEFAULT_SETTINGS.optimizeMode);
      setSmartCrop(s.smartCrop ?? DEFAULT_SETTINGS.smartCrop);
      setUltraHdMode(s.ultraHdMode ?? DEFAULT_SETTINGS.ultraHdMode);

      setUploadedFile(nextFile.url);
      setFileType(nextFile.type);

      showToast("Dosya silindi.");
    } else {
      setUploadedFile(null);
      setPage('landing');
    }
  };

  const handleResetList = (e) => {
    e.stopPropagation();
    if (!uploadedFile) {
      // Clean all
      fileList.forEach(f => cleanupFile(f.url));
      setFileList([]);
      return;
    }

    const currentFile = fileList.find(f => f.url === uploadedFile);

    // Clean others
    fileList.forEach(f => {
      if (f.url !== uploadedFile) {
        cleanupFile(f.url);
      }
    });

    // GÜNCELLENDİ: Sıfırlama işlemi (animasyonlu geçişi destekler)
    if (currentFile) {
      setFileList([currentFile]);
      showToast("Liste temizlendi, aktif dosya korundu.");
    } else {
      setFileList([]);
    }
  };

  const handleBatchDownload = async (e) => {
    e.stopPropagation();

    if (!window.JSZip) {
      showToast("ZIP kütüphanesi yükleniyor, lütfen bekleyin...");
      return;
    }

    if (!fileList || fileList.length === 0) {
      showToast("İndirilecek dosya yok.");
      return;
    }

    setIsZipping(true);
    setZipProgress({ current: 0, total: fileList.length });

    const zip = new window.JSZip();
    const mainFolder = zip.folder("Dump_Splitter_Pack");

    let processedCount = 0;

    // YARDIMCI: Tekil Dosya İşleme (Garantili Klasör)
    const processItem = async (fileItem, index, retryCount = 0) => {
      // 1. KLASÖRÜ PEŞİN OLUŞTUR (Böylece "Image_6" asla eksik olmaz, boş da olsa oluşur)
      const itemFolderName = `Image_${index + 1}`;
      const itemFolder = mainFolder.folder(itemFolderName);

      try {
        // 1. FORMAT KONTROLÜ (Artık Video da kabul ediyoruz)
        if (!fileItem || !fileItem.url) {
          itemFolder.file("Bilgi.txt", "Dosya URL'si geçersiz.");
          return;
        }
        // Sadece Image ve Video tiplerini al, gerisini ele
        if (fileItem.type !== 'image' && fileItem.type !== 'video') {
          itemFolder.file("Bilgi.txt", `Desteklenmeyen dosya türü: ${fileItem.type}`);
          return;
        }

        const settings = fileItem.settings || DEFAULT_SETTINGS;

        await new Promise((resolve, reject) => {
          // --- A) VİDEO İŞLEME DALI ---
          if (fileItem.type === 'video') {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = "anonymous";

            const timeoutTimer = setTimeout(() => {
              video.src = "";
              reject(new Error("Video Zaman Aşımı (15sn)"));
            }, 15000);

            video.onloadeddata = () => {
              video.currentTime = 0.5; // İlk kareden az ileri sar (siyah ekran olmasın)
            };

            video.onseeked = () => {
              clearTimeout(timeoutTimer);
              processCanvas(video, video.videoWidth, video.videoHeight, resolve, reject);
            };

            video.onerror = () => {
              clearTimeout(timeoutTimer);
              reject(new Error("Video Dosyası Açılamadı"));
            };

            video.src = fileItem.url;
          }
          // --- B) RESİM İŞLEME DALI ---
          else {
            const img = new Image();

            const timeoutTimer = setTimeout(() => {
              img.src = "";
              reject(new Error("Resim Zaman Aşımı (10sn)"));
            }, 10000);

            img.onload = () => {
              clearTimeout(timeoutTimer);
              processCanvas(img, img.width, img.height, resolve, reject);
            };

            img.onerror = () => {
              clearTimeout(timeoutTimer);
              reject(new Error("Resim Dosyası Açılamadı"));
            };

            img.src = fileItem.url;
          }

          // --- ORTAK: KANVAS & SPLIT MANTIĞI ---
          // Hem resim hem video burayı kullanır
          async function processCanvas(sourceMedia, w, h, res, rej) {
            try {
              if (!w || !h) {
                rej(new Error("Boyut Hatası (0px)"));
                return;
              }

              // --- CANVAS ---
              const scaleFactor = settings.ultraHdMode ? 2 : 1;
              const sW = Math.floor(w * scaleFactor);
              const sH = Math.floor(h * scaleFactor);

              const sourceCanvas = document.createElement('canvas');
              sourceCanvas.width = sW;
              sourceCanvas.height = sH;

              const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
              if (!sCtx) {
                rej(new Error("Bellek Dolu (Canvas Oluşmadı)"));
                return;
              }

              if (settings.autoEnhance) {
                const contrastVal = settings.hdMode ? 1.15 : 1.1;
                const saturateVal = settings.hdMode ? 1.25 : 1.15;
                sCtx.filter = `contrast(${contrastVal}) saturate(${saturateVal}) brightness(1.05)`;
              }

              if (settings.smartCrop) {
                const cropMargin = 0.02;
                sCtx.drawImage(sourceMedia, w * cropMargin, h * cropMargin, w * (1 - 2 * cropMargin), h * (1 - 2 * cropMargin), 0, 0, sW, sH);
              } else {
                sCtx.drawImage(sourceMedia, 0, 0, sW, sH);
              }
              sCtx.filter = 'none';

              // --- SPLIT ---
              let rows = 1, cols = 1;
              if (settings.splitCount === 1) { rows = 1; cols = 1; }
              else if (settings.splitCount === 2) { rows = 2; cols = 1; }
              else if (settings.splitCount % 2 !== 0) { rows = settings.splitCount; cols = 1; }
              else { cols = 2; rows = settings.splitCount / 2; }

              const pW = Math.floor(sW / cols);
              const pH = Math.floor(sH / rows);

              let partIndex = 1;

              for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                  const partCanvas = document.createElement('canvas');
                  partCanvas.width = pW;
                  partCanvas.height = pH;
                  const pCtx = partCanvas.getContext('2d');

                  if (pCtx) {
                    pCtx.imageSmoothingEnabled = true;
                    pCtx.imageSmoothingQuality = 'high';
                    // Video or Image source works same here
                    pCtx.drawImage(sourceCanvas, c * pW, r * pH, pW, pH, 0, 0, pW, pH);

                    const mimeType = `image/${settings.downloadFormat === 'jpg' ? 'jpeg' : settings.downloadFormat}`;
                    let quality = 0.95;
                    if (settings.hdMode) quality = 1.0;
                    if (settings.optimizeMode) quality = 0.80;

                    await new Promise((resBlob, rejBlob) => {
                      partCanvas.toBlob((blob) => {
                        if (blob) {
                          itemFolder.file(`Part_${partIndex}.${settings.downloadFormat}`, blob);
                          partIndex++;
                          resBlob();
                        } else {
                          rejBlob(new Error("Bellek Dolu (Blob Yok)"));
                        }
                        partCanvas.width = 0;
                        partCanvas.height = 0;
                      }, mimeType, quality);
                    });
                  }
                }
              }

              sourceCanvas.width = 0;
              sourceCanvas.height = 0;
              res();

            } catch (err) {
              rej(err);
            }
          }
        });
      } catch (error) {
        console.error(`Item ${index} error:`, error);
        if (retryCount < 2) { // 2 Kere Tekrar Dene
          console.log(`Retrying item ${index}... (${retryCount + 1}/2)`);
          await new Promise(r => setTimeout(r, 1500)); // Bekleme süresini arttır
          // Klasörü temizlemeye gerek yok, overwrite eder
          await processItem(fileItem, index, retryCount + 1);
        } else {
          const detayliRapor = `⚠️ DOSYA İNDİRME HATASI\n\n` +
            `📁 HANGİ DOSYA?: Bu klasör (Image_${index + 1}), uygulamanızdaki listenin ${index + 1}. sırasındaki dosyasını temsil eder.\n` +
            `Dosya Tipi: ${fileItem.type}\n` +
            `Hata Sebebi: ${error.message}\n\n` +
            `💡 ÇÖZÜM ÖNERİLERİ:\n` +
            `1. Bu dosyayı listeden seçip tek başına indirmeyi veya 'Tümünü İndir' yapmayı deneyebilirsiniz.\n` +
            `2. Cihaz hafızasının dolu olup olmadığını kontrol edin.\n` +
            `3. Dosyanın bozuk olmadığından emin olun (video ise oynatılıyor mu?).\n` +
            `4. Sorun devam ederse 'Toplu İndir' işlemini tekrar başlatmayı deneyin.`;

          itemFolder.file("Hata_Raporu.txt", detayliRapor);
        }
      }
    };

    try {
      for (let i = 0; i < fileList.length; i++) {
        setZipProgress({ current: i + 1, total: fileList.length });

        // CİHAZI SOĞUTMA MOLASI
        // Her 5 dosyada bir uzun mola (1.5 saniye) ver
        if (i > 0 && i % 5 === 0) {
          await new Promise(r => setTimeout(r, 1500));
        } else {
          // Standart bekleme (500ms)
          await new Promise(r => setTimeout(r, 500));
        }

        await processItem(fileList[i], i);
        processedCount++;
      }

      if (Object.keys(zip.files).length === 0) {
        showToast("ZIP oluşturulamadı.");
      } else {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Dump_Splitter_Pack_Total_${fileList.length}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 10000);
        showToast("İndirme tamamlandı! Eksik varsa 'Hata_Raporu'nu okuyun.");
      }

    } catch (globalError) {
      showToast("Kritik Hata: " + globalError.message);
    } finally {
      setIsZipping(false);
      setZipProgress({ current: 0, total: 0 });
    }
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let currentCount = shouldResetList.current ? 0 : fileList.length;
    let limitExceeded = false;
    const newFilesToAdd = [];

    for (let i = 0; i < files.length; i++) {
      if (currentCount >= 20) {
        limitExceeded = true;
        break;
      }

      const file = files[i];
      const url = URL.createObjectURL(file);
      activeUrlsRef.current.push(url);

      const type = file.type.startsWith('video/') ? 'video' : 'image';

      const newFileObj = {
        url,
        type,
        id: Date.now() + Math.random() + i,
        settings: { ...DEFAULT_SETTINGS }
      };

      newFilesToAdd.push(newFileObj);
      currentCount++;
    }

    if (limitExceeded) {
      showToast("Maksimum 20 dosya sınırına ulaşıldı.");
    }

    if (newFilesToAdd.length > 0) {
      skipFeedbackRef.current = false;

      if (shouldResetList.current) {
        setFileList(newFilesToAdd);
        shouldResetList.current = false;

        setUploadedFile(newFilesToAdd[0].url);
        setFileType(newFilesToAdd[0].type);

        setSplitCount(DEFAULT_SETTINGS.splitCount);
        setDownloadFormat(DEFAULT_SETTINGS.downloadFormat);
        setAutoEnhance(DEFAULT_SETTINGS.autoEnhance);
        setHdMode(DEFAULT_SETTINGS.hdMode);
        setOptimizeMode(DEFAULT_SETTINGS.optimizeMode);
        setSmartCrop(DEFAULT_SETTINGS.smartCrop);
        setUltraHdMode(DEFAULT_SETTINGS.ultraHdMode);

        setSplitSlides([]);
        setIsProcessing(false);

        setPage('loading');
        setTimeout(() => {
          setPage('editor');
        }, 800);
      } else {
        setFileList(prev => [...prev, ...newFilesToAdd]);
        if (page === 'landing' || !uploadedFile) {
          setUploadedFile(newFilesToAdd[0].url);
          setFileType(newFilesToAdd[0].type);

          setSplitCount(DEFAULT_SETTINGS.splitCount);
          setDownloadFormat(DEFAULT_SETTINGS.downloadFormat);
          setAutoEnhance(DEFAULT_SETTINGS.autoEnhance);
          setHdMode(DEFAULT_SETTINGS.hdMode);
          setOptimizeMode(DEFAULT_SETTINGS.optimizeMode);
          setSmartCrop(DEFAULT_SETTINGS.smartCrop);
          setUltraHdMode(DEFAULT_SETTINGS.ultraHdMode);

          setSplitSlides([]);
          setIsProcessing(false);

          setPage('loading');
          setTimeout(() => {
            setPage('editor');
          }, 800);
        }
      }
    }

    event.target.value = null;
  };

  // GÜNCELLENDİ: Sürükleme başladığında efekti aç
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // GÜNCELLENDİ: State'i true yap
  };

  // EKLENDİ: Sürükleme alandan çıkarsa efekti kapat
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // GÜNCELLENDİ: State'i false yap
  };

  // GÜNCELLENDİ: Dosya bırakıldığında efekti kapat ve dosyaları işle
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // GÜNCELLENDİ: State'i false yap

    // 1. Klasör ve Dosya Tipi Kontrolü (Güvenlik Önlemi)
    const items = e.dataTransfer.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // A) Klasör Kontrolü
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            showToast("Lütfen sadece video ya da fotoğraf sürükleyin.", "error"); // Kırmızı X ile uyarı
            return;
          }
        }

        // B) Dosya Tipi Kontrolü (Herhangi biri bile hatalı olsa reddet)
        if (item.kind === 'file') {
          if (!item.type.startsWith('image/') && !item.type.startsWith('video/')) {
            showToast("Lütfen sadece video ya da fotoğraf sürükleyin.", "error");
            return;
          }
        }
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const mockEvent = {
        target: {
          files: e.dataTransfer.files
        }
      };

      if (page === 'editor') {
        shouldResetList.current = true;
      } else {
        shouldResetList.current = false;
      }

      handleFileSelect(mockEvent);
    }
  };

  useEffect(() => {
    if (page === 'editor' && uploadedFile) {
      processSplit(uploadedFile, fileType === 'video');
    }
  }, [splitCount, autoEnhance, hdMode, optimizeMode, smartCrop, downloadFormat, page, uploadedFile, ultraHdMode]);

  const processSplit = (sourceUrl, isVideo) => {
    if (!sourceUrl) return;

    // 1. ANINDA GİZLE VE TEMİZLE
    setIsContentReady(false);

    const isSilent = skipFeedbackRef.current;
    if (!isSilent) {
      setIsProcessing(true);
      setAiLogs([]);
      setSplitSlides([]); // Eski slaytları hemen silip "boşa" düşürüyoruz

      SPLITTER_STATUS_MSGS.forEach((msg, i) => {
        setTimeout(() => setAiLogs(prev => [...prev.slice(-3), msg]), i * 350);
      });
    }

    // 2. BEKLE (Fade-out süresi kadar)
    setTimeout(() => {
      if (!sourceUrl) {
        setSplitSlides([]);
        setIsContentReady(true);
        return;
      }

      // Create Media (Image or Video)
      const mediaElement = isVideo ? document.createElement('video') : new Image();
      mediaElement.setAttribute('crossOrigin', 'anonymous');

      mediaElement.src = sourceUrl;

      const onMediaLoaded = () => {
        const w = isVideo ? mediaElement.videoWidth : mediaElement.width;
        const h = isVideo ? mediaElement.videoHeight : mediaElement.height;

        const scaleFactor = ultraHdMode ? 2 : 1;
        const sW = Math.floor(w * scaleFactor);
        const sH = Math.floor(h * scaleFactor);

        setMediaDimensions({ width: sW, height: sH });

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = sW;
        sourceCanvas.height = sH;
        // CRITICAL FIX: willReadFrequently for better mobile memory handling
        const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });

        if (autoEnhance) {
          const contrastVal = hdMode ? 1.15 : 1.1;
          const saturateVal = hdMode ? 1.25 : 1.15;
          sCtx.filter = `contrast(${contrastVal}) saturate(${saturateVal}) brightness(1.05)`;
        }

        if (smartCrop) {
          const cropMargin = 0.02;
          const srcX = w * cropMargin;
          const srcY = h * cropMargin;
          const srcW = w * (1 - 2 * cropMargin);
          const srcH = h * (1 - 2 * cropMargin);
          sCtx.drawImage(mediaElement, srcX, srcY, srcW, srcH, 0, 0, sW, sH);

        } else {
          sCtx.drawImage(mediaElement, 0, 0, sW, sH);
        }

        sCtx.filter = 'none';

        let parts = [];
        let rows = 1, cols = 1;

        if (splitCount === 1) {
          rows = 1; cols = 1;
        } else if (splitCount === 2) {
          rows = 2; cols = 1;
        } else if (splitCount % 2 !== 0) {
          rows = splitCount; cols = 1;
        } else {
          cols = 2;
          rows = splitCount / 2;
        }

        const pW = Math.floor(sW / cols);
        const pH = Math.floor(sH / rows);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const partCanvas = document.createElement('canvas');
            partCanvas.width = pW;
            partCanvas.height = pH;
            const pCtx = partCanvas.getContext('2d');

            pCtx.imageSmoothingEnabled = true;
            pCtx.imageSmoothingQuality = 'high';

            pCtx.drawImage(sourceCanvas, c * pW, r * pH, pW, pH, 0, 0, pW, pH);

            const mimeType = `image/${downloadFormat === 'jpg' ? 'jpeg' : downloadFormat}`;

            let quality = 0.95;
            if (hdMode) quality = 1.0;
            if (optimizeMode) quality = 0.80;

            parts.push({
              id: parts.length + 1,
              dataUrl: partCanvas.toDataURL(mimeType, quality),
              label: `Parça ${parts.length + 1}`,
              aspectRatio: partCanvas.width / partCanvas.height
            });
          }
        }

        setSplitSlides(parts);

        setSplitSlides(parts);

        // HER DURUMDA LOADING'İ KAPAT VE İÇERİĞİ GÖSTER
        setIsProcessing(false);
        if (!isSilent) {
          showToast(`${parts.length} parça hazır.`);
        }

        skipFeedbackRef.current = false;

        // 3. ANİMASYON BİTİR (AÇ) - İşlem bitti, yeni resim hazır
        setIsContentReady(true);
      };

      if (isVideo) {
        mediaElement.muted = true;
        mediaElement.onloadeddata = () => { mediaElement.currentTime = 0.5; };
        mediaElement.onseeked = onMediaLoaded;
      } else {
        mediaElement.onload = onMediaLoaded;
      }
    }, 250); // 250ms gecikme (Fade-out efekti için yeterli süre)
  };

  const downloadFile = (dataUrl, name) => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${name}.${downloadFormat}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("İndirme hatası:", error);
      showToast("İndirme başlatılamadı. Lütfen tekrar deneyin.");
    }
  };

  const handleDownloadAll = async () => {
    if (isDownloading) return;
    if (!window.JSZip) {
      showToast("ZIP kütüphanesi yükleniyor, lütfen bekleyin...");
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new window.JSZip();

      const promises = splitSlides.map(async (s) => {
        const response = await fetch(s.dataUrl);
        const blob = await response.blob();
        const fileName = `dump_part_${s.id}.${downloadFormat}`;
        zip.file(fileName, blob);
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Dump_Splitter_Parcalar.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Tüm parçalar ZIP olarak indirildi.");

    } catch (error) {
      console.error("ZIP hatası:", error);
      showToast("İndirme sırasında bir hata oluştu.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col overflow-x-hidden supports-[min-height:100dvh]:min-h-[100dvh]">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleFileSelect} />

      <Header
        isEditor={page === 'editor'}
        onGoHome={handleGoHome}
        onUpload={triggerNewUpload}
        onDownload={handleDownloadAll}
        isDownloading={isDownloading}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onShowAbout={() => setShowAbout(true)}
        onShowHowTo={() => setShowHowTo(true)}
        onShowFAQ={() => setShowFAQ(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
        splitCount={splitCount}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onShowAbout={() => setShowAbout(true)}
        onShowHowTo={() => setShowHowTo(true)}
        onShowFAQ={() => setShowFAQ(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
      />

      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <HowToModal isOpen={showHowTo} onClose={() => setShowHowTo(false)} />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} />
      <FeatureInfoModal info={featureInfo} onClose={() => setFeatureInfo(null)} />

      {/* ZIP PROCESSING MODAL */}
      {isZipping && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 border-4 border-white/10 border-t-white rounded-full animate-spin mb-8 shadow-2xl"></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">ARŞİVLENİYOR...</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Lütfen bekleyin, dosyalar sıkıştırılıyor</p>
          <div className="mt-8 w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${(zipProgress.current / zipProgress.total) * 100}%` }}></div>
          </div>
          <p className="mt-4 text-white font-black text-lg">{zipProgress.current} / {zipProgress.total}</p>
        </div>
      )}

      {/* 3. Sayfa İçeriği (Condition ile değişir) */}
      {page === 'loading' ? (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/5 border-t-white rounded-[32px] animate-spin mb-8 md:mb-10 shadow-2xl" />
          <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-widest animate-pulse tracking-tighter">İşleniyor</h2>
        </div>
      ) : page === 'landing' ? (
        // LANDING VIEW
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-x-hidden pt-48 lg:pt-64">
          <div className="absolute top-0 -z-10 w-full h-full bg-gradient-to-b from-blue-900/10 via-transparent to-transparent" />
          <h1 className="text-5xl md:text-9xl font-black tracking-tighter mb-4 md:mb-8 leading-normal italic uppercase">DUMP <br /> SPLITTER</h1>
          <p className="text-gray-400 max-w-xl mb-8 md:mb-12 font-medium tracking-tight uppercase text-[10px] md:text-xs tracking-[0.2em] px-4">Instagram için profesyonel Dump Bölme ve Kalite Artırma Aracı</p>

          <div
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full max-w-xl bg-[#0c0c0c] border-2 border-dashed rounded-[32px] md:rounded-[48px] flex flex-col items-center justify-center group transition-all cursor-pointer mx-4 p-12 md:p-16 ${isDragging ? 'border-blue-500 bg-white/10 scale-105 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'border-white/10 hover:border-white/30'}`}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-3xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform pointer-events-none">
              <Upload size={28} className="md:w-9 md:h-9" />
            </div>
            <p className="text-lg md:text-2xl font-black uppercase italic pointer-events-none text-center">Dosya Yükle</p>
            <p className="text-gray-500 text-[10px] md:text-xs mt-3 font-bold uppercase tracking-widest opacity-60 pointer-events-none text-center">Dosyayı buraya sürükle veya tıklayarak yükle</p>
          </div>

          <p className="text-gray-500 mt-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Fotoğraflar tarayıcında işlenir, sunucuya yüklenmez.</p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200">
            <a href="https://github.com/irmaakq/Dump-Splitter" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group">
              <Github size={14} className="text-white group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">Project</span>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest leading-none">Open Source</span>
              </div>
            </a>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-help" title="GNU General Public License v2.0">
              <ShieldCheck size={14} className="text-green-500" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">License</span>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest leading-none">GNU GPLv2</span>
              </div>
            </div>
          </div>

          {/* GÜNCELLENDİ: Ana Menü Kutucukları Geri Eklendi */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-12 px-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
              <Layers className="text-blue-400" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Panoramik</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
              <Sparkles className="text-purple-400" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Enhance</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
              <Lock className="text-green-400" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Güvenli</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
              <Video className="text-yellow-400" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Video</span>
            </div>
          </div>

        </div>
      ) : (
        // EDITOR VIEW (Burada FadeInSection kalabilir, editör içi geçişler için istendi)
        <FadeInSection className="flex-1 pt-16 md:pt-20 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
          <aside className="w-full lg:w-[320px] h-auto lg:h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col order-2 lg:order-1 z-20 shrink-0">
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6 lg:space-y-8">
              <div className="space-y-6">
                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-[28px] space-y-5 shadow-inner">
                  <div className="space-y-2"><FeatureToggle featureKey="aiEnhance" state={autoEnhance} onToggle={updateSetting} onInfo={setFeatureInfo} /></div>
                  <div className="space-y-2 border-t border-white/5 pt-4"><FeatureToggle featureKey="hdMode" state={hdMode} onToggle={updateSetting} onInfo={setFeatureInfo} /></div>
                  <div className="space-y-2 border-t border-white/5 pt-4"><FeatureToggle featureKey="optimize" state={optimizeMode} onToggle={updateSetting} onInfo={setFeatureInfo} /></div>
                  <div className="space-y-2 border-t border-white/5 pt-4"><FeatureToggle featureKey="smartCrop" state={smartCrop} onToggle={updateSetting} onInfo={setFeatureInfo} /></div>
                </div>
                <div className="space-y-3">
                  <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest block">Format</span>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    {['png', 'jpg', 'webp'].map(fmt => (
                      <button key={fmt} onClick={() => { skipFeedbackRef.current = true; updateSetting('downloadFormat', fmt); }} className={`flex-1 py-2 rounded-lg text-[12px] font-black uppercase transition-all ${downloadFormat === fmt ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{fmt}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-3"><FeatureToggle featureKey="ultraHd" state={ultraHdMode} onToggle={updateSetting} onInfo={setFeatureInfo} /></div>
                <div className="space-y-3">
                  <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest block">Parça Sayısı</span>
                  <div className="grid grid-cols-5 gap-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <button key={num} onClick={() => {
                        // 1. ZORLA TEMİZLE VE LOADING AÇ
                        setSplitSlides([]);
                        setIsContentReady(false);
                        setIsProcessing(true);

                        // 2. Beklemeyi iptal et (animasyon görünsün)
                        skipFeedbackRef.current = false;

                        // 3. Ayarı güncelle (ProcessSplit zaten useEffect ile tetiklenecek ama biz önden hazırladık)
                        updateSetting('splitCount', num);
                      }} className={`aspect-square rounded-xl text-[12px] font-black flex items-center justify-center transition-all border ${splitCount === num ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white hover:border-white/30'}`}>{num}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 lg:p-8 border-t border-white/5 hidden lg:block">
              <button onClick={() => processSplit(uploadedFile, fileType === 'video')} disabled={isProcessing || !uploadedFile} className={`w-full py-4 lg:py-5 rounded-[24px] font-black text-xs transition-all shadow-2xl ${isProcessing || !uploadedFile ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 uppercase tracking-widest'}`}>{isProcessing ? 'İŞLENİYOR...' : 'YENİDEN BÖL'}</button>
            </div>
            <div className="p-6 lg:hidden border-t border-white/5 pb-8">
              <button onClick={() => processSplit(uploadedFile, fileType === 'video')} disabled={isProcessing || !uploadedFile} className={`w-full py-4 rounded-[24px] font-black text-xs transition-all shadow-2xl ${isProcessing || !uploadedFile ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 uppercase tracking-widest'}`}>{isProcessing ? 'İŞLENİYOR...' : 'YENİDEN BÖL'}</button>
            </div>
          </aside>

          <section className="flex-1 bg-[#050505] p-2 md:p-6 flex flex-col items-center relative order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
            <div
              ref={containerRef}
              className={`relative w-full h-full max-w-[95vw] bg-black rounded-[32px] md:rounded-[56px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.5)] flex items-center justify-center group/canvas my-auto transition-all duration-300 ease-in-out transform ${isContentReady ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 blur-sm'}`}
            >
              {uploadedFile ? (
                <div className="w-full h-full p-4 md:p-12 flex flex-col overflow-y-auto custom-scrollbar bg-black/40">
                  <div className={`w-full ${splitCount === 1 ? 'max-w-none px-2 md:px-4' : 'max-w-6xl'} mx-auto space-y-8 md:space-y-16 pb-32 md:pb-40 flex flex-col items-center`}>
                    <div className="text-center mt-4"><h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">Bölünen Parçalar</h3></div>
                    <div className={`grid gap-6 md:gap-12 w-full justify-items-center ${splitCount === 1 ? 'grid-cols-1' : (splitCount % 2 !== 0 || splitCount === 2 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}`}>
                      {splitSlides.length > 0 ? splitSlides.map((s) => (
                        <div key={`${uploadedFile}-${s.id}`} style={{ aspectRatio: s.aspectRatio, transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s' }} className="relative w-full max-w-[500px] h-auto max-h-[50vh] md:max-h-[70vh] bg-white/5 group hover:scale-[1.01] transition-all flex items-center justify-center snap-center rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                          <div
                            className="relative w-full h-full"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                          >
                            <img
                              src={s.dataUrl}
                              className="w-full h-full object-contain drop-shadow-2xl rounded-2xl md:rounded-3xl cursor-grab active:cursor-grabbing"
                              alt="Slide"
                              draggable="false"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-50 pointer-events-none rounded-2xl md:rounded-3xl">
                              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); downloadFile(s.dataUrl, `part_${s.id}`); }} className="bg-white text-black w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)] cursor-pointer pointer-events-auto" title="Bu parçayı indir"><DownloadCloud size={24} strokeWidth={2.5} /></button>
                              <div className="absolute top-4 left-4 text-white font-bold bg-black/50 px-3 py-1 rounded-full text-[10px] border border-white/20">PARÇA {s.id}</div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="w-full text-center py-40 opacity-10 italic text-xl md:text-2xl font-black uppercase tracking-widest">Medya Analiz Ediliyor...</div>
                      )}
                    </div>
                  </div>
                  {splitSlides.length > 0 && (
                    <div
                      ref={dockRef}
                      onPointerDown={handleDockPointerDown}
                      onPointerMove={handleDockPointerMove}
                      onPointerUp={handleDockPointerUp}
                      style={{
                        left: '50%',
                        bottom: '20px',
                        transform: `translate(calc(-50% + ${dockPos.x}px), ${dockPos.y}px)`,
                        cursor: isDraggingDock ? 'grabbing' : 'grab',
                        touchAction: 'none'
                      }}
                      className="absolute bg-black/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center justify-center gap-4 md:gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-5 w-[90%] max-w-sm md:w-auto md:max-w-[90vw] select-none"
                    >
                      <div className="flex flex-col items-start gap-1 border-r border-white/10 pr-4 md:pr-6 min-w-[80px] md:min-w-[140px] shrink-0 pointer-events-none">
                        <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-wider">Çözünürlük</span>
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-base font-black text-white italic">
                          <span>{mediaDimensions.width}</span>
                          <span className="text-gray-600 text-[10px] md:text-xs">×</span>
                          <span>{mediaDimensions.height}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 pl-2 justify-end shrink-0 flex-1">
                        <button onClick={() => setZoom(prev => Math.max(10, prev - 10))} onPointerDown={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white transition-colors shrink-0 p-2" aria-label="Uzaklaştır"><Minus size={14} /></button>
                        <div className="flex items-center gap-2 group/zoom"><span className="text-[10px] md:text-xs font-black text-white/50 w-8 text-center group-hover/zoom:text-white transition-colors shrink-0">{Math.round(zoom)}%</span></div>
                        <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} onPointerDown={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white transition-colors shrink-0 p-2" aria-label="Yakınlaştır"><Plus size={14} /></button>
                        <button onClick={() => setZoom(100)} onPointerDown={(e) => e.stopPropagation()} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-gray-400 hover:text-white ml-1 border border-white/5 shrink-0" title="Sıfırla" aria-label="Zoom Sıfırla"><Maximize size={12} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-10 md:p-20 flex flex-col items-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-[48px] flex items-center justify-center mb-6 md:mb-10 text-gray-700 border border-white/5 shadow-inner"><ImageIcon size={40} className="md:w-12 md:h-12" /></div>
                  <h3 className="text-2xl md:text-4xl font-black mb-4 tracking-tighter uppercase tracking-widest">Medya Bekleniyor</h3>
                  <button onClick={triggerFileInput} className="bg-white text-black px-10 py-4 md:px-14 md:py-5 rounded-[24px] font-black shadow-2xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest text-[10px] md:text-xs">Dosya Seç</button>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-[6px] border-white/5 border-t-white rounded-[40px] animate-spin mb-8 md:mb-10 shadow-2xl" />
                  <div className="space-y-4 text-center">{aiLogs.map((log, i) => (<p key={i} className="text-xs md:text-sm font-black text-gray-400 px-10 uppercase tracking-[0.3em] italic">{log}</p>))}</div>
                </div>
              )}
            </div>
          </section>

          <aside className="w-full lg:w-[100px] h-auto lg:h-full border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0a0a0a] flex flex-row lg:flex-col shadow-2xl z-20 overflow-x-auto lg:overflow-y-auto custom-scrollbar p-4 space-x-4 lg:space-x-0 lg:space-y-6 order-3 items-center lg:items-center">
            {fileList.length === 0 && <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap lg:whitespace-normal text-center w-full">GEÇMİŞ BOŞ</div>}
            {fileList.map((file, idx) => (
              <div
                key={file.id}
                onClick={() => { handleSwitchFile(file); }}
                className={`relative group rounded-[16px] lg:rounded-[20px] overflow-hidden aspect-square h-16 lg:h-auto lg:w-full border-2 shadow-xl cursor-pointer transition-all shrink-0 animate-in fade-in zoom-in duration-300 ${uploadedFile === file.url ? 'border-white ring-2 ring-white/20' : 'border-white/10 opacity-60 hover:opacity-100'}`}
              >
                {file.type === 'video' ? <video src={file.url} className="w-full h-full object-cover" /> : <img src={file.url} className="w-full h-full object-cover" alt="Thumb" />}
              </div>
            ))}
            <div className="flex lg:flex-col items-center gap-3 shrink-0">
              {fileList.length > 0 && (<span className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest">{fileList.length}/20</span>)}

              {fileList.length < 20 && (<div onClick={triggerFileInput} className="h-16 w-16 lg:h-auto lg:w-full lg:aspect-square border-2 border-dashed border-white/10 rounded-[16px] lg:rounded-[20px] flex items-center justify-center text-gray-800 hover:text-white transition-all cursor-pointer shadow-inner"><Plus size={20} /></div>)}

              {/* SİL BUTONU - GÜNCELLENMİŞ TASARIM (YENİDEN BÖL TARZI - İKONSUZ SADE YAZI) */}
              {/* SADECE 2 VEYA DAHA FAZLA FOTOĞRAF VARSA GÖSTERİLİR */}
              {uploadedFile && fileList.length > 1 && (
                <button onClick={handleDeleteCurrent} title="Seçili Olanı Sil" className="w-16 h-16 lg:w-full lg:h-auto lg:py-4 bg-white text-black rounded-[16px] lg:rounded-[24px] font-black text-[10px] lg:text-xs shadow-xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 shrink-0">
                  <span>SİL</span>
                </button>
              )}

              {/* SIFIRLA BUTONU - GÜNCELLENMİŞ TASARIM (YENİDEN BÖL TARZI - İKONSUZ SADE YAZI) */}
              {/* SADECE 2 VEYA DAHA FAZLA FOTOĞRAF VARSA GÖSTERİLİR */}
              {fileList.length > 1 && (
                <button onClick={handleResetList} title="Diğerlerini Sil (Sıfırla)" className="w-16 h-16 lg:w-full lg:h-auto lg:py-4 bg-white text-black rounded-[16px] lg:rounded-[24px] font-black text-[10px] lg:text-xs shadow-xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-normal flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 shrink-0">
                  <span>SIFIRLA</span>
                </button>
              )}

              {/* TOPLU İNDİR BUTONU - SADECE 2 VEYA DAHA FAZLA FOTOĞRAF VARSA GÖSTERİLİR */}
              {fileList.length > 1 && (
                <button onClick={handleBatchDownload} title="Tümünü Arşivle ve İndir (ZIP)" className="w-16 h-16 lg:w-full lg:h-auto lg:py-4 bg-white text-black rounded-[16px] lg:rounded-[24px] font-black text-[10px] lg:text-xs shadow-xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-tighter flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 shrink-0">
                  <span className="text-center leading-tight">TOPLU<br />İNDİR</span>
                </button>
              )}
            </div>
          </aside>
        </FadeInSection>
      )}

      {notification && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-[30px] font-black shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-[200] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
          {notificationType === 'error' ? (
            <X size={24} strokeWidth={3} className="text-red-500 shadow-xl scale-110" />
          ) : (
            <CheckCircle2 size={20} className="text-green-500 shadow-xl" />
          )}
          <span className="uppercase tracking-widest text-[10px] font-black">{notification}</span>
        </div>
      )}
      <style>{`
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; width: 0; background: transparent; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
};

export default App;

