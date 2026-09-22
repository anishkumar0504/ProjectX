import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Zap, Crown, CreditCard, Loader2, FileText } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const CONVERSION_RATE = 10; // 10 Credits = 1 File Generation

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  price: number;
  credits: number;
  features: string[];
  popular: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Loads the Razorpay checkout script once, reuses it on subsequent calls
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SubscribePage: React.FC = () => {
  const [credits, setCredits] = useState<number>(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("auth_token");

  const fetchUser = async (token: string) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    if (data.user) setCredits(data.user.credits ?? 0);
  };

  const fetchPlans = async () => {
    const res = await fetch(`${API_URL}/payment/plans`);
    if (!res.ok) throw new Error("Failed to fetch plans");
    const data = await res.json();
    setPlans(data.plans ?? []);
  };

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        window.location.href = "/auth";
        return;
      }
      try {
        await Promise.all([fetchUser(token), fetchPlans()]);
      } catch (err) {
        console.error("Init failed:", err);
        setError("Failed to load page. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handlePurchase = async (planId: string) => {
    setError(null);
    setProcessing(planId);

    const token = getToken();
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    try {
      // 1. Load Razorpay's checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Check your connection.");
      }

      // 2. Ask our backend to create a Razorpay order
      const orderRes = await fetch(`${API_URL}/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create order");
      }

      const orderData = await orderRes.json();
      // orderData: { orderId, razorpayOrderId, amount, currency, keyId, plan }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ProjectX",
        description: `${orderData.plan.name} — ${orderData.plan.credits} credits`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: any) => {
          // response: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
          try {
            const verifyRes = await fetch(`${API_URL}/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}));
              throw new Error(errData.message || "Payment verification failed");
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert(
                verifyData.alreadyProcessed
                  ? "Payment already processed — your credits are up to date."
                  : `Success! ${verifyData.creditsAdded} credits added.`
              );
              await fetchUser(token); // refresh balance
            } else {
              throw new Error("Verification returned unexpected response");
            }
          } catch (err: any) {
            console.error("Verification failed:", err);
            setError(err.message || "Payment verification failed. Contact support if money was deducted.");
          } finally {
            setProcessing(null);
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the checkout popup without paying
            setProcessing(null);
          },
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp: any) => {
        console.error("Payment failed:", resp.error);
        setError(resp.error?.description || "Payment failed. Please try again.");
        setProcessing(null);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Purchase failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
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
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30 font-sans">

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-neutral-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-neutral-200">
              {credits} Credits
            </span>
            <span className="text-xs text-neutral-500 ml-1">
              (~{Math.floor(credits / CONVERSION_RATE)} files)
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold tracking-wide text-blue-400 uppercase">
              For Engineers Who Submit at 8:59 AM
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
            Your lab report, done <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              before the coffee cools.
            </span>
          </h1>

          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-8">
            Stop stitching screenshots. ProjectX turns your LABS captures into a submission-ready
            <span className="text-white font-semibold"> .DOCX </span>
            in the exact college format.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> GPT-4 + Claude</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> ~30s Generation</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 100% Template Match</span>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const discount = getDiscount(plan.originalPrice, plan.price);
            const fileCount = Math.floor(plan.credits / CONVERSION_RATE);

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

                <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">You receive</p>
                      <p className="text-3xl font-bold text-blue-400">{plan.credits}</p>
                      <p className="text-xs text-neutral-500">processing credits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400 mb-1">Equals</p>
                      <div className="flex items-center gap-1 justify-end text-amber-400 font-bold">
                        <FileText className="w-4 h-4" />
                        <span className="text-xl">{fileCount}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500">lab reports</p>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-full opacity-50"></div>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1 text-center">
                    10 Credits = 1 File Generation
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-300">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
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

        <div className="mt-16 flex flex-wrap justify-center gap-8 text-xs text-neutral-500">
          {["Secure Payment", "Instant Activation", "College Format Guaranteed", "No Hidden Fees"].map((label) => (
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