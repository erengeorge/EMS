import { useEffect, useState } from 'react'
import './App.css'

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')
  )

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    Name: '',
    Department: '',
    Position: '',
    Salary: ''
  })

  const [form, setForm] = useState({
    Name: '',
    Department: '',
    Position: '',
    Salary: ''
  })

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Username: username,
          Password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('token', data.token)
      setIsLoggedIn(true)

      setUsername('')
      setPassword('')
    } catch (error) {
      setLoginError(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
  }

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

  const deleteEmployee = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete employee')
      }

      fetchEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
    }
  }

  const startEdit = (employee) => {
    setEditingId(employee.Id)

    setEditForm({
      Name: employee.Name,
      Department: employee.Department,
      Position: employee.Position,
      Salary: employee.Salary
    })
  }

  const updateEmployee = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Name: editForm.Name,
          Department: editForm.Department,
          Position: editForm.Position,
          Salary: Number(editForm.Salary)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update employee')
      }

      setEditingId(null)

      setEditForm({
        Name: '',
        Department: '',
        Position: '',
        Salary: ''
      })

      fetchEmployees()
    } catch (error) {
      console.error('Failed to update employee:', error)
    }
  }

  const handleEditChange = (event) => {
    setEditForm({
      ...editForm,
      [event.target.name]: event.target.value
    })
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Employee Management System</h1>
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {loginError && (
              <p className="login-error">{loginError}</p>
            )}

            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Employee Management System</h1>
        <p>Manage your employees efficiently</p>

        <button onClick={handleLogout}>Logout</button>
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
        
        {editingId !== null && (
          <section className="form-section">
            <h2>Edit Employee</h2>

            <form onSubmit={updateEmployee}>
              <input
                name="Name"
                placeholder="Name"
                value={editForm.Name}
                onChange={handleEditChange}
                required
              />

              <input
                name="Department"
                placeholder="Department"
                value={editForm.Department}
                onChange={handleEditChange}
                required
              />

              <input
                name="Position"
                placeholder="Position"
                value={editForm.Position}
                onChange={handleEditChange}
                required
              />

              <input
                name="Salary"
                type="number"
                placeholder="Salary"
                value={editForm.Salary}
                onChange={handleEditChange}
                required
              />

              <button type="submit">Update Employee</button>

              <button
                type="button"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

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
                    <th>Actions</th>
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
                      <td>
                        <button onClick={() => startEdit(employee)}>
                          Edit
                        </button>

                        <button onClick={() => deleteEmployee(employee.Id)}>
                          Delete
                        </button>
                      </td>
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