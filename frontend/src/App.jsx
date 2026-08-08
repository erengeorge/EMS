import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    Name: '',
    Department: '',
    Position: '',
    Salary: ''
  })

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Name: form.Name,
          Department: form.Department,
          Position: form.Position,
          Salary: Number(form.Salary)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create employee')
      }

      setForm({
        Name: '',
        Department: '',
        Position: '',
        Salary: ''
      })

      fetchEmployees()
    } catch (error) {
      console.error('Failed to create employee:', error)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Employee Management System</h1>
        <p>Manage your employees efficiently</p>
      </header>

      <main className="main">
        <section className="form-section">
          <h2>Add Employee</h2>

          <form onSubmit={handleSubmit}>
            <input
              name="Name"
              placeholder="Name"
              value={form.Name}
              onChange={handleChange}
              required
            />

            <input
              name="Department"
              placeholder="Department"
              value={form.Department}
              onChange={handleChange}
              required
            />

            <input
              name="Position"
              placeholder="Position"
              value={form.Position}
              onChange={handleChange}
              required
            />

            <input
              name="Salary"
              type="number"
              placeholder="Salary"
              value={form.Salary}
              onChange={handleChange}
              required
            />

            <button type="submit">Add Employee</button>
          </form>
        </section>

        <section>
          <div className="section-header">
            <h2>Employees</h2>
            <button onClick={fetchEmployees}>Refresh</button>
          </div>

          {loading ? (
            <p>Loading employees...</p>
          ) : employees.length === 0 ? (
            <p>No employees found.</p>
          ) : (
            <div className="employee-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Salary</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.Id}>
                      <td>{employee.Id}</td>
                      <td>{employee.Name}</td>
                      <td>{employee.Department}</td>
                      <td>{employee.Position}</td>
                      <td>₱{Number(employee.Salary).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App