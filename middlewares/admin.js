const jwt = require("jsonwebtoken");
require("dotenv").config();

async function validateAdmin(req, res, next) {
    try {
        let token = req.cookies.token;
        if (!token) return res.status(401).send("You need to login first.");

        let data = await jwt.verify(token, process.env.JWT_KEY);
        req.user = data;
        
        next(); 
    } catch (error) {
        res.status(401).send(error.message);
    }
}

module.exports = validateAdmin;
