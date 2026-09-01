import { MercadoPagoConfig, PreApproval } from "mercadopago";

export const PRO_PLAN_PRICE = 0;

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "",
});

export const preApproval = new PreApproval(mpClient);
