require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Admin } = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateAdmin = require("../middlewares/admin");
const { Category } = require("../models/category");
const { Product } = require("../models/product");
const nodemailer = require("nodemailer");
const Newsletter = require("../models/newsletter");
const { Order } = require("../models/order"); 

if (process.env.NODE_ENV !== "development") {
  console.log("In Production mode");
} else {
  console.log("In devlopment mode");
  router.get("/create", async function (req, res) {
    try {
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

      // ✅ Correct admin creation
      let user = await Admin.create({
        name: "Khizar",
        email: process.env.ADMIN_EMAIL,
        password: hash,
        role: "superadmin",
        phone: "9319675135",
      });

      let token = jwt.sign(
        { email: user.email, admin: true },
        process.env.JWT_KEY
      );
      res.cookie("token", token);
      res.send("Admin created successfully");
    } catch (error) {
      res.send(error.message);
    }
  });
}

// Middleware to prevent cache
function preventCache(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}

router.get("/login", function (req, res) {
  res.render("admin_login");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await Admin.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/login");
    }

    let match = await bcrypt.compare(password, user.password);

    if (!match) {
      req.flash("error", "Incorrect password");
      return res.redirect("/admin/login");
    }

    let token = jwt.sign(
      { email: user.email, admin: true },
      process.env.JWT_KEY
    );
    res.cookie("token", token);
    res.redirect("/admin/dashboard");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get(
  "/dashboard",
  validateAdmin,
  preventCache,
  async function (req, res) {
    try {
      const categories = await Category.find().sort({ name: 1 });
      const categoryCount = await Category.countDocuments();
      const totalProducts = await Product.countDocuments(); 
      const newOrders = await Order.countDocuments({ status: "pending" });


      res.render("admin_dashboard", {
        categories,
        categoryCount,
        totalProducts, 
        newOrders,
      
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).send("Something went wrong");
    }
  }
);

router.get("/products", validateAdmin, preventCache, async function (req, res) {
  // Fetch all products and categories together
  const [products, categories] = await Promise.all([
    Product.find(),
    Category.find(),
  ]);

  // Create a map of categoryId -> categoryName
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat._id.toString()] = cat.name;
  });

  // Group products by category name
  const grouped = {};
  products.forEach((prod) => {
    const catName = categoryMap[prod.category.toString()] || "Uncategorized";

    if (!grouped[catName]) {
      grouped[catName] = [];
    }

    grouped[catName].push(prod);
  });

  // Send to EJS
  res.render("admin_products", { products: grouped, error: null, });
});




router.get("/products/search", validateAdmin, preventCache, async (req, res) => {
  const { product_id } = req.query;

  const categories = await Category.find(); // Add this
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat._id.toString()] = cat.name;
  });

  if (!product_id) {
    return res.render("admin_products", {
      products: {},
      categories,
      error: null,
    });
  }

  try {
    const product = await Product.findById(product_id.trim());

    if (!product) {
      return res.render("admin_products", {
        products: {},
        categories,
        error: "No product found with this ID.",
      });
    }

    const products = {
      "Search Result": [product],
    };

    res.render("admin_products", {
      products,
      categories,
      error: null,
    });

  } catch (error) {
    console.error("❌ Error finding product:", error);
    res.render("admin_products", {
      products: {},
      categories,
      error: "Invalid Product ID format or internal error.",
    });
  }
});






router.post("/newsletter/send", validateAdmin, async (req, res) => {
  const { subject, message } = req.body;

  try {
    const subscribers = await Newsletter.find({}, "email");

    if (!subscribers.length) {
      req.flash("error", "No subscribers found.");
      return res.redirect("/admin/dashboard");
    }

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      await transporter.sendMail({
        from: `"The Whimsy" <${process.env.GMAIL_USER}>`,
        to: subscriber.email,
        subject,
        text: message,
        html: `<p>${message}</p>`,
      });
    }

    req.flash("success", "Newsletter sent to all subscribers.");
    res.redirect("/admin/dashboard");

  } catch (err) {
    console.error("❌ Error sending newsletter:", err);
    req.flash("error", "Failed to send newsletter.");
    res.redirect("/admin/dashboard");
  }
});



router.get('/orders', validateAdmin, async (req, res) => {
  try {
    // Orders fetch karo aur products aur user details populate karo
    const orders = await Order.find()
      .populate('user', 'name email phone')          // User ke name aur email chahiye toh
      .populate('products.product', 'name price');  // Product ke name aur price chahiye
     

    res.render('admin_orders', { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});



// Route to update order status
router.post('/orders/:orderId/status', validateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status value server-side
    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).send("Invalid status value.");
    }

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status });

    // Redirect back to orders page
    res.redirect('/admin/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


router.get("/logout", function (req, res) {
  res.clearCookie("token");
  res.redirect("/admin/login");
});

module.exports = router;
