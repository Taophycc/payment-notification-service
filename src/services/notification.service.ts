import { Resend } from "resend";
import { db } from "../db/index";
import { notifications } from "../db/schema";
import { eq } from "drizzle-orm";
import { paymentConfirmationTemplate } from "../templates/paymentConfirmation";
import { PaystackWebhookInput } from "../validators/webhook.validator";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPaymentNotification = async (
  body: PaystackWebhookInput,
  transactionId: string,
) => {
  const [notification] = await db
    .insert(notifications)
    .values({
      paymentId: transactionId,
      type: "payment_confirmation",
      status: "pending",
      message: `Payment of ${body.data.amount / 100} ${body.data.currency} confirmed`,
    })
    .returning();

  const html = paymentConfirmationTemplate({
    firstName: body.data.customer.first_name,
    amount: body.data.amount / 100,
    currency: body.data.currency,
    reference: body.data.reference,
    date: new Date().toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" }),
  });

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to:
        process.env.NODE_ENV === "production"
          ? body.data.customer.email
          : process.env.TEST_EMAIL!,
      subject: "Payment Confirmed",
      html,
    });

    await db
      .update(notifications)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(notifications.id, notification.id));
  } catch (err) {
    await db
      .update(notifications)
      .set({ status: "failed" })
      .where(eq(notifications.id, notification.id));

    console.error("Failed to send notification email:", err);
  }
};
