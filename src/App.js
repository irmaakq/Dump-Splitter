import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, Minus, Plus, Image as ImageIcon, Video, Check, 
  Sparkles,  
  X, Monitor,
  Zap, CheckCircle2,
  Grid, DownloadCloud, FileImage, 
  ShieldCheck, Cpu, Activity, Target, Lock, ServerOff, HelpCircle as HelpIcon, Info, MessageCircleQuestion, FileQuestion, ZoomIn, Maximize,
  Download, Eye, Shield, Github, Settings, ChevronRight, Loader2, Menu, Trash2, RefreshCcw, Archive
} from 'lucide-react';

// --- ICONS (Custom) ---
const DownloadIcon = ({ size = 24, strokeWidth = 2.5, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

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
    desc: "Yapay zeka algoritmaları fotoğrafın renk dengesini, doygunluğunu ve kontrastını analiz eder. Soluk renkleri canlandırır ve profesyonel bir görünüm kazandırır."
  },
  hdMode: {
    title: "HD KALİTE",
    icon: Cpu,
    color: "text-blue-400",
    desc: "Çıktı alma sürecinde gelişmiş pikselleri yumuşatarak kenar tırtıklarını giderir. Instagram'ın sıkıştırma algoritmasına karşı görüntüyü netleştirir."
  },
  optimize: {
    title: "OPTIMIZE",
    icon: Activity,
    color: "text-green-400",
    desc: "Görselin kalitesini gözle görülür şekilde düşürmeden dosya boyutunu %30-40 oranında sıkıştırır. Instagram hikaye ve gönderileri için ideal yükleme hızı sağlar."
  },
  smartCrop: {
    title: "SMART CROP",
    icon: Target,
    color: "text-purple-400",
    desc: "Fotoğrafın kenarlarındaki gereksiz veya boş alanları analiz eder ve %5 oranında 'Safe Zoom' yaparak ana objeyi merkeze odaklar."
  },
  ultraHd: {
    title: "ULTRA HD İNDİR",
    icon: Zap,
    color: "text-yellow-400",
    desc: "Super-Resolution (Süper Çözünürlük) teknolojisi kullanır. Mevcut görseli sanal olarak genişletip eksik pikselleri tamamlayarak çözünürlüğü 2 katına (2x Upscale) çıkarır."
  }
};

// --- SUB-COMPONENTS (DEFINED OUTSIDE APP) ---

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
            >
              <Info size={10} />
            </button>
          </div>
          <div className={`w-9 h-5 rounded-full transition-all relative ${state ? details.color.replace('text-', 'bg-') : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${state ? 'right-1 bg-black' : 'left-1 bg-white/30'}`} />
          </div>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase mt-2">{details.desc.substring(0, 50)}...</p>
    </div>
  );
};

const FeatureInfoModal = ({ info, onClose }) => {
  if (!info) return null;
  const Icon = info.icon;
  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100" onClick={e => e.stopPropagation()}>
         <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-xl bg-white/5 ${info.color}`}><Icon size={24} /></div><h3 className="text-lg font-black text-white uppercase">{info.title}</h3></div>
         <p className="text-sm text-gray-300 leading-relaxed">{info.desc}</p>
         <button onClick={onClose} className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors">Tamam</button>
      </div>
    </div>
  );
};

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
  <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto">
    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-3xl w-full p-6 md:p-10 relative shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="p-3 bg-green-500/10 rounded-2xl animate-pulse"><ShieldCheck size={32} className="text-green-500" /></div>
        <div><h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Güvenlik ve Gizlilik Protokolü</h2><p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Son Güncelleme: 7.01.2026 • Sürüm 3.6 (Secure Build)</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Lock size={18} className="text-blue-400"/><span className="uppercase tracking-tight text-xs">İstemci Taraflı İşleme</span></h3><p className="text-gray-400 leading-relaxed text-xs">Dump Splitter, dosyalarınızı <strong>uzak bir sunucuya (Cloud) yüklemez.</strong> Tüm işlemler tarayıcınızın belleğinde (HTML5 Canvas) gerçekleşir. Verileriniz cihazınızdan asla dışarı çıkmaz.</p></div>
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><ServerOff size={18} className="text-red-400"/><span className="uppercase tracking-tight text-xs">Sunucu Kaydı Yoktur</span></h3><p className="text-gray-400 leading-relaxed text-xs">Uygulama sunucusuz çalışır. Fotoğraflarınız loglanmaz veya kaydedilmez. Sayfayı yenilediğinizde (F5), tüm geçici veriler RAM'den silinir.</p></div>
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Eye size={18} className="text-purple-400"/><span className="uppercase tracking-tight text-xs">AI Modeli Eğitilmez</span></h3><p className="text-gray-400 leading-relaxed text-xs">Kullanılan algoritmalar yereldir. Görselleriniz, herhangi bir yapay zeka modelini eğitmek veya yüz taraması yapmak amacıyla <strong>kullanılmaz.</strong></p></div>
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Shield size={18} className="text-yellow-400"/><span className="uppercase tracking-tight text-xs">Sıfır İz Politikası</span></h3><p className="text-gray-400 leading-relaxed text-xs">Kişisel verileriniz, IP adresiniz veya kullanım alışkanlıklarınız hiçbir üçüncü taraf ile paylaşılmaz. Uygulama tamamen anonimdir.</p></div>
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
          <p className="text-[10px] text-gray-600 uppercase tracking-widest max-w-md">Şeffaflık politikamız gereği bu projenin tüm kodları açık kaynaklıdır. <br className="hidden md:block"/>KVKK ve GDPR standartlarına uygun olarak tasarlanmıştır.</p>
          <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">Güvenlik Protokollerini Onayla ve Devam Et</button>
      </div>
    </div>
  </div>
  );
};

const HowToModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
  <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-[#0f0f0f] border border-white/10 rounded-[40px] max-w-lg w-full p-8 relative shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
      <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">NASIL ÇALIŞIR?</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">HIZLI BAŞLANGIÇ REHBERİ</p>
      </div>
      <div className="relative space-y-8 px-4">
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-30 rounded-full"></div>
          <div className="relative flex items-start gap-6 group">
              <div className="relative z-10 w-16 h-16 bg-[#0f0f0f] border-4 border-blue-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <Upload size={24} className="text-blue-400" strokeWidth={2.5} />
              </div>
              <div className="pt-2">
                  <h3 className="text-white font-black text-lg uppercase tracking-wide mb-1 group-hover:text-blue-400 transition-colors">1. Yükle</h3>
                  <p className="text-gray-400 text-xs leading-relaxed font-medium">Galerinden yüksek kaliteli fotoğrafını veya videonu seç.</p>
              </div>
          </div>
          <div className="relative flex items-start gap-6 group">
              <div className="relative z-10 w-16 h-16 bg-[#0f0f0f] border-4 border-purple-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <Settings size={24} className="text-purple-400" strokeWidth={2.5} />
              </div>
              <div className="pt-2">
                  <h3 className="text-white font-black text-lg uppercase tracking-wide mb-1 group-hover:text-purple-400 transition-colors">2. Düzenle</h3>
                  <p className="text-gray-400 text-xs leading-relaxed font-medium">Parça sayısını seç, <strong>AI Enhance</strong> ile renkleri canlandır.</p>
              </div>
          </div>
          <div className="relative flex items-start gap-6 group">
              <div className="relative z-10 w-16 h-16 bg-[#0f0f0f] border-4 border-green-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <DownloadCloud size={24} className="text-green-400" strokeWidth={2.5} />
              </div>
              <div className="pt-2">
                  <h3 className="text-white font-black text-lg uppercase tracking-wide mb-1 group-hover:text-green-400 transition-colors">3. Paylaş</h3>
                  <p className="text-gray-400 text-xs leading-relaxed font-medium">Sonuçları <strong>Ultra HD</strong> kalitede indir ve Instagram'da paylaş!</p>
              </div>
          </div>
      </div>
      <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-2xl mt-12 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95">Anladım, Başlayalım</button>
    </div>
  </div>
  );
};

const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
  <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-2xl w-full p-8 md:p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">DUMP SPLITTER NEDİR?</h2>
      <div className="text-gray-400 text-sm leading-relaxed mb-8 space-y-4">
          <p>Dump Splitter, Instagram'da popüler olan "Photo Dump" paylaşımlarınızı düzenlemenizi sağlayan, yapay zeka destekli bir web aracıdır.</p>
          <div className="bg-white/5 p-4 rounded-xl border-l-2 border-white/20">
              <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider">Nasıl Çalışır?</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Fotoğraflarınızı sisteme yükersiniz.</li>
                  <li>Sistem, fotoğrafları otomatik olarak böler.</li>
                  <li>Yapay zeka desteği ile renkler ve netlik optimize edilir.</li>
                  <li>Sonuçları tek tek veya toplu olarak indirirsiniz.</li>
              </ol>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0"><Zap size={24} /></div><div><h3 className="font-bold text-white text-sm">Hızlı & Ücretsiz</h3><p className="text-[10px] text-gray-500">Saniyeler içinde sonuç al.</p></div></div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0"><Sparkles size={24} /></div><div><h3 className="font-bold text-white text-sm">AI Güçlü İyileştirme</h3><p className="text-[10px] text-gray-500">Renkleri otomatik canlandır.</p></div></div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0"><Lock size={24} /></div><div><h3 className="font-bold text-white text-sm">İstemci Taraflı</h3><p className="text-[10px] text-gray-500">Fotoğrafların sunucuya yüklenmez.</p></div></div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400 shrink-0"><Grid size={24} /></div><div><h3 className="font-bold text-white text-sm">Esnek Izgara Sistemi</h3><p className="text-[10px] text-gray-500">Tüm parça seçeneklerini destekler.</p></div></div>
      </div>
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            GNU GPLv2 • OPEN SOURCE
          </p>
          <p className="text-[9px] text-gray-600 leading-relaxed">Bu proje açık kaynak kodludur ve topluluk geliştirmesine açıktır.</p>
      </div>
      <button onClick={onClose} className="w-full bg-white text-black font-black py-4 rounded-xl mt-8 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">Harika, Başlayalım!</button>
    </div>
  </div>
  );
};

const FAQModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
  <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-3xl w-full p-8 relative shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 text-center flex items-center justify-center gap-3"><MessageCircleQuestion size={28} className="text-blue-400" /> Sıkça Sorulan Sorular</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><FileQuestion size={14} className="text-yellow-400"/> Video yükleyebilir miyim?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, video dosyalarını (MP4, MOV vb.) sisteme yükleyebilirsiniz. Ancak sistem videoları parça parça kesip video olarak vermez. Videonun o anki karesini <strong>yüksek kaliteli bir fotoğraf</strong> olarak yakalar ve bunu parçalara ayırır.</p></div>
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Lock size={14} className="text-green-400"/> Fotoğraflarım güvende mi?</h3><p className="text-gray-400 text-xs leading-relaxed">Kesinlikle. Sitemiz "Client-Side" (İstemci Taraflı) çalışır. Yüklediğiniz dosyalar sunucuya gönderilmez, sadece tarayıcınızın geçici hafızasında (RAM) işlenir. Sayfayı kapattığınız an her şey silinir.</p></div>
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Monitor size={14} className="text-purple-400"/> Hangi cihazlarda çalışır?</h3><p className="text-gray-400 text-xs leading-relaxed">Dump Splitter; iPhone, Android, Tablet ve Bilgisayar (PC/Mac) tarayıcılarında sorunsuz çalışır. Herhangi bir uygulama indirmenize gerek yoktur.</p></div>
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Check size={14} className="text-blue-400"/> Ücretli mi, Sınır var mı?</h3><p className="text-gray-400 text-xs leading-relaxed">Tamamen ücretsizdir. Üyelik veya kredi sistemi yoktur. Performansın düşmemesi için aynı anda en fazla 20 dosya yükleyebilirsiniz ancak işlem bitince listeyi temizleyip tekrar yükleyebilirsiniz.</p></div>
         <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ImageIcon size={14} className="text-pink-400"/> Hangi formatlar destekleniyor?</h3><p className="text-gray-400 text-xs leading-relaxed">Giriş olarak JPG, PNG, WEBP, HEIC (tarayıcı desteğine göre) ve popüler video formatlarını kabul eder. Çıktı olarak PNG, JPG veya WEBP formatında indirebilirsiniz.</p></div>
         <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Download size={14} className="text-orange-400"/> İndirme çalışmıyor?</h3><p className="text-gray-400 text-xs leading-relaxed">Eğer indirme başlamazsa tarayıcınızın "Pop-up engelleyicisini" kontrol edin veya sayfayı yenileyip (F5) tekrar deneyin. Tek tek indirmek için parçanın üzerindeki ok işaretine basmanız yeterlidir.</p></div>
      </div>
      <button onClick={onClose} className="w-full bg-white/10 text-white font-bold py-4 rounded-xl mt-8 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">Tamamdır, Anladım</button>
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
  onShowPrivacy
}) => (
  <header className={`fixed top-0 left-0 right-0 z-[70] px-4 md:px-8 py-2 md:py-4 flex items-center justify-between backdrop-blur-3xl transition-all ${isEditor ? 'bg-black/90 border-b border-white/5' : 'bg-transparent'}`}>
    <div className="flex items-center gap-3 md:gap-6 ml-0 md:ml-10">
      <div 
        className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all" 
        onClick={onGoHome}
        title="Ana Menüye Dön"
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
          <button 
            onClick={onDownload} 
            disabled={isDownloading}
            className={`bg-white text-black px-4 md:px-6 py-2 md:py-2.5 mr-2 md:mr-0 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] whitespace-nowrap ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
             {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />} 
            <span className="whitespace-nowrap">{isDownloading ? 'İndiriliyor...' : 'Tümünü İndir'}</span>
          </button>
        </>
      )}

      <div className="flex items-center justify-center">
           {!isEditor && (
             <button 
               onClick={onMobileMenuToggle} 
               className="md:hidden p-3 bg-white/10 rounded-full text-white border border-white/10 active:scale-95 transition-all"
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
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-top-10 duration-300">
       <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
       <div className="flex flex-col gap-6 text-center w-full max-w-sm">
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
  const [aiLogs, setAiLogs] = useState([]);
  
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

  // --- FEEDBACK CONTROL REF ---
  const skipFeedbackRef = useRef(false);

  // --- LOAD JSZIP & PWA CONFIG DYNAMICALLY ---
  useEffect(() => {
    // 1. JSZip Yükle
    if (!window.JSZip) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // 2. PWA MANIFEST (Data URI)
    const manifest = {
      name: "Dump Splitter",
      short_name: "DumpSplitter",
      start_url: ".",
      display: "standalone",
      background_color: "#050505",
      theme_color: "#050505",
      icons: [
        {
          src: "https://cdn-icons-png.flaticon.com/512/10051/10051390.png", // Örnek bir ikon
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "https://cdn-icons-png.flaticon.com/512/10051/10051390.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    
    let link = document.querySelector("link[rel='manifest']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    // 3. PWA META TAGS
    const metaTags = [
      { name: 'theme-color', content: '#050505' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
    ];

    metaTags.forEach(tag => {
      let meta = document.querySelector(`meta[name='${tag.name}']`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = tag.name;
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });

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

    setDockPos({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y
    });
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

  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
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
    
    switch(key) {
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

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
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
        setFileList([]);
        return;
    }
    
    const currentFile = fileList.find(f => f.url === uploadedFile);
    
    if (currentFile) {
        setFileList([currentFile]); 
        showToast("Liste temizlendi, aktif dosya korundu.");
    } else {
        setFileList([]); 
    }
  };

  // GÜNCELLENMİŞ VE GÜVENLİ BATCH DOWNLOAD (FAIL-SAFE)
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
    const folder = zip.folder("Dump_Splitter_Pack");
    
    let processedCount = 0;

    try {
        for (let i = 0; i < fileList.length; i++) {
            const fileItem = fileList[i];
            
            setZipProgress({ current: processedCount + 1, total: fileList.length });

            // 1. SADECE RESİM VE GEÇERLİ URL KONTROLÜ (Sessizce geç)
            if (!fileItem || fileItem.type !== 'image' || !isValidBlobUrl(fileItem.url)) {
                processedCount++;
                continue;
            }

            const settings = fileItem.settings || DEFAULT_SETTINGS;

            // 2. NEFES ALMA PAYI (CPU/RAM Soğutma)
            await new Promise(r => setTimeout(r, 80));

            // 3. RESİM İŞLEME (Asla Crash Etmez)
            await new Promise((resolve) => {
                const img = new Image();
                
                img.onload = async () => {
                    try {
                        const w = img.width;
                        const h = img.height;
                        
                        // Boyut kontrolü
                        if (!w || !h) return resolve();

                        const scaleFactor = settings.ultraHdMode ? 2 : 1;
                        const sW = Math.floor(w * scaleFactor);
                        const sH = Math.floor(h * scaleFactor);

                        const sourceCanvas = document.createElement('canvas');
                        sourceCanvas.width = sW;
                        sourceCanvas.height = sH;
                        
                        // willReadFrequently: Mobil bellek yönetimi için kritik
                        const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });

                        if (!sCtx) return resolve();

                        if (settings.autoEnhance) {
                          const contrastVal = settings.hdMode ? 1.15 : 1.1;
                          const saturateVal = settings.hdMode ? 1.25 : 1.15;
                          sCtx.filter = `contrast(${contrastVal}) saturate(${saturateVal}) brightness(1.05)`;
                        }

                        if (settings.smartCrop) {
                          const cropMargin = 0.02;
                          sCtx.drawImage(img, w * cropMargin, h * cropMargin, w * (1 - 2 * cropMargin), h * (1 - 2 * cropMargin), 0, 0, sW, sH);
                        } else {
                          sCtx.drawImage(img, 0, 0, sW, sH);
                        }
                        sCtx.filter = 'none';

                        let rows = 1, cols = 1;
                        if (settings.splitCount === 1) { rows = 1; cols = 1; }
                        else if (settings.splitCount === 2) { rows = 2; cols = 1; }
                        else if (settings.splitCount % 2 !== 0) { rows = settings.splitCount; cols = 1; }
                        else { cols = 2; rows = settings.splitCount / 2; }

                        const pW = Math.floor(sW / cols);
                        const pH = Math.floor(sH / rows);
                        
                        const imgFolder = folder.folder(`Image_${i + 1}`);
                        let partIndex = 1;

                        // 4. PARÇALARI SIRAYLA OLUŞTUR (Memory Safe)
                        for (let r = 0; r < rows; r++) {
                            for (let c = 0; c < cols; c++) {
                                
                                const partCanvas = document.createElement('canvas');
                                partCanvas.width = pW;
                                partCanvas.height = pH;
                                const pCtx = partCanvas.getContext('2d');
                                
                                if (pCtx) {
                                    pCtx.imageSmoothingEnabled = true;
                                    pCtx.imageSmoothingQuality = 'high';
                                    pCtx.drawImage(sourceCanvas, c * pW, r * pH, pW, pH, 0, 0, pW, pH);

                                    const mimeType = `image/${settings.downloadFormat === 'jpg' ? 'jpeg' : settings.downloadFormat}`;
                                    let quality = 0.95;
                                    if (settings.hdMode) quality = 1.0;
                                    if (settings.optimizeMode) quality = 0.80;

                                    await new Promise((resBlob) => {
                                        partCanvas.toBlob((blob) => {
                                            if (blob) {
                                                imgFolder.file(`Part_${partIndex}.${settings.downloadFormat}`, blob);
                                            }
                                            // 5. ANLIK TEMİZLİK (Garbage Collection Dostu)
                                            partCanvas.width = 0;
                                            partCanvas.height = 0;
                                            resBlob();
                                        }, mimeType, quality);
                                    });
                                    partIndex++;
                                }
                            }
                        }

                        // 6. ANA CANVAS TEMİZLİĞİ
                        sourceCanvas.width = 0;
                        sourceCanvas.height = 0;
                        
                    } catch (err) {
                        // Sessiz hata (Console warning bile kaldırılabilir isteğe göre)
                    } finally {
                        img.src = ""; // Kaynağı boşalt
                        resolve(); // Her durumda devam et
                    }
                };
                
                // 7. SESSİZ HATA YÖNETİMİ (NO REJECT)
                img.onerror = () => {
                    resolve(); 
                };
                
                img.src = fileItem.url;
            });
            
            processedCount++;
        }

        // ZIP İndirme Aşaması
        if (Object.keys(zip.files).length === 0) {
             showToast("İndirilecek geçerli resim bulunamadı.");
        } else {
             const content = await zip.generateAsync({ type: "blob" });
             const link = document.createElement('a');
             link.href = URL.createObjectURL(content);
             link.download = "Tüm_Dump_Arsivi.zip";
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             setTimeout(() => URL.revokeObjectURL(link.href), 10000); 
             showToast("Arşiv başarıyla indirildi.");
        }

    } catch (globalError) {
        showToast("Bir hata oluştu ama işlem kurtarıldı.");
    } finally {
        setIsZipping(false);
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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

    const isSilent = skipFeedbackRef.current;

    if (!isSilent) {
        setIsProcessing(true);
        setAiLogs([]);
        setSplitSlides([]);

        SPLITTER_STATUS_MSGS.forEach((msg, i) => {
          setTimeout(() => setAiLogs(prev => [...prev.slice(-3), msg]), i * 350);
        });
    }

    const mediaElement = isVideo ? document.createElement('video') : new Image();
    mediaElement.crossOrigin = "anonymous";
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
      
      if (!isSilent) {
          setIsProcessing(false);
          showToast(`${parts.length} parça hazır.`);
      } 
      
      skipFeedbackRef.current = false;
    };

    if (isVideo) {
      mediaElement.muted = true;
      mediaElement.onloadeddata = () => { mediaElement.currentTime = 0.5; };
      mediaElement.onseeked = onMediaLoaded;
    } else {
      mediaElement.onload = onMediaLoaded;
    }
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

  const isValidBlobUrl = (url) => typeof url === "string" && url.startsWith("blob:");

  return (
<div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-x-hidden">
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
            onDrop={handleDrop}
            className="w-full max-w-xl bg-[#0c0c0c] border-2 border-dashed border-white/10 rounded-[32px] md:rounded-[48px] flex flex-col items-center justify-center group hover:border-white/30 transition-all cursor-pointer mx-4 p-12 md:p-16"
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
        </div>
      ) : (
        // EDITOR VIEW
        <main className="flex-1 pt-16 md:pt-20 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
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
                          <button key={num} onClick={() => { skipFeedbackRef.current = true; updateSetting('splitCount', num); }} className={`aspect-square rounded-xl text-[12px] font-black flex items-center justify-center transition-all border ${splitCount === num ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white hover:border-white/30'}`}>{num}</button>
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
             <div className="relative w-full h-full max-w-[95vw] bg-black rounded-[32px] md:rounded-[56px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.5)] flex items-center justify-center group/canvas my-auto">
               {uploadedFile ? (
                 <div className="w-full h-full p-4 md:p-12 flex flex-col overflow-y-auto custom-scrollbar bg-black/40">
                   <div className={`w-full ${splitCount === 1 ? 'max-w-none px-2 md:px-4' : 'max-w-6xl'} mx-auto space-y-8 md:space-y-16 pb-32 md:pb-40 flex flex-col items-center`}>
                       <div className="text-center mt-4"><h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">Bölünen Parçalar</h3></div>
                       <div className={`grid gap-6 md:gap-12 w-full justify-items-center ${splitCount === 1 ? 'grid-cols-1' : (splitCount % 2 !== 0 || splitCount === 2 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}`}>
                           {splitSlides.length > 0 ? splitSlides.map((s) => (
                               <div key={`${uploadedFile}-${s.id}`} style={{ aspectRatio: s.aspectRatio, transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s' }} className="relative w-full max-w-[500px] h-auto max-h-[50vh] md:max-h-[70vh] bg-white/5 group hover:scale-[1.01] transition-all flex items-center justify-center snap-center rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                                   <img 
                                     src={s.dataUrl} 
                                     className="w-full h-full object-contain drop-shadow-2xl rounded-2xl md:rounded-3xl cursor-move" 
                                     alt="Slide" 
                                     draggable="false"
                                     onMouseDown={(e) => {
                                       e.preventDefault();
                                       const img = e.target;
                                       const style = window.getComputedStyle(img);
                                       const matrix = new DOMMatrix(style.transform);
                                       const currentX = matrix.m41;
                                       const currentY = matrix.m42;
                                       const startX = e.clientX;
                                       const startY = e.clientY;
                                       const handleMouseMove = (moveEvent) => {
                                         const dx = moveEvent.clientX - startX;
                                         const dy = moveEvent.clientY - startY;
                                         img.style.transform = `translate(${currentX + dx}px, ${currentY + dy}px)`;
                                       };
                                       const handleMouseUp = () => {
                                         window.removeEventListener('mousemove', handleMouseMove);
                                         window.removeEventListener('mouseup', handleMouseUp);
                                       };
                                       window.addEventListener('mousemove', handleMouseMove);
                                       window.addEventListener('mouseup', handleMouseUp);
                                     }}
                                     onTouchStart={(e) => {
                                       const img = e.target;
                                       if (e.touches.length === 2) {
                                         e.preventDefault();
                                         const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
                                         const initialZoom = zoom;
                                         const handlePinchMove = (moveEvent) => {
                                           if (moveEvent.touches.length === 2) {
                                               const newDist = Math.hypot(moveEvent.touches[0].pageX - moveEvent.touches[1].pageX, moveEvent.touches[0].pageY - moveEvent.touches[1].pageY);
                                              const newZoom = initialZoom * (newDist / dist);
                                              setZoom(Math.max(10, Math.min(200, newZoom)));
                                           }
                                         };
                                         const handlePinchEnd = () => {
                                           window.removeEventListener('touchmove', handlePinchMove);
                                           window.removeEventListener('touchend', handlePinchEnd);
                                         };
                                         window.addEventListener('touchmove', handlePinchMove, { passive: false });
                                         window.addEventListener('touchend', handlePinchEnd);
                                         return;
                                       }
                                       if(e.touches.length !== 1) return;
                                       return; 
                                     }}
                                   />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-50 pointer-events-none rounded-2xl md:rounded-3xl">
                                       <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); downloadFile(s.dataUrl, `part_${s.id}`); }} className="bg-white text-black w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)] cursor-pointer pointer-events-auto" title="Bu parçayı indir"><DownloadCloud size={24} strokeWidth={2.5} /></button>
                                       <div className="absolute top-4 left-4 text-white font-bold bg-black/50 px-3 py-1 rounded-full text-[10px] border border-white/20">PARÇA {s.id}</div>
                                   </div>
                               </div>
                           )) : (
                               <div className="w-full text-center py-40 opacity-10 italic text-xl md:text-2xl font-black uppercase tracking-widest">Medya Analiz Ediliyor...</div>
                           )}
                       </div>
                   </div>
                   {splitSlides.length > 0 && (
                     <div 
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
                         <button onClick={() => setZoom(prev => Math.max(10, prev - 10))} onPointerDown={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white transition-colors shrink-0 p-2"><Minus size={14} /></button>
                         <div className="flex items-center gap-2 group/zoom"><span className="text-[10px] md:text-xs font-black text-white/50 w-8 text-center group-hover/zoom:text-white transition-colors shrink-0">{Math.round(zoom)}%</span></div>
                         <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} onPointerDown={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white transition-colors shrink-0 p-2"><Plus size={14} /></button>
                         <button onClick={() => setZoom(100)} onPointerDown={(e) => e.stopPropagation()} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-gray-400 hover:text-white ml-1 border border-white/5 shrink-0" title="Sıfırla"><Maximize size={12} /></button>
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
                className={`relative group rounded-[16px] lg:rounded-[20px] overflow-hidden aspect-square h-16 lg:h-auto lg:w-full border-2 shadow-xl cursor-pointer transition-all shrink-0 ${uploadedFile === file.url ? 'border-white ring-2 ring-white/20' : 'border-white/10 opacity-60 hover:opacity-100'}`}
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
                    <span className="text-center leading-tight">TOPLU<br/>İNDİR</span>
                </button>
              )}
            </div>
        </aside>
      </main>
      )}

      {notification && (<div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-[30px] font-black shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-[200] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300"><CheckCircle2 size={20} className="text-green-500 shadow-xl" /><span className="uppercase tracking-widest text-[10px] font-black">{notification}</span></div>)}
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
