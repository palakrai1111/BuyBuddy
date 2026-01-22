"use client";

import Notification from "@/components/Notification";
import { GlobalContext } from "@/context";
import { fetchAllAddresses } from "@/services/address";
import { createNewOrder } from "@/services/order";
import { callStripeSession } from "@/services/stripe";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { PulseLoader } from "react-spinners";
import { toast } from "react-toastify";

export default function Checkout() {
  const {
    cartItems,
    user,
    addresses,
    setAddresses,
    checkoutFormData,
    setCheckoutFormData,
  } = useContext(GlobalContext);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isOrderProcessing, setIsOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  // ✅ Load addresses (guarded)
  useEffect(() => {
    if (!user) return;

    async function loadAddresses() {
      const res = await fetchAllAddresses(user._id);
      if (res.success) setAddresses(res.data);
    }

    loadAddresses();
  }, [user]);

  // ✅ Stripe success handler
  useEffect(() => {
    if (!user || !cartItems || cartItems.length === 0) return;

    async function finalizeOrder() {
      const isStripe = JSON.parse(localStorage.getItem("stripe"));

      if (isStripe && status === "success") {
        setIsOrderProcessing(true);

        const stored = JSON.parse(
          localStorage.getItem("checkoutFormData")
        );

        const payload = {
          user: user._id,
          shippingAddress: stored.shippingAddress,
          orderItems: cartItems.map((i) => ({
            qty: 1,
            product: i.productID,
          })),
          paymentMethod: "Stripe",
          totalPrice: cartItems.reduce(
            (t, i) => i.productID.price + t,
            0
          ),
          isPaid: true,
          isProcessing: true,
          paidAt: new Date(),
        };

        const res = await createNewOrder(payload);

        if (res.success) {
          setOrderSuccess(true);
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }

        setIsOrderProcessing(false);
      }
    }

    finalizeOrder();
  }, [status, cartItems, user]);

  function handleSelectedAddress(addr) {
    setSelectedAddress(addr._id);
    setCheckoutFormData({
      ...checkoutFormData,
      shippingAddress: {
        fullName: addr.fullName,
        city: addr.city,
        country: addr.country,
        postalCode: addr.postalCode,
        address: addr.address,
      },
    });
  }

  async function handleCheckout() {
    const stripe = await stripePromise;

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productID.name,
          images: [item.productID.imageUrl],
        },
        unit_amount: item.productID.price * 100,
      },
      quantity: 1,
    }));

    const res = await callStripeSession(lineItems);

    setIsOrderProcessing(true);
    localStorage.setItem("stripe", true);
    localStorage.setItem(
      "checkoutFormData",
      JSON.stringify(checkoutFormData)
    );

    await stripe.redirectToCheckout({
      sessionId: res.id,
    });
  }

  // ✅ EARLY RETURNS (SAFE)
  if (!user || !cartItems || !addresses) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <PulseLoader color="#000" size={30} />
      </div>
    );
  }

  if (orderSuccess) {
    setTimeout(() => router.push("/orders"), 2000);
    return (
      <div className="h-screen flex justify-center items-center">
        <h1 className="text-xl font-bold">
          Payment successful! Redirecting…
        </h1>
      </div>
    );
  }

  if (isOrderProcessing) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <PulseLoader color="#000" size={30} />
      </div>
    );
  }

  // ✅ NORMAL RENDER
  return (
    <div className="grid lg:grid-cols-2 px-10">
      {/* CART */}
      <div>
        <h2 className="text-xl font-bold mb-4">Cart Summary</h2>
        {cartItems.map((item) => (
          <div key={item._id} className="flex gap-4 mb-4">
            <img
              src={item.productID.imageUrl}
              className="w-24 h-24 object-cover"
            />
            <div>
              <p>{item.productID.name}</p>
              <p>${item.productID.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ADDRESS */}
      <div>
        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
        {addresses.length > 0 ? (
          addresses.map((a) => (
            <div
              key={a._id}
              onClick={() => handleSelectedAddress(a)}
              className={`border p-4 mb-2 cursor-pointer ${
                selectedAddress === a._id ? "border-black" : ""
              }`}
            >
              {a.fullName} — {a.city}
            </div>
          ))
        ) : (
          <p>No addresses added</p>
        )}

        <button
          disabled={!selectedAddress}
          onClick={handleCheckout}
          className="mt-4 w-full bg-black text-white py-3 disabled:opacity-50"
        >
          Checkout
        </button>
      </div>

      <Notification />
    </div>
  );
}
