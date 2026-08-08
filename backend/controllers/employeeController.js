const { sql, connectDB } = require("../config/db");

const getEmployees = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT * FROM Employees");

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve employees",
            error: error.message
        });
    }
};

const createEmployee = async (req, res) => {
    try {
        const { Name, Department, Position, Salary } = req.body;

        const pool = await connectDB();

        await pool.request()
            .input("Name", sql.NVarChar(100), Name)
            .input("Department", sql.NVarChar(100), Department)
            .input("Position", sql.NVarChar(100), Position)
            .input("Salary", sql.Decimal(10, 2), Salary)
            .query(`
                INSERT INTO Employees (Name, Department, Position, Salary)
                VALUES (@Name, @Department, @Position, @Salary)
            `);

        res.status(201).json({
            message: "Employee created successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create employee",
            error: error.message
        });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Department, Position, Salary } = req.body;

        const pool = await connectDB();

        const result = await pool.request()
            .input("Id", sql.Int, id)
            .input("Name", sql.NVarChar(100), Name)
            .input("Department", sql.NVarChar(100), Department)
            .input("Position", sql.NVarChar(100), Position)
            .input("Salary", sql.Decimal(10, 2), Salary)
            .query(`
                UPDATE Employees
                SET Name = @Name,
                    Department = @Department,
                    Position = @Position,
                    Salary = @Salary
                WHERE Id = @Id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({
            message: "Employee updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update employee",
            error: error.message
        });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await connectDB();

        const result = await pool.request()
            .input("Id", sql.Int, id)
            .query("DELETE FROM Employees WHERE Id = @Id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json({
            message: "Employee deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete employee",
            error: error.message
        });
    }
};


module.exports = {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
};