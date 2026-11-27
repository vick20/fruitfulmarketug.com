import { Cart, createEmptyCart } from './cart-types';

const CART_STORAGE_KEY = "fruitflmarket_cart";




//store thecart
export function storeCart(cart: Cart) {
    if (typeof window === "undefined") return;
    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}

//read the stored cart
export function readStoredCart(): Cart {
    if (typeof window === "undefined") return createEmptyCart();
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);

    let cart: Cart;
    try {
        cart = storedCart ? JSON.parse(storedCart) : createEmptyCart();
    } catch {
        cart = createEmptyCart();
    }

    if (!Array.isArray(cart.items)) {
        cart = createEmptyCart();
    }

    cart.count = cart.items.length;

    cart.subtotal = cart.items.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0
    );

    return cart;
}