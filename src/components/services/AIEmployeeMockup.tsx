import { memo } from 'react';
import { Users, Headphones, TrendingUp, Calculator, FileText, MessageCircle, Brain } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const roles = [{
  icon: Users,
  label: 'HR',
  iconColor: 'text-blue-500'
}, {
  icon: Headphones,
  label: 'Support',
  iconColor: 'text-emerald-500'
}, {
  icon: TrendingUp,
  label: 'Sales',
  iconColor: 'text-violet-500'
}, {
  icon: Calculator,
  label: 'Finance',
  iconColor: 'text-amber-500'
}, {
  icon: FileText,
  label: 'Admin',
  iconColor: 'text-orange-500'
}, {
  icon: MessageCircle,
  label: 'Social',
  iconColor: 'text-pink-500'
}];

const AIEmployeeMockup = memo(() => {
  const isMobile = useIsMobile();
  const orbitRadius = isMobile ? 80 : 160;
  
  return <div className="relative w-full h-full min-h-[250px] sm:min-h-[300px] md:min-h-[350px] flex items-center justify-center overflow-hidden" dir="ltr">
    {/* Responsive scaling wrapper to prevent overflow */}
    <div className="relative w-[380px] h-[380px] scale-[0.55] sm:scale-[0.65] md:scale-[0.75] lg:scale-[0.85] origin-center flex items-center justify-center">
      {/* Background ambient glow - simplified */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-64 h-64 bg-cyan-500/20 rounded-full blur-2xl" />
      </div>

      {/* Orbital path ring */}
      <svg className="absolute pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: orbitRadius * 2 + 60, height: orbitRadius * 2 + 60, zIndex: 0 }}>
        <defs>
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <circle cx="50%" cy="50%" r={orbitRadius} fill="none" stroke="url(#orbitGradient)" strokeWidth="1" strokeDasharray="4 8" className="opacity-60" />
      </svg>

      {/* Central Brain Hub - fully static for performance */}
      <div className="relative z-20 flex items-center justify-center" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', position: 'absolute' }}>
        {/* Outer ring - darker */}
        <div className="absolute w-28 h-28 rounded-full border-2 border-blue-500/50" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)'
      }} />
        
        {/* Inner glow ring - more vibrant */}
        <div className="absolute w-24 h-24 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
        boxShadow: '0 0 50px rgba(59, 130, 246, 0.4)'
      }} />

        {/* Brain container - darker blue */}
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(99, 102, 241, 0.7) 100%)',
        border: '2px solid rgba(59, 130, 246, 0.8)',
        boxShadow: '0 8px 40px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.3)'
      }}>
          <Brain className="w-10 h-10 text-blue-100" strokeWidth={1.5} />
        </div>
      </div>

      {/* Static Role Cards - positioned around orbit */}
      {roles.map((role, index) => {
      const angle = index * 60 - 90;
      const x = Math.cos(angle * Math.PI / 180) * orbitRadius;
      const y = Math.sin(angle * Math.PI / 180) * orbitRadius;
      return <div key={role.label} className="absolute left-1/2 top-1/2 z-10" style={{
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
      }}>
            {/* Card with simple styling (no backdrop-filter) */}
            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-neutral-800 dark:bg-card/80 border border-neutral-600 dark:border-border/30 shadow-lg hover:scale-105 transition-transform">
              {/* Gradient accent line */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 opacity-80`} />
              
              {/* Icon */}
              <role.icon className={`w-6 h-6 ${role.iconColor}`} strokeWidth={1.5} />

              {/* Label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-[11px] font-semibold whitespace-nowrap text-foreground/80 drop-shadow-sm">{role.label}</span>
              </div>
            </div>
          </div>;
    })}

      {/* Premium Glass Pill Badge */}
      <div className="absolute -bottom-2 right-0 z-30">
        
      </div>
    </div>
    </div>;
});
AIEmployeeMockup.displayName = 'AIEmployeeMockup';
export default AIEmployeeMockup;