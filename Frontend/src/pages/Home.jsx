import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import coupleImage from "../images/matrimony.jpeg";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  
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

    setLoading(true);

    try {
      const planDetails = getCurrentPlanDetails(plan);

      const orderResponse = await axios.post(
        "http://localhost:5000/api/payments/create-order",
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
              "http://localhost:5000/api/payments/verify",
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
            setLoading(false);
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
      setLoading(false);
    }
  };

 
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await axios.post("http://localhost:5000/api/contact", contactData);
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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-6 py-28 flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="w-full md:w-1/2 space-y-8">
            <div className="inline-block">
              <span className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-sm font-semibold text-white shadow-lg">
                ✨ Trusted by 10,000+ Couples
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black leading-tight tracking-tight">
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
          </div>

          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur-3xl opacity-20"></div>
              <img
                src={coupleImage}
                alt="Happy Couple"
                className="relative h-[550px] w-auto object-cover rounded-3xl shadow-2xl border-4 border-slate-800"
              />
            </div>
          </div>
        </div>
      </header>

      
      <section
        id="packages"
        className="max-w-7xl mx-auto px-6 py-24 bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-4">
            Choose Your Membership Plan
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Select the plan that best fits your journey. All plans include
            secure matchmaking, privacy, and dedicated support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {plans.map((plan, index) => {
            const currentPlan = getCurrentPlanDetails(plan);
            const selectedDuration = selectedDurations[plan.name];

            return (
              <article
                key={index}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-300 shadow-xl bg-white ${
                  plan.popular
                    ? "border-amber-400 ring-2 ring-amber-200 scale-105 z-10"
                    : "border-slate-200 hover:border-amber-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-6 py-2 bg-amber-500 text-white text-xs font-bold rounded-full shadow uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                
                <div className="mb-6 text-center">
                  <div className="text-2xl font-bold text-slate-800 mb-2">
                    {plan.badge} Plan
                  </div>
                  <div className="flex justify-center gap-2 mb-2">
                    {Object.keys(plan.pricing).map((duration) => (
                      <button
                        key={duration}
                        onClick={() =>
                          handleDurationChange(plan.name, duration)
                        }
                        className={`px-3 py-1 rounded font-semibold text-sm border transition ${
                          selectedDuration === duration
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-amber-50"
                        }`}
                      >
                        {duration === "1M"
                          ? "1 Month"
                          : duration === "3M"
                          ? "3 Months"
                          : "6 Months"}
                      </button>
                    ))}
                  </div>
                  <div className="text-4xl font-extrabold text-slate-900 mb-1">
                    ₹{currentPlan.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">
                    for {currentPlan.duration} days
                  </div>
                  {selectedDuration !== "1M" && (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        {selectedDuration === "6M" ? "Save 33%" : "Save 15%"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="font-semibold text-slate-700 mb-2">
                    Features:
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-slate-700 text-sm"
                      >
                        <svg
                          className="w-4 h-4 text-amber-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature.replace(/^[^a-zA-Z]+/, "")}
                      </li>
                    ))}
                  </ul>
                </div>

              
                {plan.limitations && (
                  <div className="mb-6">
                    <div className="font-semibold text-red-600 mb-2">
                      Limitations:
                    </div>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-red-500 text-xs"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-7a1 1 0 112 0 1 1 0 01-2 0zm1-5a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {limitation.replace(/^[^a-zA-Z]+/, "")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

          
                <button
                  onClick={() => handleBuyPlan(plan)}
                  disabled={loading || !razorpayLoaded}
                  className={`w-full py-3 rounded-lg font-bold transition-all duration-300 shadow ${
                    plan.popular
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  } ${
                    loading || !razorpayLoaded
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}
                >
                  {loading
                    ? "Processing..."
                    : !razorpayLoaded
                    ? "Loading..."
                    : `Choose ${plan.badge} Plan`}
                </button>
              </article>
            );
          })}
        </div>

        
        <div className="mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Pricing Overview
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="pb-4 font-bold text-slate-900">Plan</th>
                    <th className="pb-4 font-bold text-slate-700 text-center">
                      1 Month
                    </th>
                    <th className="pb-4 font-bold text-slate-700 text-center">
                      3 Months
                    </th>
                    <th className="pb-4 font-bold text-slate-700 text-center">
                      6 Months
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">
                            {plan.badge}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-center font-bold text-slate-700">
                        ₹{plan.pricing["1M"].price.toLocaleString()}
                      </td>
                      <td className="py-4 text-center">
                        <div className="font-bold text-slate-700">
                          ₹{plan.pricing["3M"].price.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          Save 15%
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className="font-bold text-slate-700">
                          ₹{plan.pricing["6M"].price.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          Save 33%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <figure
                  key={i}
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
                </figure>
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
          <div className="relative group overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-amber-500 to-orange-500 h-96">
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
          </div>

          <div className="relative group overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 h-96">
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
          </div>
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

          <form
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
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}
