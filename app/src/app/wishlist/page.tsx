"use client";

import { useEffect, useState } from "react";
import { ButtonLink, Container, Heading } from "@/components/atoms";
import { ProductGrid, ProductGridSkeleton } from "@/components/organisms";
import { useStore } from "@/context/StoreProvider";
import { api } from "@/lib/api";
import type { Product } from "@/types";

/**
 * Signed-in customers see their saved products from the API. Guests keep a
 * local list that moves to their account when they sign in.
 */
export default function WishlistPage() {
  const { user, authReady, wishlist } = useStore();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!authReady || !user) return;
    api.wishlist().then((w) => setProducts(w.products)).catch(() => setProducts([]));
  }, [authReady, user]);

  const visible = products?.filter((p) => wishlist.includes(p.id)) ?? [];

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">Wishlist</Heading>
      {!authReady || (user && products === null) ? (
        <ProductGridSkeleton />
      ) : !user ? (
        <div className="py-16 text-center">
          <p className="mb-2">
            {wishlist.length > 0 ? `You've saved ${wishlist.length} item${wishlist.length === 1 ? "" : "s"} on this device.` : "You haven't saved anything yet."}
          </p>
          <p className="mb-6 text-sm text-muted">Sign in to see your wishlist on every device.</p>
          <ButtonLink href="/account/login?next=/wishlist">Sign in</ButtonLink>
        </div>
      ) : visible.length ? (
        <ProductGrid products={visible} />
      ) : (
        <div className="py-16 text-center">
          <p className="mb-6 text-muted">You haven&apos;t saved anything yet.</p>
          <ButtonLink href="/collections/all" variant="outline">Browse products</ButtonLink>
        </div>
      )}
    </Container>
  );
}
