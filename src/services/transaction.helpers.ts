export const validStatuses = ["pending", "success", "failed"] as const;
export type ValidStatus = (typeof validStatuses)[number];

export const deriveStatus = (raw: string): ValidStatus =>
  validStatuses.includes(raw as ValidStatus) ? (raw as ValidStatus) : "pending";
