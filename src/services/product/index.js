//add a new product service

import Cookies from "js-cookie";

const BASE_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_BASE_URL
    : "";

export const addNewProduct = async (formData) => {
  const res = await fetch("/api/admin/add-product", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
    body: JSON.stringify(formData),
  });
  return res.json();
};

export const getAllAdminProducts = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/all-products`, {
    cache: "no-store",
  });
  return res.json();
};

export const productByCategory = async (id) => {
  const res = await fetch(
    `${BASE_URL}/api/admin/product-by-category?id=${id}`,
    { cache: "no-store" }
  );
  return res.json();
};

export const productById = async (id) => {
  const res = await fetch(
    `${BASE_URL}/api/admin/product-by-id?id=${id}`,
    { cache: "no-store" }
  );
  return res.json();
};

export const updateAProduct = async (formData) => {
  const res = await fetch("/api/admin/update-product", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
    body: JSON.stringify(formData),
  });
  return res.json();
};

export const deleteAProduct = async (id) => {
  const res = await fetch(`/api/admin/delete-product?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  });
  return res.json();
};
