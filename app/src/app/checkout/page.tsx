import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const site = await getSite();
  return (
    <CheckoutView
      shippingMethods={site.shippingMethods}
      paymentMethods={site.paymentMethods}
      freeShippingThreshold={site.freeShippingThreshold}
      allowGuestCheckout={site.allowGuestCheckout}
    />
  );
}
