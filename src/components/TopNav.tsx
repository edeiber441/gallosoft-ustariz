export default function TopNav() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-surface border-b border-outline-variant shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center bg-surface-container-lowest overflow-hidden shadow-inner p-0.5">
          <img src="/logo-ustariz.png" alt="Galería Ustariz" className="w-full h-full object-contain opacity-90" />
        </div>
        <span className="font-headline font-bold text-2xl text-primary uppercase tracking-wider">
          Gallosoft
        </span>
      </div>
      <a
        href="/criadores"
        className="text-primary hover:bg-surface-container-high transition-colors opacity-80 duration-150 p-2 rounded-full flex items-center justify-center"
      >
        <span className="material-symbols-outlined">settings</span>
      </a>
    </nav>
  );
}