import { motion } from 'framer-motion';
import { Brain, Smile, CircleDot, Zap, AlertCircle, HelpCircle, MessageSquare, Plus, FileText, Image, Search, X, User, Settings, LogOut, Copy, Trash2, ChevronDown, ArrowUp, Heart, Eye, Building2, Ruler, Calculator, Layers, ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, Download, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export const MeetAynIllustration = () =>
<div className="relative w-full h-full flex items-center justify-center">
    <motion.div
    className="relative"
    animate={{ scale: [1, 1.02, 1] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>

      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl scale-150" />
      
      {/* Eye container */}
      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-2xl">
        {/* Iris */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          {/* Pupil with brain */}
          <div className="w-12 h-12 rounded-full bg-foreground/90 flex items-center justify-center">
            <Brain className="w-6 h-6 text-background" />
          </div>
        </div>
      </div>
    </motion.div>
  </div>;


export const EmotionsIllustration = () => {
  // Core emotions (Row 1)
  const coreEmotions = [
  { color: 'hsl(200, 60%, 55%)', label: 'Calm', emoji: '😌', meaning: 'Peaceful' },
  { color: 'hsl(45, 95%, 60%)', label: 'Happy', emoji: '😊', meaning: 'Joyful' },
  { color: 'hsl(330, 85%, 60%)', label: 'Excited', emoji: '🤩', meaning: 'Energetic' },
  { color: 'hsl(250, 70%, 65%)', label: 'Thinking', emoji: '🤔', meaning: 'Processing' },
  { color: 'hsl(170, 60%, 50%)', label: 'Curious', emoji: '🧐', meaning: 'Exploring' }];


  // Empathy emotions (Row 2)
  const empathyEmotions = [
  { color: 'hsl(25, 70%, 75%)', label: 'Comfort', emoji: '🤗', meaning: 'Nurturing' },
  { color: 'hsl(280, 45%, 75%)', label: 'Supportive', emoji: '💪', meaning: 'Encouraging' }];


  // Negative/low energy emotions (Row 3)
  const negativeEmotions = [
  { color: 'hsl(20, 70%, 50%)', label: 'Frustrated', emoji: '😤', meaning: 'Tense' },
  { color: 'hsl(354, 80%, 42%)', label: 'Mad', emoji: '😠', meaning: 'Intense' },
  { color: 'hsl(220, 40%, 50%)', label: 'Sad', emoji: '😢', meaning: 'Melancholy' },
  { color: 'hsl(200, 12%, 58%)', label: 'Bored', emoji: '😑', meaning: 'Low Energy' }];


  const EmotionCircle = ({ emotion, index, baseDelay = 0, small = false }: {emotion: typeof coreEmotions[0];index: number;baseDelay?: number;small?: boolean;}) =>
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: baseDelay + index * 0.06, type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center gap-0.5">

      <motion.div
      className={`${small ? 'w-8 h-8' : 'w-9 h-9'} rounded-full flex items-center justify-center shadow-md`}
      style={{
        backgroundColor: emotion.color,
        boxShadow: `0 2px 12px ${emotion.color.replace(')', ', 0.35)')}`
      }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}>

        <span className={small ? 'text-sm' : 'text-base'}>{emotion.emoji}</span>
      </motion.div>
      <span className="text-[9px] font-medium text-foreground leading-tight">{emotion.label}</span>
      <span className="text-[7px] text-muted-foreground leading-tight">{emotion.meaning}</span>
    </motion.div>;


  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {/* Row 1: Core emotions */}
        <div className="flex items-center gap-2">
          {coreEmotions.map((emotion, i) =>
          <EmotionCircle key={emotion.label} emotion={emotion} index={i} baseDelay={0} />
          )}
        </div>
        
        {/* Row 2: Empathy emotions with warm background */}
        <motion.div
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-300/10 to-purple-400/10 border border-orange-300/20"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>

          <span className="text-[8px] text-orange-500 dark:text-orange-300 font-medium uppercase tracking-wider">Empathy</span>
          {empathyEmotions.map((emotion, i) =>
          <EmotionCircle key={emotion.label} emotion={emotion} index={i} baseDelay={0.5} />
          )}
        </motion.div>
        
        {/* Row 3: Negative emotions */}
        <div className="flex items-center gap-2 opacity-75">
          {negativeEmotions.map((emotion, i) =>
          <EmotionCircle key={emotion.label} emotion={emotion} index={i} baseDelay={0.7} small />
          )}
        </div>
      </div>
    </div>);

};

export const ChatIllustration = () =>
<div className="w-full h-full flex items-center justify-center px-4">
    <div className="w-full max-w-md space-y-2">
      {/* Chat input mockup */}
      <div className="bg-muted/30 rounded-2xl border border-border/30 shadow-xl overflow-hidden">
        {/* Text area */}
        <div className="px-4 pt-4 pb-2">
          <div className="text-sm text-muted-foreground">
            Ask me anything...
          </div>
        </div>
        
        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/20">
          {/* Left side */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-medium">
              <Plus className="w-3 h-3" />
              New
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          
          {/* Center */}
          <div className="text-[10px] text-muted-foreground font-medium">
            History
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-1.5">
            
            <motion.div
            className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>

              <Brain className="w-3.5 h-3.5 text-background" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  </div>;


export const FilesIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="flex items-center gap-4">
      {[
    { icon: FileText, label: 'PDF', color: 'text-red-500' },
    { icon: Image, label: 'Image', color: 'text-blue-500' },
    { icon: FileText, label: 'Doc', color: 'text-green-500' }].
    map((file, i) =>
    <motion.div
      key={file.label}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: i * 0.15 }}
      className="flex flex-col items-center gap-2">

          <div className="w-16 h-20 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center shadow-md">
            <file.icon className={`w-8 h-8 ${file.color}`} />
          </div>
          <span className="text-xs text-muted-foreground">{file.label}</span>
        </motion.div>
    )}
    </div>
  </div>;



export const NavigationIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 border-b border-border/30">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <Brain className="w-4 h-4 text-background" />
        </div>
        <div>
          <div className="font-semibold text-xs">AYN AI</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">Active</span>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-2">
        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border/50 text-muted-foreground text-xs bg-muted/30">
          <Search className="w-3 h-3" />
          Search chats...
        </div>
      </div>
      
      {/* Recent Chats */}
      <div className="px-2 pb-2">
        <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Recent Chats
        </div>
        <div className="flex flex-col items-center justify-center py-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center mb-1">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-[10px]">No recent chats</span>
        </div>
      </div>
    </div>
  </div>;


export const HistoryIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center relative">
            <MessageSquare className="w-4 h-4" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-medium">
              2
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs">Chat</div>
            <div className="text-[10px] text-muted-foreground">2 messages</div>
          </div>
        </div>
        <X className="w-3 h-3 text-muted-foreground" />
      </div>
      
      {/* Messages */}
      <div className="p-2 space-y-2">
        {/* User message */}
        <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-end">

          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] font-medium">You</span>
            <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
              <User className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="bg-foreground text-background px-2.5 py-1 rounded-xl rounded-br-sm text-xs">
            hello
          </div>
        </motion.div>
        
        {/* AYN message */}
        <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-start">

          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              <Brain className="w-2.5 h-2.5 text-background" />
            </div>
            <span className="text-[10px] font-medium">AYN</span>
            <span className="text-[10px]">😌</span>
          </div>
          <div className="bg-muted/50 px-2.5 py-1 rounded-xl rounded-bl-sm text-xs max-w-[160px]">
            😄 How's your day?
          </div>
        </motion.div>
      </div>
      
      {/* Footer buttons */}
      <div className="p-2 border-t border-border/30 flex gap-1.5">
        <button className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-border/50 text-[10px]">
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-red-200 text-red-500 text-[10px]">
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
    </div>
  </div>;


export const EmpathyIllustration = () =>
<div className="relative w-full h-full flex items-center justify-center">
    {/* Warm ambient glow */}
    <motion.div
    className="absolute inset-0 flex items-center justify-center"
    animate={{ opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 3, repeat: Infinity }}>

      <div className="w-48 h-48 rounded-full bg-gradient-to-r from-orange-300/20 to-purple-400/20 blur-3xl" />
    </motion.div>
    
    {/* Eye with warm glow */}
    <div className="relative">
      <motion.div
      className="relative w-28 h-28 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-2xl"
      style={{
        boxShadow: '0 0 60px hsl(25, 70%, 75%, 0.4), 0 0 100px hsl(280, 45%, 75%, 0.2)'
      }}>

        {/* Iris with warm color */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-300/40 to-purple-400/30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center">
            <Heart className="w-5 h-5 text-orange-300" />
          </div>
        </div>
      </motion.div>
      
      {/* Floating ember particles */}
      {[0, 1, 2, 3].map((i) =>
    <motion.div
      key={i}
      className="absolute w-2 h-2 rounded-full"
      style={{
        background: i % 2 === 0 ?
        'radial-gradient(circle, hsl(25, 70%, 75%) 0%, transparent 100%)' :
        'radial-gradient(circle, hsl(280, 45%, 75%) 0%, transparent 100%)',
        boxShadow: i % 2 === 0 ?
        '0 0 8px hsl(25, 70%, 65%)' :
        '0 0 8px hsl(280, 45%, 65%)',
        left: '50%',
        top: '50%'
      }}
      animate={{
        x: [0, Math.cos(i / 4 * Math.PI * 2) * 50],
        y: [0, Math.sin(i / 4 * Math.PI * 2) * 50 - 30],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0.3]
      }}
      transition={{
        duration: 3,
        delay: i * 0.5,
        repeat: Infinity
      }} />

    )}
    </div>
    
    {/* Labels */}
    <div className="absolute bottom-4 flex gap-4">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-300/20 border border-orange-300/30">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(25, 70%, 75%)' }} />
        <span className="text-xs text-orange-500 dark:text-orange-300">Comfort</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-400/20 border border-purple-400/30">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(280, 45%, 75%)' }} />
        <span className="text-xs text-purple-500 dark:text-purple-300">Support</span>
      </div>
    </div>
  </div>;


export const MicroBehaviorsIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      {/* Pupil dilation demo */}
      <div className="flex items-center gap-8">
        {/* Normal pupil */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-foreground" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">Normal</span>
        </div>
        
        {/* Arrow */}
        <motion.div
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-muted-foreground">

          →
        </motion.div>
        
        {/* Dilated pupil */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}>

            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <motion.div
              className="rounded-full bg-foreground"
              animate={{ width: [16, 24, 16], height: [16, 24, 16] }}
              transition={{ duration: 2, repeat: Infinity }} />

            </div>
          </motion.div>
          <span className="text-[10px] text-muted-foreground">Engaged</span>
        </div>
      </div>
      
      {/* Blink patterns */}
      <div className="flex items-center gap-4">
        {[
      { label: 'Slow Blink', desc: 'Comfort', delay: 0 },
      { label: 'Quick Blink', desc: 'Attention', delay: 0.3 },
      { label: 'Double Blink', desc: 'Understanding', delay: 0.6 }].
      map((blink, i) =>
      <motion.div
        key={blink.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: blink.delay }}
        className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">

            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-medium">{blink.label}</span>
            <span className="text-[8px] text-muted-foreground">{blink.desc}</span>
          </motion.div>
      )}
      </div>
    </div>
  </div>;


export const CreditsIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="w-56 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden p-4">
      {/* Header with circular progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">Credits</div>
            <div className="text-[10px] text-muted-foreground">Free Plan</div>
          </div>
        </div>
        
        {/* Circular progress */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
            <motion.circle
            cx="18" cy="18" r="14" fill="none" strokeWidth="3"
            className="text-primary"
            strokeDasharray="88"
            initial={{ strokeDashoffset: 88 }}
            animate={{ strokeDashoffset: 22 }}
            transition={{ duration: 1, delay: 0.3 }}
            strokeLinecap="round" />

          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold">3/5</span>
          </div>
        </div>
      </div>
      
      {/* Usage info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Today's Usage</span>
          <span className="font-medium">2 remaining</span>
        </div>
        
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          transition={{ duration: 1, delay: 0.3 }} />

        </div>
        
        <div className="text-[10px] text-muted-foreground text-center pt-1">
          Resets daily at midnight
        </div>
      </div>
    </div>
  </div>;


export const ProfileIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="w-52 bg-muted/30 rounded-xl border border-border/50 p-3 shadow-lg">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/30">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Your Name</p>
          <p className="text-[10px] text-muted-foreground">Free Plan</p>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="space-y-1">
        {/* Upgrade Button */}
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-xs font-medium">

          <Zap className="w-3 h-3 text-violet-500" />
          <span className="text-violet-600 dark:text-violet-400">Upgrade Plan</span>
        </motion.div>
        
        {[
      { icon: Settings, label: 'Settings' },
      { icon: HelpCircle, label: 'Tutorial' },
      { icon: MessageSquare, label: 'Support' },
      { icon: LogOut, label: 'Sign Out', danger: true }].
      map((item, i) =>
      <motion.div
        key={item.label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:bg-muted/50'}`}>

            <item.icon className="w-3 h-3" />
            {item.label}
          </motion.div>
      )}
      </div>
    </div>
  </div>;


export const EngineeringIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-semibold text-foreground">
        Engineering Suite
      </motion.div>
      
      {/* 2 Tool Cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Calculator, label: 'Engineering', subtitle: 'Structural Design', gradient: 'from-cyan-500/15 to-blue-500/15', border: 'border-cyan-500/30', iconColor: 'text-cyan-500', glowColor: 'hover:shadow-cyan-500/20' },
          { icon: ClipboardCheck, label: 'Compliance', subtitle: 'Code Check', gradient: 'from-teal-500/15 to-emerald-500/15', border: 'border-teal-500/30', iconColor: 'text-teal-500', glowColor: 'hover:shadow-teal-500/20' },
        ].map((tool, i) => (
          <motion.div
            key={tool.label}
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 200 }}
            className={`flex flex-col items-center gap-2 py-4 px-5 rounded-xl bg-card/60 border ${tool.border} backdrop-blur-sm shadow-md ${tool.glowColor} hover:shadow-lg transition-all duration-200`}>
            
            {/* Icon container */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center`}>
              <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-foreground">{tool.label}</span>
              <span className="text-[9px] text-muted-foreground">{tool.subtitle}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[10px] text-muted-foreground">
        Beam, Column, Slab & more ↗
      </motion.div>
    </div>
  </div>;


export const ComplianceIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 blur-2xl scale-150" />
      
      <div className="relative w-64 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 p-2.5 border-b border-border/30 bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <div className="font-semibold text-xs">Code Compliance</div>
            <div className="text-[10px] text-muted-foreground">IRC 2024 • NBC 2025</div>
          </div>
        </div>
        
        <div className="p-2 space-y-1.5">
          {[
        { label: 'Room Dimensions', status: 'pass' },
        { label: 'Ceiling Height', status: 'pass' },
        { label: 'Egress Windows', status: 'fail' },
        { label: 'Stair Geometry', status: 'pass' },
        { label: 'Fire Safety', status: 'warn' },
        { label: 'Door Clearance', status: 'pass' }].
        map((item, i) =>
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30">

              <span className="text-[10px] font-medium">{item.label}</span>
              {item.status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              {item.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
              {item.status === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            </motion.div>
        )}
        </div>
        
        <motion.div
        className="p-2 border-t border-border/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}>

          <div className="flex items-center justify-between text-[10px] px-2">
            <span className="text-emerald-500 font-medium">4 Passed</span>
            <span className="text-red-500 font-medium">1 Failed</span>
            <span className="text-amber-500 font-medium">1 Warning</span>
          </div>
        </motion.div>
      </div>
    </div>
  </div>;


export const DocumentsIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="flex items-center gap-6">
      {/* PDF Document */}
      <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col items-center gap-2">

        <div className="relative w-20 h-24 rounded-lg bg-background border border-border/50 shadow-lg overflow-hidden">
          <div className="h-6 bg-red-500/20 flex items-center justify-center border-b border-red-500/30">
            <span className="text-[8px] font-bold text-red-500">PDF</span>
          </div>
          <div className="p-2 space-y-1">
            <div className="h-1 w-full bg-muted rounded" />
            <div className="h-1 w-3/4 bg-muted rounded" />
            <div className="h-1 w-full bg-muted rounded" />
            <div className="h-1 w-1/2 bg-muted rounded" />
          </div>
          <div className="absolute bottom-1.5 right-1.5">
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">Reports</span>
      </motion.div>

      {/* Download arrow */}
      <motion.div
      animate={{ y: [0, 4, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}>

        <Download className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      {/* Excel Document */}
      <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center gap-2">

        <div className="relative w-20 h-24 rounded-lg bg-background border border-border/50 shadow-lg overflow-hidden">
          <div className="h-6 bg-emerald-500/20 flex items-center justify-center border-b border-emerald-500/30">
            <span className="text-[8px] font-bold text-emerald-500">XLSX</span>
          </div>
          <div className="p-1.5">
            <div className="grid grid-cols-3 gap-0.5">
              {Array.from({ length: 9 }).map((_, i) =>
            <div key={i} className="h-2 bg-muted/60 rounded-sm" />
            )}
            </div>
          </div>
          <div className="absolute bottom-1.5 right-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">Spreadsheets</span>
      </motion.div>
    </div>

  </div>;


export const ChartAnalyzerIllustration = () =>
<div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-2xl scale-150" />
      
      <div className="relative w-64 bg-background rounded-xl border border-border/50 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2.5 border-b border-border/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="font-semibold text-xs">BTC/USDT</div>
              <div className="text-[10px] text-muted-foreground">4H Timeframe</div>
            </div>
          </div>
          <div className="flex gap-1">
            {['Crypto', 'Stock', 'Forex'].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${i === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted/50 text-muted-foreground'}`}>
                {t}
              </motion.span>
            ))}
          </div>
        </div>
        
        {/* Mini candlestick chart */}
        <div className="p-3 flex items-end justify-center gap-1.5 h-28">
          {[
            { h: 40, body: 15, up: true },
            { h: 50, body: 20, up: false },
            { h: 35, body: 12, up: true },
            { h: 55, body: 25, up: true },
            { h: 45, body: 18, up: false },
            { h: 60, body: 22, up: true },
            { h: 48, body: 16, up: true },
            { h: 65, body: 28, up: true },
          ].map((candle, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: candle.h }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center justify-end relative"
              style={{ width: 8 }}>
              {/* Wick */}
              <div className={`w-px absolute top-0 bottom-0 ${candle.up ? 'bg-emerald-500/50' : 'bg-red-500/50'}`} />
              {/* Body */}
              <div
                className={`w-full rounded-sm ${candle.up ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ height: candle.body }}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Indicators */}
        <div className="px-3 pb-2 flex items-center gap-2">
          {[
            { label: 'RSI', value: '62.4', color: 'text-amber-500' },
            { label: 'MACD', value: '+0.12', color: 'text-emerald-500' },
          ].map((ind, i) => (
            <motion.div
              key={ind.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 text-[9px]">
              <span className="text-muted-foreground font-medium">{ind.label}</span>
              <span className={`font-semibold ${ind.color}`}>{ind.value}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Signal badge */}
        <motion.div
          className="p-2 border-t border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-500">BULLISH</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Confidence: 78%</span>
          </div>
        </motion.div>
      </div>
    </div>
  </div>;