import { memo } from 'react';
import { Mail, Instagram, TrendingUp, Users, Heart, Eye } from 'lucide-react';
import influencerBg from '@/assets/influencer-woman-bg.jpg';
const stats = [{
  value: '3.2M',
  label: 'Followers'
}, {
  value: '8.5%',
  label: 'Engagement'
}, {
  value: '50+',
  label: 'Brand Deals'
}];
const navDots = [0, 1, 2, 3, 4];
const MobileMockup = memo(() => {
  return <div className="relative flex justify-center items-center py-4 px-2 sm:px-4 md:px-8 lg:px-16 overflow-hidden" dir="ltr">
      {/* Phone-Centric Layout Container - Always LTR to prevent card position changes */}
      <div className="relative mx-auto scale-[0.75] sm:scale-[0.85] md:scale-100 origin-center">
        {/* iPhone Frame - Center (Smaller) */}
        <div className="relative w-[200px] h-[400px] md:w-[220px] md:h-[440px] bg-neutral-900 rounded-[40px] md:rounded-[45px] p-2 md:p-2.5 shadow-2xl z-10">
          {/* Screen */}
          <div className="w-full h-full bg-neutral-950 rounded-[32px] md:rounded-[36px] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-neutral-900 rounded-b-xl md:rounded-b-2xl z-10" />
            
            {/* Status Bar */}
            
            
            {/* Background Image */}
            <img
              src={influencerBg}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
            
            {/* Main Content */}
            <div className="flex flex-col items-center justify-center h-full px-4 pb-6 pt-4 -mt-3 relative z-10">
              {/* Name Section */}
              <div className="text-center mb-2">
                <h2 className="font-serif italic text-[20px] md:text-[22px] leading-tight">
                  <span className="text-rose-400">SARAH</span>
                </h2>
                <h2 className="font-serif italic text-[20px] md:text-[22px] leading-tight text-white -mt-0.5">
                  JOHNSON
                </h2>
              </div>

              {/* Subtitle */}
              <p className="text-rose-400/80 text-[8px] tracking-wider uppercase mb-2">
                Fashion & Lifestyle Influencer
              </p>

              {/* Bio */}
              <p className="text-neutral-400 text-[7px] text-center leading-relaxed mb-3 px-2 max-w-[160px]">
                Creating authentic content that inspires millions worldwide.
              </p>

              {/* Stats Row */}
              <div className="flex gap-1.5 mb-3 w-full px-1">
                {stats.map((stat) => <div key={stat.label} className="flex-1 bg-neutral-800/70 rounded-lg py-2 px-1.5 text-center border border-neutral-700/40">
                    <p className="text-white font-serif text-[11px] font-medium">{stat.value}</p>
                    <p className="text-neutral-500 text-[5px] uppercase tracking-wide">{stat.label}</p>
                  </div>)}
              </div>

              {/* CTA Button */}
              <button className="flex items-center gap-1.5 bg-white text-neutral-900 rounded-full px-4 py-1.5 text-[9px] font-medium shadow-lg mb-3">
                <Mail className="w-3 h-3" />
                Collaborate
              </button>

              {/* Social Icons */}
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-neutral-400" />
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Navigation Dots - Right Side */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              {navDots.map((_, i) => <div key={i} className={`rounded-full ${i === 0 ? 'w-1.5 h-1.5 bg-rose-400' : 'w-1 h-1 bg-neutral-600'}`} />)}
            </div>
          </div>
        </div>

        {/* Instagram Card - Top Right - Hidden on small screens to prevent overflow */}
        <div className="absolute top-4 right-[-40px] md:right-[-70px] lg:right-[-110px] bg-neutral-900/95 shadow-xl rounded-lg p-1.5 md:p-2 border border-neutral-800 z-20 hidden md:block hover:scale-105 transition-transform">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-[8px] md:text-[9px]">Instagram</p>
              <p className="text-neutral-500 text-[6px]">Social Platform</p>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <div>
              <p className="text-[#E1306C] font-bold text-[10px] md:text-xs">1.1M</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Users className="w-1.5 h-1.5" /> Followers</p>
            </div>
            <div>
              <p className="text-[#E1306C] font-bold text-[10px] md:text-xs">6.8%</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Heart className="w-1.5 h-1.5" /> Engage</p>
            </div>
            <div>
              <p className="text-white font-bold text-[10px] md:text-xs">150K</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Eye className="w-1.5 h-1.5" /> Views</p>
            </div>
          </div>
        </div>

        {/* Engagement Card - Bottom Right - Hidden on small screens to prevent overflow */}
        <div className="absolute bottom-20 right-[-30px] md:right-[-50px] lg:right-[-90px] bg-neutral-900/95 shadow-lg rounded-md p-1 md:p-1.5 border border-neutral-800 z-20 hidden md:block hover:scale-105 transition-transform">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[6px] md:text-[7px] text-neutral-500">Engagement</p>
              <p className="text-[8px] md:text-[10px] font-bold text-emerald-400">+24%</p>
            </div>
          </div>
        </div>

        {/* Top Engagement Badge - Bottom Center */}
        <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 bg-neutral-900/95 shadow-lg rounded-full px-2 md:px-2.5 py-0.5 md:py-1 border border-neutral-800 flex items-center gap-1 z-20 hover:scale-105 transition-transform">
          <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-400" />
          <p className="text-[7px] md:text-[8px] text-neutral-300 whitespace-nowrap">Top 5% Engagement</p>
        </div>

        {/* TikTok Card - Top Left - Hidden on small screens to prevent overflow */}
        <div className="absolute top-[-8px] left-[-40px] md:left-[-70px] lg:left-[-110px] bg-neutral-900/95 shadow-xl rounded-lg p-1.5 md:p-2 border border-neutral-800 z-20 hidden md:block hover:scale-105 transition-transform">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-neutral-800 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-[8px] md:text-[9px]">TikTok</p>
              <p className="text-neutral-500 text-[6px]">Social Platform</p>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <div>
              <p className="text-[#00f2ea] font-bold text-[10px] md:text-xs">2.1M</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Users className="w-1.5 h-1.5" /> Followers</p>
            </div>
            <div>
              <p className="text-[#00f2ea] font-bold text-[10px] md:text-xs">12.3%</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Heart className="w-1.5 h-1.5" /> Engage</p>
            </div>
            <div>
              <p className="text-white font-bold text-[10px] md:text-xs">500K</p>
              <p className="text-neutral-500 text-[5px] flex items-center gap-0.5"><Eye className="w-1.5 h-1.5" /> Views</p>
            </div>
          </div>
        </div>

        {/* Demographics Card - Bottom Left - Hidden on smaller screens to prevent overflow */}
        <div className="absolute bottom-14 left-[-35px] md:left-[-55px] lg:left-[-95px] bg-neutral-900/95 shadow-lg rounded-lg p-1.5 md:p-2 border border-neutral-800 z-20 hidden lg:block hover:scale-105 transition-transform">
          <p className="text-white font-semibold text-[7px] md:text-[8px] mb-1">Audience Demographics</p>
          <div className="flex gap-1">
            <div className="bg-neutral-800/70 rounded-md px-1 md:px-1.5 py-0.5 text-center">
              <p className="text-white font-bold text-[10px] md:text-xs">68%</p>
              <p className="text-[#E1306C] text-[5px]">Female</p>
            </div>
            <div className="bg-neutral-800/70 rounded-md px-1 md:px-1.5 py-0.5 text-center">
              <p className="text-white font-bold text-[10px] md:text-xs">82%</p>
              <p className="text-neutral-400 text-[5px]">Age 18-34</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
});
MobileMockup.displayName = 'MobileMockup';
export default MobileMockup;