const express = require("express");
const app = express();
const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const categoryRouter = require("./routes/category");
const productsRouter = require("./routes/product");
const userRouter = require("./routes/user");
const newsletterRoutes = require("./routes/newsletter");
const cartRouter = require("./routes/cart");

const expressSession = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const setUser = require("./middlewares/setUser");
const path = require("path");
const passport = require("passport");
require("dotenv").config();
require("./config/google_oauth_config");
require("./config/db"); // for Mongodb connection

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(setUser);
app.use(flash());

const { Cart } = require("./models/cart"); // adjust path as needed

app.use(async (req, res, next) => {
  res.locals.user = req.user || null;

  if (req.user) {
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      res.locals.cartItemCount =
        cart?.products?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.locals.cartItemCount = 0;
    }
  } else {
    res.locals.cartItemCount = 0;
  }

  next();
});

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/products", productsRouter);
app.use("/category", categoryRouter);
app.use("/users", userRouter);
app.use("/newsletter", newsletterRoutes);
app.use("/cart", cartRouter);

app.listen(3000);
