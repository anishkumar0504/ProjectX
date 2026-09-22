const crypto = require("crypto");
const razorpay = require("../config/Razorpay");
const prisma = require("../config/prisma"); // point this at your existing prisma client if you have one

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// GET /plans — frontend replaces its hardcoded SUBSCRIPTION_CONFIG with this
async function listActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return plans;
}

// POST /create-order
async function createOrderForUser(userId, planId) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    throw new HttpError(404, "Plan not found");
  }

  const amountInPaise = plan.price * 100;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${userId}_${Date.now()}`,
    notes: { userId, planId: plan.id },
  });

  const order = await prisma.order.create({
    data: {
      userId,
      planId: plan.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      credits: plan.credits,
      status: "CREATED",
    },
  });

  return {
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    plan: { id: plan.id, name: plan.name, credits: plan.credits },
  };
}

function isSignatureValid(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ""));
}

// POST /verify — called from the frontend's Razorpay checkout success handler
async function verifyAndCapturePayment(userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  console.log("[verify] incoming:", { userId, razorpay_order_id, razorpay_payment_id });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.warn("[verify] missing fields in request body");
    throw new HttpError(400, "Missing payment verification fields");
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!order) {
    console.warn("[verify] no matching order found for razorpayOrderId:", razorpay_order_id);
    throw new HttpError(404, "Order not found");
  }

  if (order.userId !== userId) {
    console.warn("[verify] order belongs to different user:", { orderUserId: order.userId, requestUserId: userId });
    throw new HttpError(403, "Order does not belong to this user");
  }

  if (order.status === "PAID") {
    console.log("[verify] order already marked PAID, skipping (idempotent):", order.id);
    return { success: true, alreadyProcessed: true };
  }

  let valid;
  try {
    valid = isSignatureValid(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  } catch (err) {
    console.error("[verify] signature check threw:", err.message);
    valid = false;
  }

  console.log("[verify] signature valid?", valid);

  if (!valid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
    });
    console.warn("[verify] marked order FAILED due to invalid signature:", order.id);
    throw new HttpError(400, "Invalid payment signature");
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: order.credits } },
    }),
  ]);

  console.log(`[verify] ✅ SUCCESS — order ${order.id} PAID, +${order.credits} credits added to user ${userId}`);

  return { success: true, creditsAdded: order.credits };
}

// Webhook signature check — separate secret, set in Razorpay Dashboard → Webhooks
// razorpay.service.js
function isWebhookSignatureValid(rawBody, signature) {
  if (!signature) return false;
  try {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Handles payment.captured / payment.failed events. Source of truth for cases where
// the user closes the tab before the frontend's /verify call fires.
async function handleWebhookEvent(event) {
  console.log("[webhook] event received:", event.event);

  const razorpayOrderId = event?.payload?.payment?.entity?.order_id;
  const razorpayPaymentId = event?.payload?.payment?.entity?.id;
  if (!razorpayOrderId) {
    console.warn("[webhook] no order_id in payload, ignoring");
    return;
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
  if (!order) {
    console.warn("[webhook] no matching order found:", razorpayOrderId);
    return;
  }
  if (order.status === "PAID") {
    console.log("[webhook] order already PAID, ignoring duplicate event:", order.id);
    return;
  }

  if (event.event === "payment.captured") {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "PAID", razorpayPaymentId } }),
      prisma.user.update({ where: { id: order.userId }, data: { credits: { increment: order.credits } } }),
    ]);
    console.log(`[webhook] ✅ order ${order.id} marked PAID via webhook, +${order.credits} credits`);
  } else if (event.event === "payment.failed") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED", razorpayPaymentId } });
    console.log(`[webhook] ❌ order ${order.id} marked FAILED via webhook`);
  }
}

module.exports = {
  HttpError,
  listActivePlans,
  createOrderForUser,
  verifyAndCapturePayment,
  isWebhookSignatureValid,
  handleWebhookEvent,
};