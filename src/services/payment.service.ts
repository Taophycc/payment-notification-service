import { env } from "../config/env";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const initializePayment = async (
  email: string,
  amount: number,
  firstName?: string,
  lastName?: string,
) => {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  const data = (await response.json()) as {
    status: boolean;
    data: {
      authorization_url: string;
      reference: string;
    };
  };

  if (!data.status) {
    throw new Error("Failed to initialize payment");
  }

  return data.data;
};

export const verifyPayment = async (reference: string) => {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const data = (await response.json()) as {
    status: boolean;
    data: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      customer: {
        email: string;
      };
    };
  };

  if (!data.status) {
    throw new Error("Failed to verify payment");
  }

  return data.data;
};
