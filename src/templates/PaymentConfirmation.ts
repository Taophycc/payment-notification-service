export const paymentConfirmationTemplate = (data: {
  firstName: string;
  amount: number;
  currency: string;
  reference: string;
  date: string;
}) => `
  <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <h2 style="color: #1a1a1a; margin: 0 0 20px;">Payment Confirmed ✓</h2>
    <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;" />
    <p style="color: #444; font-size: 16px;">Hi ${data.firstName},</p>
    <p style="color: #444; font-size: 16px;">Your payment has been received successfully.</p>
    <div style="background: #f6f9fc; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #444;"><strong>Reference:</strong> ${data.reference}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #444;"><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
      <p style="margin: 0; font-size: 14px; color: #444;"><strong>Date:</strong> ${data.date}</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;" />
    <p style="color: #8898aa; font-size: 13px;">Thank you for your payment. If you have any questions please contact support.</p>
  </div>
`;