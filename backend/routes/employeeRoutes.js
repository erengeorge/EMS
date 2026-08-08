const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

const {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
} = require("../controllers/employeeController");

router.get("/", authenticateToken, getEmployees);
router.post("/", authenticateToken, createEmployee);
router.put("/:id", authenticateToken, updateEmployee);
router.delete("/:id", authenticateToken, deleteEmployee);

module.exports = router;