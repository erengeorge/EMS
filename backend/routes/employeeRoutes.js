const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

const {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeReport
} = require("../controllers/employeeController");

router.get("/", authenticateToken, getEmployees);
router.get("/report", authenticateToken, getEmployeeReport);
router.post("/", authenticateToken, createEmployee);
router.put("/:id", authenticateToken, updateEmployee);
router.delete("/:id", authenticateToken, deleteEmployee);

module.exports = router;