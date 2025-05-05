require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Admin } = require("../models/admin")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateAdmin = require("../middlewares/admin");
const { Category } = require("../models/category"); 
const { Product } = require("../models/product");


if (process.env.NODE_ENV !== "development") {
    console.log("In Production mode");
} else {

    console.log("In devlopment mode");
    router.get("/create", async function (req, res) {
        try {
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash("qwaszx1234@A", salt);

            // ✅ Correct admin creation
            let user = await Admin.create({
                name: "AbdulAhad",
                email: "admin@whimsy.com",
                password: hash,
                role: "superadmin",
                phone: "9891212380",
            });

            let token = jwt.sign({ email: user.email, admin:true }, process.env.JWT_KEY);
            res.cookie("token", token);
            res.send("Admin created successfully");
        } catch (error) {
            res.send(error.message);
        }
    });
}



// Middleware to prevent cache
function preventCache(req, res, next) {
    res.set('Cache-Control', 'no-store');
    next();
  }
  

router.get("/login", function (req, res) {
    res.render("admin_login");
})


    
    router.post("/login", async (req, res) => {
        try {
            const { email, password } = req.body;
    
            let user = await Admin.findOne({ email }); 
    
            if (!user) {
                return res.status(400).send("User not found");
            }
    
            let match = await bcrypt.compare(password, user.password);
           
            
    
            if (!match) {
                return res.status(400).send("Incorrect password");
            }
    
            let token = jwt.sign({ email: user.email , admin:true}, process.env.JWT_KEY);
            res.cookie("token", token);
            res.redirect("/admin/dashboard");
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    router.get("/dashboard", validateAdmin, preventCache, async function (req, res) {
        try {
            const categories = await Category.find().sort({ name: 1 });
            const categoryCount = await Category.countDocuments();
            const totalProducts = await Product.countDocuments(); // added
    
            res.render("admin_dashboard", {
                categories,
                categoryCount,
                totalProducts, // added
            });
        } catch (err) {
            console.error("Dashboard error:", err);
            res.status(500).send("Something went wrong");
        }
    });
    
    

    
        router.get("/products", validateAdmin, preventCache, async function (req, res) {
            // Fetch all products and categories together
            const [products, categories] = await Promise.all([
                Product.find(),
                Category.find()
            ]);
        
            // Create a map of categoryId -> categoryName
            const categoryMap = {};
            categories.forEach(cat => {
                categoryMap[cat._id.toString()] = cat.name;
            });
        
            // Group products by category name
            const grouped = {};
            products.forEach(prod => {
                const catName = categoryMap[prod.category.toString()] || "Uncategorized";
        
                if (!grouped[catName]) {
                    grouped[catName] = [];
                }
        
                grouped[catName].push(prod);
            });
        
            // Send to EJS
            res.render("admin_products", { products: grouped });
        });
        
    
    


    router.get("/logout", function (req, res) {
        res.clearCookie("token");
        res.redirect("/admin/login");
    });


    


module.exports = router;
