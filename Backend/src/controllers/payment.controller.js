const razorpayService = require("../services/Razorpay.service");

// GET /api/payment/plans (public)
async function getPlans(req, res) {
  try {
    const plans = await razorpayService.listActivePlans();
    res.json({ plans });
  } catch (err) {
    console.error("[payment.getPlans]", err);
    res.status(500).json({ message: "Failed to load plans" });
  }
}

// POST /api/payment/create-order (auth required)
async function createOrder(req, res) {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: "planId is required" });

    const result = await razorpayService.createOrderForUser(req.user.id, planId);
    res.json(result);
  } catch (err) {
    if (err instanceof razorpayService.HttpError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error("[payment.createOrder]", err);
    res.status(500).json({ message: "Failed to create order" });
  }
  
}

// POST /api/payment/verify (auth required)
async function verifyPayment(req, res) {
  console.log("[payment.verifyPayment] request body:", req.body);
  try {
    const result = await razorpayService.verifyAndCapturePayment(req.user.id, req.body);
    console.log("[payment.verifyPayment] result:", result);
    res.json(result);
  } catch (err) {
    if (err instanceof razorpayService.HttpError) {
      console.warn("[payment.verifyPayment] handled error:", err.statusCode, err.message);
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error("[payment.verifyPayment] unexpected error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
}

// POST /api/payment/webhook (Razorpay server-to-server, raw body — no auth)
async function webhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body; // Buffer — route must use express.raw()

    if (!razorpayService.isWebhookSignatureValid(rawBody, signature)) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    await razorpayService.handleWebhookEvent(event);

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[payment.webhook]", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
}

module.exports = { getPlans, createOrder, verifyPayment, webhook };