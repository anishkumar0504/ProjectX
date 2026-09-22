import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Zap, Crown, CreditCard, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    originalPrice: 69,
    price: 49,
    credits: 50,
    features: ["50 Processing Credits", "30-day validity", "Standard support"],
  },
  {
    id: "pro",
    name: "PRO MODE",
    originalPrice: 249,
    price: 149,
    credits: 200,
    features: [
      "200 Processing Credits",
      "60-day validity",
      "Priority processing",
      "Batch uploads",
      "Advanced analytics",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    originalPrice: 799,
    price: 499,
    credits: 1000,
    features: [
      "1000 Processing Credits",
      "90-day validity",
      "Highest priority",
      "Dedicated support",
      "Custom integrations",
      "Team collaboration",
    ],
  },
];

const SubscribePage: React.FC = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      // ✅ Use auth_token to match Topbar
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        // If no token, redirect to auth
        window.location.href = "/auth";
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) throw new Error("Failed to fetch user");
        
        const data = await res.json();
        if (data.user) {
          // ✅ Set exact credits from backend (e.g., 0, 10, or any other amount)
          setCredits(data.user.credits ?? 0);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handlePurchase = async (planId: string) => {
    setProcessing(planId);
    try {
      // TODO: Replace with actual payment gateway integration (Razorpay/Stripe)
      // For now, simulating a successful purchase
      await new Promise((r) => setTimeout(r, 2000));
      
      alert(`Successfully purchased ${PLANS.find((p) => p.id === planId)?.credits} credits!`);
      
      // Refresh user data to show new balance
      const token = localStorage.getItem("auth_token");
      if (token) {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.user) setCredits(data.user.credits ?? 0);
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const getDiscount = (original: number, current: number) =>
    Math.round(((original - current) / original) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    // ✅ Dark Theme Only Background
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-neutral-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {/* Current Balance Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-neutral-200">
              {credits} Credits
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wide text-amber-400 uppercase">
              Pro Mode Unlocked
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Choose Your Credit Pack
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            Premium processing credits with instant activation and volume discounts.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const discount = getDiscount(plan.originalPrice, plan.price);
            return (
              <div
                key={plan.id}
                className={`relative group rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 ${
                  plan.popular
                    ? "border-blue-500 bg-neutral-900/50"
                    : "border-white/10 bg-neutral-900/30 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {plan.popular && <Crown className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-base text-neutral-500 line-through">₹{plan.originalPrice}</span>
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[11px] font-bold border border-green-500/20">
                    {discount}% OFF
                  </span>
                </div>

                {/* Credits Highlight */}
                <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-xs text-neutral-400 mb-1">You receive</p>
                  <p className="text-3xl font-bold text-amber-400">{plan.credits}</p>
                  <p className="text-xs text-neutral-500">processing credits</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={!!processing}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-white text-neutral-950 hover:bg-neutral-200"
                  }`}
                >
                  {processing === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                    </span>
                  ) : (
                    `Get ${plan.credits} Credits`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 text-xs text-neutral-500">
          {["Secure Payment", "Instant Activation", "24/7 Support", "Money-back Guarantee"].map((label) => (
            <div key={label} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-600" />
              {label}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SubscribePage;