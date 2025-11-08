"use client"

export default function Footer() {
  return (
    <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} <span className="font-semibold text-slate-300">MindMate.tech</span> — Cognitive Health Monitor
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="/about"
              className="text-slate-400 hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="/privacy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
