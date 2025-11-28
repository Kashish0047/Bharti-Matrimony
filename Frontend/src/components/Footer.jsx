import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-5">
          <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Bharti Matrimony
          </div>
          <p className="text-slate-400 leading-relaxed">
            Helping people find lifelong partners with care, privacy and trusted matchmaking for over 20 years.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://www.facebook.com/yourpage"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.96 3.66 9.07 8.44 9.88v-6.99H8.08v-2.89h2.36V9.41c0-2.33 1.39-3.62 3.51-3.62. 1.02 0 2.09.18 2.09.18v2.29h-1.17c-1.16 0-1.52.72-1.52 1.46v1.75h2.59l-.41 2.89h-2.18v6.99C18.34 21.14 22 17.03 22 12.07z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.5A4.5 4.5 0 1016.5 13 4.5 4.5 0 0012 8.5zM18.5 6a1 1 0 11-1 1 1 1 0 011-1z"/>
              </svg>
            </a>
            <a
              href="https://twitter.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white mb-5">Quick Links</h3>
          <nav className="flex flex-col gap-3">
            <a href="#/packages" className="text-slate-400 hover:text-amber-400 transition-colors duration-200 font-medium">
              Packages
            </a>
            <a href="#/contact" className="text-slate-400 hover:text-amber-400 transition-colors duration-200 font-medium">
              Contact
            </a>
            <a href="/privacy" className="text-slate-400 hover:text-amber-400 transition-colors duration-200 font-medium">
              Privacy Policy
            </a>
            <a href="/terms" className="text-slate-400 hover:text-amber-400 transition-colors duration-200 font-medium">
              Terms of Service
            </a>
          </nav>
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white mb-5">Contact Us</h3>
          <div className="flex flex-col gap-3">
            <a href="tel:+919876543210" className="text-slate-400 hover:text-amber-400 transition-colors duration-200 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              +91 9255953953
            </a>
            <a href="mailto:hello@bhartimatrimony.example" className="text-slate-400 hover:text-amber-400 transition-colors duration-200 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              arorabharti222@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Bharti Matrimony. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-slate-400 hover:text-amber-400 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-slate-400 hover:text-amber-400 transition-colors">
              Terms
            </a>
            <a href="/sitemap" className="text-slate-400 hover:text-amber-400 transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}