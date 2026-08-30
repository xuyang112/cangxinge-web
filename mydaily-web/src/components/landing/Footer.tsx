export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="reveal border-t border-white/10 px-6 py-12 text-center text-sm text-white/30">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-lg font-bold gradient-text">藏心阁</div>
        <p className="mb-2">把心事藏进一座阁楼</p>
        <p>© {year} 藏心阁 · 你的数据只属于你</p>
      </div>
    </footer>
  );
}
