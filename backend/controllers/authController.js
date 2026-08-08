const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sql, connectDB } = require("../config/db");

const login = async (req, res) => {
    try {
        const { Username, Password } = req.body;

        if (!Username || !Password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("Username", sql.NVarChar, Username)
            .query("SELECT * FROM Users WHERE Username = @Username");

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const user = result.recordset[0];

        const passwordMatch = await bcrypt.compare(
            Password,
            user.Password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                Id: user.Id,
                Username: user.Username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                Id: user.Id,
                Username: user.Username
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    login
};