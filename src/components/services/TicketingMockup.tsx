import { memo, useMemo } from 'react';
import { Check, Ticket, Users, TrendingUp } from 'lucide-react';

interface TicketRow {
  name: string;
  type: string;
  typeColor: string;
  time: string;
  scanned: boolean;
}

const AdminLaptop = memo(() => {
  const existingTickets: TicketRow[] = [
    { name: 'Sarah M.', type: 'VIP', typeColor: 'bg-purple-500/30 text-purple-300', time: '2m', scanned: true },
    { name: 'Mike R.', type: 'General', typeColor: 'bg-blue-500/30 text-blue-300', time: '5m', scanned: true },
    { name: 'Emma L.', type: 'Student', typeColor: 'bg-green-500/30 text-green-300', time: '8m', scanned: false },
    { name: 'John S.', type: 'VIP', typeColor: 'bg-purple-500/30 text-purple-300', time: '10m', scanned: true },
  ];

  return (
    <div className="relative">
      {/* Laptop Frame - MacBook style */}
      <div className="w-72 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-xl p-1 shadow-2xl border border-zinc-600">
        {/* Camera notch */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
        
        {/* Screen */}
        <div className="bg-zinc-950 rounded-lg p-3 h-40 overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">TicketHub Admin</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] text-green-400 font-medium">LIVE</span>
            </div>
          </div>
          
          {/* Ticket List - Static */}
          <div className="space-y-1.5">
            {existingTickets.map((ticket, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-[11px] bg-zinc-900 rounded-md">
                {ticket.scanned ? (
                  <Check className="w-3 h-3 text-green-500/60 flex-shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-zinc-600 flex-shrink-0" />
                )}
                <span className="text-zinc-300">{ticket.name}</span>
                <span className={`${ticket.typeColor} px-1.5 py-0.5 rounded text-[10px]`}>{ticket.type}</span>
                <span className="text-zinc-500 ml-auto text-[10px]">{ticket.time}</span>
              </div>
            ))}
          </div>
          
          {/* Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-zinc-900/95 border-t border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-zinc-300">248 Sold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[11px] text-zinc-300">90 Scanned</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Laptop Base */}
      <div className="w-80 h-2 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-b-sm mx-auto shadow-lg" 
           style={{ marginLeft: '-16px' }} />
      <div className="w-16 h-1 bg-zinc-600/50 rounded-full mx-auto mt-0.5" />
    </div>
  );
});

AdminLaptop.displayName = 'AdminLaptop';

const CustomerPhone = memo(({ qrPattern }: { qrPattern: boolean[][] }) => {
  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative w-40 h-72 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-700 overflow-hidden">
        {/* Phone shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20" />
        
        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[1.8rem] overflow-hidden">
          {/* Ticket Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-24 h-24 border border-white/30 rounded-full"
                  style={{ top: `${-15 + i * 25}%`, left: `${-25 + i * 18}%` }}
                />
              ))}
            </div>
          </div>
          
          {/* Ticket Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4 pt-8">
            {/* Event Label */}
            <div className="text-[9px] font-bold text-white/90 tracking-[0.15em] uppercase mb-2">
              ★ VIP ACCESS ★
            </div>
            
            {/* QR Code Container */}
            <div 
              className="relative bg-white rounded-xl p-2.5"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              {/* QR Code Grid - 21x21 realistic pattern */}
              <div className="w-[84px] h-[84px] grid grid-cols-[repeat(21,1fr)] grid-rows-[repeat(21,1fr)] overflow-hidden">
                {qrPattern.map((row, rowIdx) => 
                  row.map((filled, colIdx) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      style={{ backgroundColor: filled ? '#1a1a1a' : '#ffffff' }}
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Ticket Info */}
            <div className="mt-4 text-center">
              <div className="text-sm font-bold text-white drop-shadow-lg">SUMMER FEST 2026</div>
              <div className="text-[10px] text-white/70 mt-1">Section A • Row 12 • Seat 5</div>
            </div>
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  );
});

CustomerPhone.displayName = 'CustomerPhone';

const TicketingMockup = memo(() => {
  // Realistic QR code pattern - 21x21 with proper finder patterns
  const qrPattern = useMemo(() => {
    // Standard QR finder pattern (7x7) in top-left, top-right, bottom-left corners
    const pattern: boolean[][] = Array(21).fill(null).map(() => Array(21).fill(false));
    
    // Helper to draw finder pattern at position
    const drawFinder = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          // Outer border, inner border, center
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          pattern[startRow + r][startCol + c] = isOuter || isInner;
        }
      }
    };
    
    // Draw 3 finder patterns
    drawFinder(0, 0);   // Top-left
    drawFinder(0, 14);  // Top-right
    drawFinder(14, 0);  // Bottom-left
    
    // Timing patterns (alternating dots between finders)
    for (let i = 8; i < 13; i++) {
      pattern[6][i] = i % 2 === 0;
      pattern[i][6] = i % 2 === 0;
    }
    
    // Alignment pattern (5x5) at bottom-right area
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        const dr = r - 18, dc = c - 18;
        pattern[r][c] = (Math.abs(dr) === 2 || Math.abs(dc) === 2) || (dr === 0 && dc === 0);
      }
    }
    
    // Random-looking data modules in the data area
    const dataSeeds = [
      [8, 0], [8, 1], [9, 0], [10, 2], [8, 4], [9, 5], [11, 0], [12, 1], [12, 3],
      [0, 8], [1, 9], [2, 8], [3, 10], [4, 8], [5, 9], [0, 11], [1, 12], [3, 12],
      [8, 8], [9, 9], [10, 10], [8, 11], [9, 12], [11, 9], [12, 11], [10, 13],
      [8, 14], [8, 16], [9, 15], [10, 17], [11, 14], [12, 16], [13, 18],
      [14, 9], [15, 8], [16, 10], [17, 9], [18, 8], [19, 11], [20, 10],
      [14, 14], [15, 15], [13, 13], [20, 20]
    ];
    
    dataSeeds.forEach(([r, c]) => {
      if (r < 21 && c < 21 && !pattern[r][c]) pattern[r][c] = true;
    });
    
    return pattern;
  }, []);

  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Centered overlapping layout - scaled down further on mobile to prevent overflow */}
      <div className="flex items-center justify-center scale-[0.5] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 origin-center">
        {/* Laptop - Left/Back with 3D tilt */}
        <div
          className="relative z-10"
          style={{ 
            transform: 'perspective(800px) rotateY(-10deg) rotateX(4deg)',
            marginRight: '-50px'
          }}
        >
          <AdminLaptop />
        </div>

        {/* Phone - Right/Front, overlapping laptop */}
        <div className="relative z-20">
          <CustomerPhone qrPattern={qrPattern} />
        </div>
      </div>
    </div>
  );
});

TicketingMockup.displayName = 'TicketingMockup';

export default TicketingMockup;
