export default function App() {
  return (
    <div className="min-h-screen bg-reserve-50 text-charcoal-900 flex flex-col justify-between">
      <header className="border-b border-reserve-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span data-testid="brand-logo" className="text-2xl font-serif font-bold tracking-wider text-charcoal-950">
              THE BOMBAY RESERVE
            </span>
            <span className="text-xs uppercase tracking-widest text-reserve-700 font-semibold px-2.5 py-0.5 rounded-full bg-reserve-100 border border-reserve-200">
              14 Mumbai Havens
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 text-center flex flex-col items-center justify-center">
        <span className="text-sm uppercase tracking-widest text-reserve-700 font-semibold mb-3">
          Curated Boutique Hospitality
        </span>
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-charcoal-950 max-w-3xl leading-tight mb-6">
          Architectural Sanctuaries Across Mumbai
        </h1>
        <p className="text-lg text-charcoal-800 max-w-2xl font-light leading-relaxed">
          From Art Deco lofts at Marine Drive to heritage Portuguese villas in Pali Hill, experience intimate boutique luxury crafted for the discerning traveler.
        </p>
      </main>

      <footer className="border-t border-reserve-200 py-8 text-center text-sm text-charcoal-800">
        &copy; {new Date().getFullYear()} The Bombay Reserve Collective. All rights reserved.
      </footer>
    </div>
  );
}
