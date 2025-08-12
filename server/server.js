import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import cors from "cors";
import crypto from "crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
import admin from "firebase-admin";
import serviceAccount from "./path-to-your-firebase-service-account.json"; // Replace with your Firebase service account key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = getFirestore();

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.send("Razorpay Payment Gateway API is running.");
});

// Create Order API
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, taskId } = req.body;
    if (!amount || !currency || !taskId) {
      return res.status(400).json({ success: false, message: "Invalid request parameters" });
    }

    // Verify task exists and is completed
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    const taskData = taskSnap.data();
    if (taskData.status !== "completed") {
      return res.status(400).json({ success: false, message: "Task is not completed" });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${taskId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, orderId: order.id, amount: order.amount, currency });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
});

// Verify Payment API
app.post("/verify-payment", async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature, taskId } = req.body;
    if (!orderId || !razorpayPaymentId || !razorpaySignature || !taskId) {
      return res.status(400).json({ success: false, message: "Invalid request parameters" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${orderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Update task in Firestore
    const taskRef = db.collection("tasks").doc(taskId);
    await taskRef.update({
      paymentStatus: "paid",
      paymentId: razorpayPaymentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});