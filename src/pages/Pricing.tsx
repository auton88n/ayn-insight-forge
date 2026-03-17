import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Building2, Sparkles, ArrowLeft, Loader2, Shield, CreditCard, ChevronDown, Brain, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSubscription, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/contexts/SubscriptionContext';
import { SEO } from '@/components/shared/SEO';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GlassCard, GlassButton, GlassContainer, GlassInput, GlassBadge } from '@/components/ui/glass';

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Sparkles className="w-5 h-5" />,
  starter: <Zap className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
  business: <Building2 className="w-5 h-5" />,
  enterprise: <Star className="w-5 h-5" />,
  unlimited: <Star className="w-5 h-5" />,
};

const tierAccents: Record<string, { glow: "purple" | "blue" | "orange" | "emerald" | "amber"; badge: "purple" | "blue" | "orange" | "emerald" | "amber"; check: string; btn: "default" | "primary" | "accent" | "outline"; }> = {
  free: { glow: "blue", badge: "blue", check: "bg-[hsl(210_90%_55%)]", btn: "outline" },
  starter: { glow: "blue", badge: "blue", check: "bg-[hsl(210_90%_55%)]", btn: "default" },
  pro: { glow: "purple", badge: "purple", check: "bg-[hsl(270_70%_55%)]", btn: "primary" },
  business: { glow: "emerald", badge: "emerald", check: "bg-[hsl(160_60%_45%)]", btn: "default" },
  enterprise: { glow: "amber", badge: "amber", check: "bg-[hsl(40_95%_55%)]", btn: "accent" },
  unlimited: { glow: "emerald", badge: "emerald", check: "bg-[hsl(160_60%_45%)]", btn: "default" },
};

const faqItems = [
  { question: 'What are messages?', answer: 'Each AI interaction counts as one message. Free users get 5 messages per day (resets daily). Paid users receive their full monthly allowance upfront.' },
  { question: 'What is PDF & Excel generation?', answer: 'Paid users can ask AYN to generate professional documents like reports, spreadsheets, and presentations.' },
  { question: 'Can I upgrade or downgrade anytime?', answer: 'Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your billing cycle.' },
  { question: 'What happens if I run out of messages?', answer: 'Free users wait until the next day for messages to reset. Paid users can purchase a top-up of 500 extra messages for $10, or upgrade to a higher plan.' },
  { question: 'Is there a free trial?', answer: 'Our Free tier gives you 5 messages per day to try AYN — no credit card required.' },
  { question: 'Is there a refund policy?', answer: 'All payments are final and non-refundable. You can cancel anytime and keep access until the end of your billing period.' },
  { question: 'What is included in Enterprise?', answer: 'Enterprise plans include custom message limits, tailored AI solutions, and 24/7 priority support. Contact our sales team to discuss your needs.' },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { tier: currentTier, isLoading, isSubscribed, startCheckout, openCustomerPortal } = useSubscription();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({ companyName: '', email: '', requirements: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = (tier: SubscriptionTier) => {
    if (tier === 'enterprise') { setShowEnterpriseModal(true); return; }
    if (tier === currentTier) { if (isSubscribed) openCustomerPortal(); return; }
    if (tier === 'free') { if (isSubscribed) openCustomerPortal(); return; }
    startCheckout(tier);
  };

  const handleEnterpriseSubmit = async () => {
    if (!enterpriseForm.companyName || !enterpriseForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: enterpriseForm.companyName,
        email: enterpriseForm.email,
        message: `[ENTERPRISE INQUIRY]\n\n${enterpriseForm.requirements || 'User requested Enterprise pricing information'}`
      });
      if (error) throw error;
      toast.success('Thank you! Our team will contact you within 24 hours.');
      setShowEnterpriseModal(false);
      setEnterpriseForm({ companyName: '', email: '', requirements: '' });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Enterprise inquiry error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = (tier: SubscriptionTier) => {
    if (tier === 'enterprise') return 'Contact Sales';
    if (tier === currentTier) return isSubscribed ? 'Manage Plan' : 'Current Plan';
    if (tier === 'free') return isSubscribed ? 'Downgrade' : 'Get Started';
    const tierOrder: SubscriptionTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];
    return tierOrder.indexOf(tier) > tierOrder.indexOf(currentTier) ? 'Upgrade' : 'Switch Plan';
  };

  const displayTiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];

  return (
    <>
      <SEO
        title="Pricing - AYN"
        description="Choose the perfect plan for your needs. From free to enterprise, we have options for everyone."
        canonical="/pricing"
        keywords="AYN pricing, AI assistant pricing, business AI plans, subscription plans"
        noIndex={true}
      />

      <GlassContainer gradient="aurora" className="text-white">
        <div className="container max-w-7xl mx-auto px-4 py-12 relative z-10">
          {/* Back */}
          <GlassButton variant="ghost" onClick={() => navigate('/')} className="mb-8 text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </GlassButton>

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[hsl(0_0%_100%/0.1)] backdrop-blur-xl border border-[hsl(0_0%_100%/0.15)] mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight text-white">
              Choose Your Plan
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Unlock the full power of AYN. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-12">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[440px] rounded-3xl bg-[hsl(0_0%_100%/0.05)]" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-12 items-start">
                {displayTiers.map((tier) => {
                  const config = SUBSCRIPTION_TIERS[tier];
                  const accent = tierAccents[tier];
                  const isCurrentPlan = tier === currentTier;
                  const isPopular = tier === 'pro';
                  const isEnterprise = tier === 'enterprise';

                  return (
                    <GlassCard
                      key={tier}
                      variant={isPopular ? "elevated" : "default"}
                      glow={accent.glow}
                      hover="glow"
                      className={cn(
                        'flex flex-col relative',
                        isCurrentPlan && 'ring-2 ring-white/30',
                        isPopular && 'xl:-mt-4 xl:mb-4 ring-2 ring-[hsl(270_70%_55%/0.5)]',
                      )}
                    >
                      {/* Popular badge */}
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <GlassBadge variant="purple" className="shadow-lg shadow-[hsl(270_70%_50%/0.3)]">
                            <Sparkles className="w-3 h-3" />
                            Most Popular
                          </GlassBadge>
                        </div>
                      )}

                      {/* Current plan badge */}
                      {isCurrentPlan && (
                        <div className="absolute -top-3 right-4 z-10">
                          <GlassBadge variant="blue" className="text-[10px]">
                            Your Plan
                          </GlassBadge>
                        </div>
                      )}

                      {/* Tier name + icon */}
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2 rounded-xl bg-[hsl(0_0%_100%/0.08)] backdrop-blur-sm">
                          {tierIcons[tier]}
                        </div>
                        <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        {isEnterprise ? (
                          <>
                            <span className="text-3xl font-display font-bold tracking-tight text-white">
                              Contact Us
                            </span>
                            <p className="text-xs text-white/40 mt-1.5">Tailored for your business</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-display font-bold tracking-tight text-white">
                                ${config.price}
                              </span>
                              <span className="text-sm text-white/40">/month</span>
                            </div>
                            {tier !== 'free' && (
                              <p className="text-xs text-white/40 mt-1.5">Billed monthly. Cancel anytime.</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[hsl(0_0%_100%/0.08)] mb-5" />

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-grow">
                        {config.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5', accent.check)}>
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="text-sm text-white/60">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <GlassButton
                        onClick={() => handleAction(tier)}
                        variant={isCurrentPlan && !isSubscribed ? "ghost" : accent.btn}
                        size="default"
                        className={cn(
                          'w-full',
                          isCurrentPlan && !isSubscribed && 'text-white/40 cursor-default hover:bg-transparent',
                        )}
                        disabled={isCurrentPlan && !isSubscribed}
                      >
                        {isCurrentPlan && !isSubscribed ? (
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            Current Plan
                          </span>
                        ) : getButtonText(tier)}
                      </GlassButton>
                    </GlassCard>
                  );
                })}
              </div>

              {/* Trust */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/40 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>No Hidden Fees</span>
                </div>
              </div>

              <p className="text-center text-xs text-white/30 mb-20">
                By subscribing, you agree to our Terms of Service and No Refund Policy.
              </p>
            </>
          )}

          {/* FAQ */}
          <div className="max-w-2xl mx-auto pb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <Collapsible
                  key={index}
                  open={openFaq === index}
                  onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <GlassCard size="sm" hover="none" className="overflow-hidden">
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-left p-0">
                      <span className="font-medium text-white/90">{item.question}</span>
                      <ChevronDown className={cn("w-5 h-5 text-white/40 transition-transform duration-200 shrink-0 ml-4", openFaq === index && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <p className="text-white/50 text-sm leading-relaxed mt-3 pt-3 border-t border-[hsl(0_0%_100%/0.08)]">{item.answer}</p>
                    </CollapsibleContent>
                  </GlassCard>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise Modal */}
        <Dialog open={showEnterpriseModal} onOpenChange={setShowEnterpriseModal}>
          <DialogContent className="sm:max-w-md bg-[hsl(260_30%_12%)] border-[hsl(0_0%_100%/0.12)] backdrop-blur-2xl text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5 text-[hsl(40_95%_55%)]" />
                Enterprise Inquiry
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Tell us about your business needs and we'll create a custom plan for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white/70">Company Name *</Label>
                <GlassInput id="companyName" placeholder="Your company name" value={enterpriseForm.companyName} onChange={(e) => setEnterpriseForm(prev => ({ ...prev, companyName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">Contact Email *</Label>
                <GlassInput id="email" type="email" placeholder="you@company.com" value={enterpriseForm.email} onChange={(e) => setEnterpriseForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-white/70">Requirements (optional)</Label>
                <textarea
                  id="requirements"
                  placeholder="Tell us about your needs..."
                  value={enterpriseForm.requirements}
                  onChange={(e) => setEnterpriseForm(prev => ({ ...prev, requirements: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-2xl border bg-[hsl(0_0%_100%/0.08)] border-[hsl(0_0%_100%/0.15)] px-4 py-3 text-sm text-white backdrop-blur-sm placeholder:text-[hsl(0_0%_100%/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270_70%_55%/0.5)] transition-all duration-200"
                />
              </div>
              <GlassButton
                variant="accent"
                size="lg"
                onClick={handleEnterpriseSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Inquiry
              </GlassButton>
            </div>
          </DialogContent>
        </Dialog>
      </GlassContainer>
    </>
  );
};

export default Pricing;
