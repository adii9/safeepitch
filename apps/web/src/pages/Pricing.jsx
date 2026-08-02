import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bot, Check, X, Zap, Users, Database, Mail, FileText, Shield, Headphones, Crown, Globe, Clock, BarChart3 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PLANS = [
  {
    name: 'Starter',
    planKey: 'starter',
    price: { usd: '$375', inr: '₹30,000' },
    period: 'per month',
    badge: null,
    cta: 'Start Free Trial',
    ctaStyle: 'secondary',
    description: 'Perfect for early-stage funds getting started with AI-powered deal flow.',
    decksIncluded: '40',
    decksOverage: { usd: '$7.50', inr: '₹600' },
    features: [
      { icon: Bot, label: 'AI Audit', sublabel: 'Full CrewAI audit — team, market & financials', included: true },
      { icon: Database, label: 'CRM Sync', sublabel: 'Google Sheets only', included: true },
      { icon: Mail, label: 'Email Inbox', sublabel: '1 inbox connected', included: true },
      { icon: FileText, label: 'Audit Reports', sublabel: 'Standard structured format', included: true },
      { icon: Shield, label: 'Red Flag Detection', sublabel: '', included: false },
      { icon: Globe, label: 'API Access', sublabel: '', included: false },
      { icon: Headphones, label: 'Priority Support', sublabel: '', included: false },
    ],
    gradient: 'rgba(59, 130, 246, 0.05)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  {
    name: 'Growth',
    planKey: 'growth',
    price: { usd: '$688', inr: '₹55,000' },
    period: 'per month',
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    ctaStyle: 'primary',
    description: 'For active funds processing serious deal flow with full CRM integration.',
    decksIncluded: '120',
    decksOverage: { usd: '$5', inr: '₹400' },
    features: [
      { icon: Bot, label: 'AI Audit', sublabel: 'Full CrewAI audit + detailed red flags report', included: true },
      { icon: Database, label: 'CRM Sync', sublabel: 'Sheets + Affinity + HubSpot', included: true },
      { icon: Mail, label: 'Email Inbox', sublabel: 'Up to 3 inboxes connected', included: true },
      { icon: FileText, label: 'Audit Reports', sublabel: 'Detailed format with comparison views', included: true },
      { icon: Shield, label: 'Red Flag Detection', sublabel: 'AI-powered risk identification', included: true },
      { icon: Globe, label: 'API Access', sublabel: 'Full REST API access', included: true },
      { icon: Headphones, label: 'Priority Support', sublabel: 'Fast-response dedicated channel', included: true },
    ],
    gradient: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.4)',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    planKey: 'enterprise',
    price: { usd: '$1,250+', inr: '₹1,00,000+' },
    period: 'per month',
    badge: null,
    cta: 'Start Free Trial',
    ctaStyle: 'secondary',
    description: 'For funds that need unlimited scale, white-label reports, and dedicated support.',
    decksIncluded: 'Unlimited',
    decksOverage: { usd: 'Included', inr: 'Included' },
    features: [
      { icon: Bot, label: 'AI Audit', sublabel: 'Custom configuration + white-label reports', included: true },
      { icon: Database, label: 'CRM Sync', sublabel: 'Salesforce + Affinity + HubSpot + Custom API', included: true },
      { icon: Mail, label: 'Email Inbox', sublabel: 'Unlimited inboxes', included: true },
      { icon: FileText, label: 'Audit Reports', sublabel: 'Custom branded PDF reports', included: true },
      { icon: Shield, label: 'Red Flag Detection', sublabel: 'Built-in detection', included: true },
      { icon: Globe, label: 'API Access', sublabel: 'Full REST API access', included: true },
      { icon: Headphones, label: 'Priority Support', sublabel: 'Dedicated account manager', included: true },
      { icon: Users, label: 'Onboarding', sublabel: 'Custom setup & training', included: true },
      { icon: Clock, label: 'SLA', sublabel: '99.9% uptime guarantee', included: true },
    ],
    gradient: 'rgba(6, 182, 212, 0.05)',
    border: 'rgba(6, 182, 212, 0.2)',
  },
];

const FAQ = [
  {
    q: 'What counts as a "pitch deck"?',
    a: 'A single pitch deck submission per company counts as one deck. Re-submissions of the same deck within 90 days are not counted again.',
  },
  {
    q: 'What happens if I exceed my monthly deck limit?',
    a: 'You can purchase additional decks at the overage rate. We\'ll notify you when you reach 80% of your limit so you\'re never caught off guard.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every new user gets a 1-month free trial with full access to all features. No credit card required — just sign in and start using SafeDeck. After 30 days, you\'ll be asked to choose a plan to continue.',
  },
  {
    q: 'Can I switch plans mid-month?',
    a: 'Yes, upgrades take effect immediately. Downgrades take effect at the next billing cycle.',
  },
  {
    q: 'What does "CrewAI audit" actually cover?',
    a: 'Our AI agents independently evaluate the founding team, market size & TAM, business model, financial metrics, competitive positioning, and red flags — then synthesizes everything into a structured report.',
  },
  {
    q: 'Which CRMs are supported?',
    a: 'Growth includes Affinity and HubSpot. Enterprise adds Salesforce and any custom API endpoint.',
  },
];

const FeatureIcon = ({ Icon, label, sublabel, included }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }}>
    <div style={{
      width: '36px', height: '36px',
      borderRadius: '8px',
      background: included ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${included ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {included
        ? <Check size={16} color="var(--accent-green)" />
        : <X size={16} color="var(--text-secondary)" style={{ opacity: 0.4 }} />
      }
    </div>
    <div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</div>
      {sublabel && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sublabel}</div>}
    </div>
  </div>
);

const PricingCard = ({ plan, index }) => {
  const navigate = useNavigate();
  return (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: index * 0.15 }}
    style={{
      position: 'relative',
      background: plan.highlighted
        ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.06))'
        : plan.gradient,
      border: `1px solid ${plan.border}`,
      borderRadius: '24px',
      padding: '2.5rem',
      display: 'flex',
      flexDirection: 'column',
      transform: plan.highlighted ? 'scale(1.03)' : 'scale(1)',
      boxShadow: plan.highlighted ? '0 20px 60px rgba(139, 92, 246, 0.2)' : '0 8px 32px rgba(0,0,0,0.3)',
    }}
  >
    {plan.badge && (
      <div style={{
        position: 'absolute',
        top: '-14px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
        color: 'white',
        padding: '0.35rem 1.25rem',
        borderRadius: '100px',
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
      }}>
        {plan.badge}
      </div>
    )}

    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '2.5rem' }}>{plan.description}</p>
    </div>

    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price.inr}</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
        {plan.price.usd} {plan.period}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Exchange rate: 1 USD = ₹80</div>
    </div>

    {/* Deck & User Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {[
        { icon: FileText, label: 'Decks/mo', value: plan.decksIncluded },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.15rem' }}>{value}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        </div>
      ))}
    </div>

    {plan.decksOverage.usd !== 'Included' && (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '0.6rem 0.85rem',
        marginBottom: '1.5rem',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        Extra decks: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{plan.price.usd === '$375' ? plan.decksOverage.inr : plan.decksOverage.inr}</span>/deck beyond limit
      </div>
    )}

    <button
      className={`btn btn-${plan.ctaStyle}`}
      style={{ width: '100%', marginBottom: '1.5rem' }}
      onClick={() => navigate(`/checkout?plan=${plan.planKey}`)}
    >
      {plan.cta}
    </button>

    <div>
      {plan.features.map((f, i) => (
        <FeatureIcon key={i} {...f} />
      ))}
    </div>
  </motion.div>
  );
};

const FaqItem = ({ item, index }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: '1.25rem',
        marginBottom: '1.25rem',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: open ? '0.75rem' : 0,
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{item.q}</h4>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <span style={{ color: 'var(--accent-purple)', fontSize: '1.2rem', fontWeight: 300 }}>+</span>
        </motion.div>
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.7 }}
        >
          {item.a}
        </motion.p>
      )}
    </motion.div>
  );
};

const Pricing = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header />

      {/* Hero */}
      <section className="section-padding" style={{
        padding: '160px 0 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '100px',
              padding: '0.4rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--accent-purple)',
            }}>
              <Zap size={14} />
              Simple, transparent pricing
            </div>

            <h1 style={{ marginBottom: '1.5rem' }}>
              Spend Less Time on <span className="text-gradient">Admin</span>,<br />
              More Time on <span className="text-gradient">Deals</span>
            </h1>
            <p style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 3rem',
              lineHeight: 1.8,
            }}>
              SafeDeck replaces a full-time deal intake analyst. For the price of one junior hire,
              you get unlimited pitch deck audits — delivered to your CRM automatically.
            </p>

            {/* Social proof */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
            }}>
              <div style={{ display: 'flex' }}>
                {['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'].map((c, i) => (
                  <div key={i} style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: c,
                    border: '2px solid var(--bg-primary)',
                    marginLeft: i > 0 ? '-8px' : 0,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Trusted by <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>12 VC funds</span> across India
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding" style={{ padding: '0 0 100px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}>
            {PLANS.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} index={i} />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}
          >
            All prices in INR. USD prices shown for reference at 1 USD = ₹80.
          </motion.p>
        </div>
      </section>

      {/* ROI Calculator teaser */}
      <section className="section-padding" style={{ padding: '0 0 100px' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mobile-p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.05))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '24px',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <BarChart3 size={36} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>The Math is Simple</h2>
            <div style={{
              display: 'flex',
              gap: '2rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}>
              {[
                { label: 'Average analyst time per deck', value: '45 mins' },
                { label: 'Decks a fund processes/month', value: '~60' },
                { label: 'Hours saved per month', value: '45 hours' },
                { label: 'Cost of one Starter seat', value: '₹30K/mo' },
              ].map(({ label, value }) => (
                <div key={label} style={{ minWidth: '160px' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              That's less than the cost of a fraction of one junior analyst's time — with zero recruitment overhead.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding" style={{ padding: '0 0 120px' }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{ fontSize: '2rem' }}>Frequently Asked <span className="text-gradient">Questions</span></h2>
          </motion.div>

          <div>
            {FAQ.map((item, i) => (
              <FaqItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
