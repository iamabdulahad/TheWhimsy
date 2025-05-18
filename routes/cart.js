const express = require("express");
const router = express.Router();
const userIsLoggedIn = require("../middlewares/userLoggin");
const { Cart } = require("../models/cart");
const { Product } = require("../models/product");
const { User } = require("../models/user");

router.get("/", userIsLoggedIn, async function (req, res) {
    if (!req.user) {
        return res.redirect("/users/login");
    }

    let cartItems = [];
    let total = 0;

    // Get the cart with product details populated
    const userCart = await Cart.findOne({ user: req.user._id }).populate('products.product');

    if (userCart) {
        cartItems = userCart.products;

        // Calculate total
        cartItems.forEach(cartItem => {
            if (cartItem.product) {
                total += cartItem.product.price * cartItem.quantity;
            }
        });
    }

    res.render("cart", {
        user: req.user,
        cart: cartItems,
        total: total.toFixed(2), // Format to 2 decimal places
        isLoggedIn: true
    });
});

// Increase quantity
router.post("/increase/:id", userIsLoggedIn, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        const productInCart = cart.products.find(p => p.product.toString() === req.params.id);

        if (productInCart) {
            // Increase the quantity and update total price accordingly
            productInCart.quantity += 1;
            const product = await Product.findById(req.params.id);
            cart.totalPrice += product.price; // Add the product's price to the total price
            await cart.save();
        }

        res.redirect("/cart");
    } catch (err) {
        console.error("Error increasing quantity:", err);
        res.status(500).send("Server error");
    }
});

// Decrease quantity
router.post("/decrease/:id", userIsLoggedIn, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        const productIndex = cart.products.findIndex(p => p.product.toString() === req.params.id);

        if (productIndex !== -1) {
            const product = await Product.findById(req.params.id);

            // Decrease quantity if more than 1, else remove from cart
            if (cart.products[productIndex].quantity > 1) {
                cart.products[productIndex].quantity -= 1;
                cart.totalPrice -= product.price; // Subtract the product's price from the total price
            } else {
                // Remove the product from the cart entirely
                cart.products.splice(productIndex, 1);
                cart.totalPrice -= product.price; // Adjust total price after removal
            }

            await cart.save();
        }

        res.redirect("/cart");
    } catch (err) {
        console.error("Error decreasing quantity:", err);
        res.status(500).send("Server error");
    }
});

// Add product to cart
router.get("/add/:id", async function (req, res) {
    try {
        if (!req.user) {
            return res.redirect("/users/login");
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = await Cart.create({
                user: req.user._id,
                products: [{ product: product._id, quantity: 1 }],
                totalPrice: product.price,
            });
        } else {
            // Check if product is already in the cart
            const productInCart = cart.products.find(
                (item) => item.product.toString() === req.params.id
            );

            if (productInCart) {
                productInCart.quantity += 1;
                cart.totalPrice += product.price; // Add product price to total
            } else {
                cart.products.push({ product: product._id, quantity: 1 });
                cart.totalPrice += product.price; // Add new product price to total
            }

            await cart.save();
        }

        return res.redirect("/cart");
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send("Internal Server Error");
    }
});



// Checkout page
router.get('/checkout', userIsLoggedIn, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).lean();
      const userCart = await Cart.findOne({ user: req.user._id }).populate('products.product');
  

      if (!userCart || userCart.products.length === 0) {
        return res.redirect('/cart');
      }
  
      let subtotal = 0;
      userCart.products.forEach(item => {
        subtotal += item.product.price * item.quantity;
      });
      
      // Ensure the shipping charge is a number
      const shippingCharge = subtotal >= 499 ? 0 : 40;
      
      // Ensure total is a number and calculate
      const total = (subtotal + shippingCharge);
      
      res.render('checkout', {
        cart: userCart.products,
        subtotal: subtotal.toFixed(2),  // Rounded to two decimal places
        shippingCharge,                // Send shippingCharge as a number
        total: total.toFixed(2),       // Ensure total is rounded to two decimal places
        user
      });
      
      
    } catch (err) {
      console.error("Error loading checkout:", err);
      res.status(500).send("Internal Server Error");
    }
  });
  
  
  
  // Payment initiate (after address selection)
  router.post('/payment/initiate', userIsLoggedIn, async (req, res) => {
    const { addressId } = req.body;
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
  
    const cartDoc = await Cart.findOne({ user: req.user._id }).populate('products.product');
  
    let subtotal = 0;
    cartDoc.products.forEach(item => {
      subtotal += item.product.price * item.quantity;
    });
  
    const shipping = subtotal >= 499 ? 0 : 40;
    const totalPrice = subtotal + shipping;
  
    // Later: create Razorpay order here
  
    res.render('payment-page', {
      address,
      cart: cartDoc.products,
      subtotal: subtotal.toFixed(2),
      shipping,
      total: totalPrice.toFixed(2)
    });
  });
  
  

  

module.exports = router;
