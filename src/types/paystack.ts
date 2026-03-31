export interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}
