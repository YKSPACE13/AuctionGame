const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-gray-950/90 backdrop-blur-30 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-gray-400 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center text-base">
            🏆
          </div>
          <div>
            <p className="text-white font-medium">Auction Game</p>
            <p className="text-[11px] text-gray-500">
              Fast 1-minute multiplayer auction experience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="#about" className="hover:text-white">
            About
          </a>
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <a href="#faq" className="hover:text-white">
            FAQ
          </a>
          <a href="#contact" className="hover:text-white">
            Contact
          </a>
        </div>

        <p className="text-[11px] sm:text-xs text-gray-500">
          © {new Date().getFullYear()} Auction Game. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
