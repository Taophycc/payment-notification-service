export const config = {
  rateLimit: {
    auth: {
      max: 5,
      timeWindow: "1 minute",
    },
    global: {
      max: 100,
      timeWindow: "1 minute",
    },
  },
  jwt: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
  },
  bcrypt: {
    saltRounds: 12,
  },
};