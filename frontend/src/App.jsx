import { useEffect, useState } from 'react'
import './App.css'
import { jsPDF } from 'jspdf'

const DEPARTMENT_BADGE = {}
const BADGE_CLASSES = ['badge', 'badge-b', 'badge-c', 'badge-d', 'badge-e']

function badgeClassFor(department) {
  if (!DEPARTMENT_BADGE[department]) {
    const nextIndex = Object.keys(DEPARTMENT_BADGE).length % BADGE_CLASSES.length
    DEPARTMENT_BADGE[department] = BADGE_CLASSES[nextIndex]
  }
  return DEPARTMENT_BADGE[department]
}

function initialsFor(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')
  )

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  const [report, setReport] = useState(null)
  const [showReport, setShowReport] = useState(false)

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
      const token = localStorage.getItem('token')

      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

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

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('http://localhost:5000/api/employees/report', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate report')
      }

      setReport(data)
      setShowReport(true)
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  const downloadReportPDF = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('http://localhost:5000/api/employees/report', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate report')
      }

      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text('Employee Management System', 20, 20)

      doc.setFontSize(14)
      doc.text('Employee Report', 20, 32)

      doc.setFontSize(11)
      doc.text(`Total Employees: ${data.summary.TotalEmployees}`, 20, 48)
      doc.text(
        `Total Salary: P${Number(data.summary.TotalSalary).toLocaleString()}`,
        20,
        58
      )
      doc.text(
        `Average Salary: P${Number(data.summary.AverageSalary).toLocaleString()}`,
        20,
        68
      )

      let y = 85

      doc.setFontSize(10)
      doc.text('ID', 20, y)
      doc.text('Name', 35, y)
      doc.text('Department', 90, y)
      doc.text('Position', 125, y)
      doc.text('Salary', 175, y)

      y += 8

      data.employees.forEach((employee) => {
        doc.text(String(employee.Id), 20, y)
        doc.text(employee.Name, 35, y)
        doc.text(employee.Department, 90, y)
        doc.text(employee.Position, 125, y)
        doc.text(`P${Number(employee.Salary).toLocaleString()}`, 175, y)

        y += 8

        if (y > 280) {
          doc.addPage()
          y = 20
        }
      })

      doc.save('employee-report.pdf')
    } catch (error) {
      console.error('Failed to download report:', error)
    }
  }

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
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
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
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
          <div className="login-seal">EMS</div>
          <h1>Employee Management System</h1>
          <h2>Sign in to continue</h2>

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

            <button type="submit">Log in</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="rail">
        <div className="rail-mark">EMS</div>
        <div className="rail-line" />
        <button className="rail-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className="content">
        <header className="header">
          <p className="header-eyebrow mono">Employee Ledger</p>
          <h1>Employee Management System</h1>
          <p>Keep every record, role, and rate in one place.</p>
        </header>

        <main className="main">
          <section className="form-section">
            <h2>Add employee</h2>

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

              <button type="submit" className="btn-brass">Add employee</button>
            </form>
          </section>

          {editingId !== null && (
            <section className="form-section">
              <h2>Edit employee</h2>

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

                <button type="submit" className="btn-brass">Save changes</button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </form>
            </section>
          )}

          <section>
            <div className="section-header">
              <h2>
                Employees
                {!loading && (
                  <span className="count mono">{employees.length} on record</span>
                )}
              </h2>
              <div>
                <button className="btn-ghost" onClick={fetchEmployees}>Refresh</button>
                <button className="btn-brass" onClick={fetchReport}>Generate report</button>
                <button onClick={downloadReportPDF}>Download PDF</button>
              </div>
            </div>

            {loading ? (
              <div className="employee-table">
                <div className="empty-state">
                  <p>Loading the ledger…</p>
                  <p>Fetching current employee records.</p>
                </div>
              </div>
            ) : employees.length === 0 ? (
              <div className="employee-table">
                <div className="empty-state">
                  <p>No employees on record yet</p>
                  <p>Add your first employee above to start the ledger.</p>
                </div>
              </div>
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
                        <td className="id-tag">#{employee.Id}</td>
                        <td>
                          <div className="name-cell">
                            <span className="avatar">{initialsFor(employee.Name)}</span>
                            {employee.Name}
                          </div>
                        </td>
                        <td>
                          <span className={badgeClassFor(employee.Department)}>
                            {employee.Department}
                          </span>
                        </td>
                        <td>{employee.Position}</td>
                        <td className="salary-cell">
                          ₱{Number(employee.Salary).toLocaleString()}
                        </td>
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

          {showReport && report && (
            <section className="report-section">
              <h2>Employee report</h2>

              <div className="report-summary">
                <div className="ledger-card">
                  <h3>Total employees</h3>
                  <p>{report.summary.TotalEmployees}</p>
                </div>

                <div className="ledger-card">
                  <h3>Total salary</h3>
                  <p>₱{Number(report.summary.TotalSalary).toLocaleString()}</p>
                </div>

                <div className="ledger-card">
                  <h3>Average salary</h3>
                  <p>₱{Number(report.summary.AverageSalary).toLocaleString()}</p>
                </div>
              </div>

              <h3>Employee details</h3>

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
                    {report.employees.map((employee) => (
                      <tr key={employee.Id}>
                        <td className="id-tag">#{employee.Id}</td>
                        <td>
                          <div className="name-cell">
                            <span className="avatar">{initialsFor(employee.Name)}</span>
                            {employee.Name}
                          </div>
                        </td>
                        <td>
                          <span className={badgeClassFor(employee.Department)}>
                            {employee.Department}
                          </span>
                        </td>
                        <td>{employee.Position}</td>
                        <td className="salary-cell">
                          ₱{Number(employee.Salary).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App