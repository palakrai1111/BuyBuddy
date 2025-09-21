"use client";

import InputComponent from "@/components/FormElements/InputComponent";
import SelectComponent from "@/components/FormElements/SelectComponent";
import TileComponent from "@/components/FormElements/TileComponent";
import ComponentLevelLoader from "@/components/Loader/componentlevel";
import Notification from "@/components/Notification";
import { GlobalContext } from "@/context";
import { addNewProduct, updateAProduct } from "@/services/product";
import { AvailableSizes, adminAddProductformControls } from "@/utils";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const initialFormData = {
  name: "",
  price: 0,
  description: "",
  category: "men",
  sizes: [],
  deliveryInfo: "",
  onSale: "no",
  imageUrl: "",
  priceDrop: 0,
};

export default function AdminAddNewProduct() {
  const [formData, setFormData] = useState(initialFormData);

  const {
    componentLevelLoader,
    setComponentLevelLoader,
    currentUpdatedProduct,
    setCurrentUpdatedProduct,
  } = useContext(GlobalContext);

  const router = useRouter();

  useEffect(() => {
    if (currentUpdatedProduct !== null) setFormData(currentUpdatedProduct);
  }, [currentUpdatedProduct]);

  // --- Cloudinary Image Upload ---
  async function handleImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await res.json();

      if (result.secure_url) {
        setFormData({
          ...formData,
          imageUrl: result.secure_url,
        });
        toast.success("Image uploaded successfully!", {
          position: toast.POSITION.TOP_RIGHT,
        });
      } else {
        throw new Error("Image upload failed");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      toast.error("Failed to upload image", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  }

  // --- Tile Click Handler ---
  function handleTileClick(getCurrentItem) {
    let cpySizes = [...formData.sizes];
    const index = cpySizes.findIndex((item) => item.id === getCurrentItem.id);

    if (index === -1) {
      cpySizes.push(getCurrentItem);
    } else {
      cpySizes = cpySizes.filter((item) => item.id !== getCurrentItem.id);
    }

    setFormData({
      ...formData,
      sizes: cpySizes,
    });
  }

  // --- Add or Update Product ---
  async function handleAddProduct() {
    setComponentLevelLoader({ loading: true, id: "" });

    const res =
      currentUpdatedProduct !== null
        ? await updateAProduct(formData)
        : await addNewProduct(formData);

    if (res.success) {
      setComponentLevelLoader({ loading: false, id: "" });
      toast.success(res.message, { position: toast.POSITION.TOP_RIGHT });

      setFormData(initialFormData);
      setCurrentUpdatedProduct(null);

      setTimeout(() => {
        router.push("/admin-view/all-products");
      }, 1000);
    } else {
      toast.error(res.message, { position: toast.POSITION.TOP_RIGHT });
      setComponentLevelLoader({ loading: false, id: "" });
      setFormData(initialFormData);
    }
  }

  return (
    <div className="w-full mt-5 relative">
      <div className="flex flex-col items-start justify-start p-10 bg-white shadow-2xl rounded-xl relative">
        <div className="w-full mt-6 space-y-8">
          {/* Image Upload */}
          <input
            accept="image/*"
            type="file"
            onChange={handleImage}
          />

          {/* Available Sizes */}
          <div className="flex gap-2 flex-col">
            <label>Available sizes</label>
            <TileComponent
              selected={formData.sizes}
              onClick={handleTileClick}
              data={AvailableSizes}
            />
          </div>

          {/* Other Form Controls */}
          {adminAddProductformControls.map((controlItem) =>
            controlItem.componentType === "input" ? (
              <InputComponent
                key={controlItem.id}
                type={controlItem.type}
                placeholder={controlItem.placeholder}
                label={controlItem.label}
                value={formData[controlItem.id]}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    [controlItem.id]: event.target.value,
                  })
                }
              />
            ) : controlItem.componentType === "select" ? (
              <SelectComponent
                key={controlItem.id}
                label={controlItem.label}
                options={controlItem.options}
                value={formData[controlItem.id]}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    [controlItem.id]: event.target.value,
                  })
                }
              />
            ) : null
          )}

          {/* Add / Update Button */}
          <button
            onClick={handleAddProduct}
            className="inline-flex w-full items-center justify-center bg-black px-6 py-4 text-lg text-white font-medium uppercase tracking-wide"
          >
            {componentLevelLoader?.loading ? (
              <ComponentLevelLoader
                text={currentUpdatedProduct ? "Updating Product" : "Adding Product"}
                color="#ffffff"
                loading={componentLevelLoader.loading}
              />
            ) : currentUpdatedProduct ? (
              "Update Product"
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </div>
      <Notification />
    </div>
  );
}
