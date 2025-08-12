import React, { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { Button } from "../components/ui/Button";

const PaymentPage = ({ navigateTo, theme, toggleTheme, isAuthenticated, taskId, budget }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle payment initiation with Razorpay
  const handlePayNow = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount * 100, taskId }), // Amount in paise
      });

      const order = await response.json();
      if (!order.id) {
        throw new Error(order.message || "Failed to create order");
      }

      const options = {
        key: "rzp_test_Lj8YEwFBhfaOk0",
        amount: totalAmount * 100,
        currency: "INR",
        name: "Task Payment",
        description: `Payment for Task ${taskId}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch("http://localhost:5000/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                taskId,
              }),
            });

            const result = await verifyResponse.json();
            if (result.success) {
              setLoading(false);
              alert(`Payment of ₹${totalAmount.toLocaleString("en-IN")} for Task ${taskId} successful!`);
              navigateTo("task", { taskId });
            } else {
              throw new Error(result.message || "Payment verification failed");
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setLoading(false);
            setError(err.message || "Payment verification failed");
          }
        },
        prefill: {
          name: isAuthenticated?.displayName || "User",
          email: isAuthenticated?.email || "user@example.com",
        },
        theme: {
          color: theme === "light" ? "#10B981" : "#059669",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error('Razorpay payment failed:', response.error);
        setLoading(false);
        setError(response.error.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      setLoading(false);
      setError(err.message || "Failed to initiate payment");
    }
  };

  // Calculate total with GST (18%)
  const baseAmount = budget || 500; // Fallback to 500 if no budget
  const gst = Number((baseAmount * 0.18).toFixed(2));
  const totalAmount = Number((baseAmount + gst).toFixed(2));

  return (
    <div className={`min-h-screen ${theme === "light" ? "bg-gradient-to-br from-emerald-50 via-white to-blue-50" : "bg-gray-900"} flex flex-col`}>
      <Header
        navigateTo={navigateTo}
        currentPage="payment"
        theme={theme}
        toggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex-grow max-w-md mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigateTo("task", { taskId })}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back to task"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Task Payment</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 mb-4">
              <CreditCard size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Complete payment to release funds for this task.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Task Budget</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-300 font-medium">GST (18%)</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{gst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center text-base sm:text-lg font-semibold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center mt-6 font-medium">{error}</p>
          )}

          <Button
            onClick={handlePayNow}
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2 inline-block" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2 inline-block" />
            )}
            {loading ? "Processing..." : "Pay Now"}
          </Button>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
            Secured payment powered by Razorpay. Your information is encrypted.
          </p>
        </div>
      </main>

      <BottomNav navigateTo={navigateTo} currentPage="payment" theme={theme} />
    </div>
  );
};

export default PaymentPage;