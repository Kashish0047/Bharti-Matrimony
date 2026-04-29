import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import coupleImage from "../images/matrimony.jpeg";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchasingPlan, setPurchasingPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroTextY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroImageY = useTransform(scrollY, [0, 500], [0, -50]);

  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const [selectedDurations, setSelectedDurations] = useState({
    Basic: "1M",
    Gold: "3M",
    Premium: "1M",
  });

  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  const plans = [
    {
      name: "Basic",
      icon: "🟦",
      pricing: {
        "1M": { price: 999, duration: 30 },
        "3M": { price: 2499, duration: 90 },
        "6M": { price: 3999, duration: 180 },
      },
      features: [
        "👤 Complete Profile Creation",
        "📸 Upload Photos (up to 3)",
        "👥 3 Friend Requests/Day",
        "🔍 View 10 Profiles/Day",
        "🎯 Advanced Search Filters",
        "🤝 Send/Accept Friend Requests",
        "💬 Chat After Friend Accept (5 messages total)",
      ],
      limitations: [
        "❌ Cannot see contact details",
        "❌ Limited to 5 messages",
        "❌ No priority listing",
      ],
      badge: "Basic",
      color: "from-slate-600 to-slate-700",
      popular: false,
    },
    {
      name: "Gold",
      icon: "🟨",
      pricing: {
        "1M": { price: 1999, duration: 30 },
        "3M": { price: 4999, duration: 90 },
        "6M": { price: 7999, duration: 180 },
      },
      features: [
        "✅ Everything in Basic Plan",
        "💬 Unlimited Chat Messages",
        "📞 Share Contact Details Freely",
        "📱 Send WhatsApp/Email/Numbers",
        "📋 View 40 Contact Details/Day",
        "📞 Video/Voice Call Buttons",
        "⭐ GOLD Member Badge",
        "🚀 Priority Listing (30-40% boost)",
        "🔒 Hide Photos Privacy",
        "👻 Hide Last Seen/Online Status",
      ],
      badge: "Gold",
      color: "from-amber-500 to-orange-500",
      popular: true,
    },
    {
      name: "Premium",
      icon: "🟧",
      pricing: {
        "1M": { price: 2999, duration: 30 },
        "3M": { price: 7499, duration: 90 },
        "6M": { price: 11999, duration: 180 },
      },
      features: [
        "✅ Everything in Gold Plan",
        "👩‍❤️‍👨 Personal MatchMaker",
        "🎯 Expert Profile Guidance",
        "💡 Personalized Suggestions",
        "🏆 Higher Trust for Parents",
        "🚀 Ultimate Priority Boost (60-80%)",
        "⭐ Featured Profile on Top",
        "🥇 First in 'Recommended For You'",
        "💎 Premium Badge",
        "♾️ Unlimited Everything",
        "🔒 Advanced Privacy Features",
        "🎧 Dedicated Premium Support",
      ],
      badge: "Premium",
      color: "from-purple-600 to-pink-600",
      popular: false,
    },
  ];

  const handleDurationChange = (planName, duration) => {
    setSelectedDurations((prev) => ({
      ...prev,
      [planName]: duration,
    }));
  };

  const getCurrentPlanDetails = (plan) => {
    const selectedDuration = selectedDurations[plan.name];
    return {
      ...plan.pricing[selectedDuration],
      planName: plan.name,
    };
  };

  const handleBuyPlan = async (plan) => {
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment gateway is loading, please wait...");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first to purchase a plan");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    setPurchasingPlan(plan.name);

    try {
      // Check if user already has a subscription
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const subResponse = await axios.get(`${API_URL}/subscriptions/my-subscription`, config);
      
      if (subResponse.data.subscription) {
        toast.info("You are already a member!");
        setPurchasingPlan(null);
        return;
      }

      const planDetails = getCurrentPlanDetails(plan);

      const orderResponse = await axios.post(
        `${API_URL}/payments/create-order`,
        {
          planName: planDetails.planName,
          planPrice: planDetails.price,
          planDuration: planDetails.duration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { order, razorpayKeyId } = orderResponse.data;

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Bharti Matrimony",
        description: `${planDetails.planName} Plan - ${planDetails.duration} Days`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planName: planDetails.planName,
                planPrice: planDetails.price,
                planDuration: planDetails.duration,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (verifyResponse.data.success) {
              setPurchasingPlan(null);
              toast.success(
                "Payment successful! Redirecting to create profile..."
              );
              setTimeout(() => {
                navigate("/create-profile");
              }, 2000);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user"))?.name || "",
          email: JSON.parse(localStorage.getItem("user"))?.email || "",
        },
        theme: {
          color: "#f59e0b",
        },
        modal: {
          ondismiss: function () {
            setPurchasingPlan(null);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to initiate payment"
      );
      setPurchasingPlan(null);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await axios.post(`${API_URL}/contact`, contactData);
      toast.success("Your query has been sent!");
      setContactData({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send your query. Try again."
      );
    }
    setContactLoading(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        navigate("/admin");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <header
        id="hero"
        className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden"
      >
        <motion.div 
          style={{ y: heroBgY }}
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40">
        </motion.div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-28 flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
          <motion.div 
            style={{ y: heroTextY }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full md:w-1/2 space-y-8"
          >
            <div className="inline-block">
              <span className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-sm font-semibold text-white shadow-lg">
                ✨ Trusted by 10,000+ Couples
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
              Find Your
              <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Perfect Match
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed font-light">
              Where hearts meet destiny. Experience personalized matchmaking
              with privacy, care, and genuine connections that last forever.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#packages"
                className="inline-flex items-center gap-2 px-9 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300"
              >
                Get Started
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-9 py-4 border-2 border-slate-600 text-white font-semibold rounded-full hover:bg-slate-800 hover:border-slate-500 transition-all duration-300"
              >
                Contact Us
              </a>
            </div>
            <div className="flex items-center gap-8 pt-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-slate-900"
                  ></div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold text-lg">20+ Years Legacy</div>
                <div className="text-slate-400">Building happy families</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={{ y: heroImageY }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full md:w-1/2 flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur-3xl opacity-20"></div>
              <img
                src={coupleImage}
                alt="Happy Couple"
                className="relative h-[300px] md:h-[550px] w-full md:w-auto object-cover rounded-3xl shadow-2xl border-4 border-slate-800"
              />
            </div>
          </motion.div>
        </div>
      </header>

      <section
        id="packages"
        className="relative py-24 overflow-hidden bg-white"
      >
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-100/20 rounded-full blur-[150px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 mb-4 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold tracking-wider uppercase"
            >
              💎 Membership Options
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Choose Your <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Perfect Plan</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              Find the right path to your forever partner with our transparent and value-packed subscription tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {(() => {
              const planColors = {
                Basic: "from-slate-500 to-slate-700",
                Gold: "from-amber-400 to-orange-500",
                Premium: "from-purple-600 to-indigo-700"
              };

              return plans.map((plan, index) => {
                const currentPlan = getCurrentPlanDetails(plan);
                const selectedDuration = selectedDurations[plan.name];
                const accentColor = plan.name === "Basic" ? "slate" : plan.name === "Gold" ? "amber" : "purple";

                return (
                  <motion.article
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -15 }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className={`relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-500 group overflow-hidden ${
                      plan.popular
                        ? "bg-white border-amber-200 shadow-[0_20px_50px_rgba(245,158,11,0.15)] z-10"
                        : "bg-white/40 backdrop-blur-md border-slate-100 hover:border-slate-200 shadow-xl shadow-slate-200/40"
                    }`}
                  >
                    {/* Accent line at top */}
                    <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${planColors[plan.name]}`}></div>
                    
                    {plan.popular && (
                      <div className="absolute -right-12 top-8 rotate-45 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black py-1 w-40 text-center shadow-lg uppercase tracking-widest">
                        Best Value
                      </div>
                    )}

                    <div className="mb-8 text-center">
                      <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-tighter ${
                        plan.name === "Basic" ? "bg-slate-100 text-slate-600" : 
                        plan.name === "Gold" ? "bg-amber-100 text-amber-600" : 
                        "bg-purple-100 text-purple-600"
                      }`}>
                        {plan.badge} Member
                      </div>
                      
                      <div className="flex flex-col items-center gap-1 mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-400">₹</span>
                          <span className="text-5xl font-black text-slate-900 leading-none">
                            {currentPlan.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-400 italic">
                          for {currentPlan.duration} days
                        </div>
                      </div>

                      <div className="flex justify-center p-1 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                        {Object.keys(plan.pricing).map((duration) => (
                          <button
                            key={duration}
                            onClick={() => handleDurationChange(plan.name, duration)}
                            className={`flex-1 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                              selectedDuration === duration
                                ? `bg-white text-slate-900 shadow-md ring-1 ring-slate-100`
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {duration}
                          </button>
                        ))}
                      </div>

                      {selectedDuration !== "1M" && (
                        <div className="animate-bounce">
                          <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-emerald-500/30 uppercase tracking-widest">
                            🔥 Save {selectedDuration === "6M" ? "33%" : "15%"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="h-px bg-slate-100 flex-1"></span>
                        Include Features
                        <span className="h-px bg-slate-100 flex-1"></span>
                      </div>
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 group/item"
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm bg-${accentColor}-50 text-${accentColor}-600 group-hover/item:scale-110 transition-transform`}>
                              ✓
                            </div>
                            <span className="text-slate-600 font-semibold text-sm leading-tight">
                              {feature.replace(/^[^a-zA-Z]+/, "")}
                            </span>
                          </li>
                        ))}
                        {plan.limitations && plan.limitations.map((limitation, i) => (
                          <li
                            key={`limit-${i}`}
                            className="flex items-start gap-3 opacity-40 grayscale"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-slate-200 text-slate-300">
                              ✕
                            </div>
                            <span className="text-slate-400 font-medium text-sm leading-tight line-through">
                              {limitation.replace(/^[^a-zA-Z]+/, "")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleBuyPlan(plan)}
                      disabled={!!purchasingPlan || !razorpayLoaded}
                      className={`relative w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase text-xs transition-all duration-300 group-hover:scale-[1.02] active:scale-95 shadow-xl ${
                        plan.popular
                          ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-slate-100"
                      } ${
                        (purchasingPlan && purchasingPlan !== plan.name) || !razorpayLoaded
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {purchasingPlan === plan.name ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Securing Payment...
                          </>
                        ) : !razorpayLoaded ? (
                          "Initializing..."
                        ) : (
                          <>Select {plan.badge}</>
                        )}
                      </span>
                    </button>
                  </motion.article>
                );
              });
            })()}
          </div>
          
          {/* Comparison Section (Condensed Table) */}
          <div className="mt-24 max-w-4xl mx-auto">
            <div className="bg-slate-50/50 backdrop-blur-xl rounded-[3rem] p-1 border border-slate-100 shadow-sm">
              <div className="bg-white rounded-[2.8rem] p-8 md:p-12 shadow-inner">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Full Pricing Comparison</h3>
                  <div className="h-1 w-20 bg-amber-400 mx-auto rounded-full"></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-[10px]">Tier</th>
                        <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">1 Month</th>
                        <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">3 Months</th>
                        <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">6 Months</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(() => {
                        const planColors = {
                          Basic: "from-slate-500 to-slate-700",
                          Gold: "from-amber-400 to-orange-500",
                          Premium: "from-purple-600 to-indigo-700"
                        };
                        return plans.map((plan, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 pr-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${planColors[plan.name]}`}></div>
                                <span className="font-bold text-slate-800">{plan.badge}</span>
                              </div>
                            </td>
                            <td className="py-5 text-center font-black text-slate-900">₹{plan.pricing["1M"].price.toLocaleString()}</td>
                            <td className="py-5 text-center font-black text-slate-900">
                              <div>₹{plan.pricing["3M"].price.toLocaleString()}</div>
                              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Save 15%</div>
                            </td>
                            <td className="py-5 text-center font-black text-slate-900">
                              <div>₹{plan.pricing["6M"].price.toLocaleString()}</div>
                              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Save 33%</div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="stories"
        className="bg-gradient-to-br from-slate-100 to-slate-50 py-24"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 mb-6">
              Love Stories That{" "}
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Inspire
              </span>
            </h2>
            <p className="text-xl text-slate-600 font-light">
              Real couples, real happiness — see how we changed lives forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array(3)
              .fill()
              .map((_, i) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                  className="group p-10 bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 border border-slate-200"
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, j) => (
                      <svg
                        key={j}
                        className="w-6 h-6 text-amber-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-slate-700 mb-8 leading-relaxed text-lg font-light">
                    "Thanks to Bharti Matrimony's Gold plan, we found each other
                    and connected instantly. The premium features made all the
                    difference in our journey to happiness."
                  </blockquote>
                  <figcaption className="flex items-center gap-5 pt-6 border-t border-slate-200">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      P
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        Priya & Arjun
                      </div>
                      <div className="text-sm text-slate-500 font-medium">
                        Delhi
                      </div>
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            Our{" "}
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Legacy
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light">
            Two decades of trust, thousands of successful unions, and a
            commitment to bringing hearts together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative group overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-amber-500 to-orange-500 h-96"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <svg
                  className="w-32 h-32 text-white/90 relative animate-bounce"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-8 left-8 text-white">
              <div className="text-4xl font-black mb-2">10,000+</div>
              <div className="text-lg font-light">Happy Couples</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative group overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 h-96"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
                <svg
                  className="w-32 h-32 text-amber-400/90 relative"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-8 left-8 text-white">
              <div className="text-4xl font-black mb-2">20+ Years</div>
              <div className="text-lg font-light">Trusted Service</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="contact"
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black text-white mb-6">
              Let's Start Your Journey
            </h2>
            <p className="text-slate-300 text-xl font-light">
              Have questions? Our team is here to help you find the one.
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-white p-12 rounded-3xl shadow-2xl space-y-8"
            onSubmit={handleContactSubmit}
          >
            <div className="grid md:grid-cols-2 gap-8">
              <input
                className="px-6 py-5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition text-lg"
                type="text"
                placeholder="Your name"
                value={contactData.name}
                onChange={(e) =>
                  setContactData({ ...contactData, name: e.target.value })
                }
                required
              />
              <input
                className="px-6 py-5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition text-lg"
                type="email"
                placeholder="Your email"
                value={contactData.email}
                onChange={(e) =>
                  setContactData({ ...contactData, email: e.target.value })
                }
                required
              />
              <input
                className="px-6 py-5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition text-lg"
                type="number"
                placeholder="Your Phone Number"
                value={contactData.phone}
                onChange={(e) =>
                  setContactData({ ...contactData, phone: e.target.value })
                }
                required
              />
            </div>
            <textarea
              className="w-full px-6 py-5 border-2 border-slate-200 rounded-xl h-48 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none text-lg"
              placeholder="Queries..."
              value={contactData.message}
              onChange={(e) =>
                setContactData({ ...contactData, message: e.target.value })
              }
              required
            />
            <button
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              disabled={contactLoading}
            >
              {contactLoading ? "Sending..." : "Send Message →"}
            </button>
          </motion.form>
        </div>
      </section>

      <Footer />
    </>
  );
}
