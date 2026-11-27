'use client'

import type { CartItem} from "../../lib/cart/cart-types";
import Image from "next/image";
import { AnimatedCartCounter, CartQuantityStepper } from "./Animatedcart";
import { Trash2 } from "lucide-react";
import useCart from "@/src/hooks/useCart";
interface CartItemProps{
    item:CartItem
}
export default function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem } = useCart();
    const totalPrice = item.unitPrice * item.quantity;

    return(
        <aside className="cart-item flex flex-row justify-between items-center h-auto p-2 border-b border-gray-200 gap-2 text-[0.875rem] text-primary">
         <div className="relative w-40 aspect-[2/3] overflow-hidden bg-background rounded-md">
  <Image
    src={item.image}
    alt={item.name}
    fill
    sizes="120px"
    className="object-cover"
  />
</div>
        <div className="cart-item-details  flex flex-col justify-start gap-1 w-full">
            <h3 className="cart-item-name font-bold">{item.name}</h3>
            <p className="cart-item-price">UGX {item.unitPrice.toLocaleString("en-UG")}</p>
            <p className="item-total-price inline-flex items-center gap-1 text-lg font-bold tabular-nums">
                <span>UGX</span>
                <AnimatedCartCounter
                    value={totalPrice}
                    formatValue={(val) => val.toLocaleString("en-UG")}
                    showPulse={false}
                    ariaLabel={`${item.name} total`}
                />
            </p>
        </div>
        <div className="cart-item-quantity flex flex-col justify-end items-end gap-2"> 
            <Trash2 className="cart-item-delete-icon cursor-pointer" color={'red'} onClick={() => removeItem(item.variantId)} />
            <CartQuantityStepper min={1} max={100} onIncrement={()=>updateQuantity(item.variantId, item.quantity + 1)} onDecrement={()=>updateQuantity(item.variantId, item.quantity - 1)} value={item.quantity} size="sm"  />
        </div>
    </aside>)
}