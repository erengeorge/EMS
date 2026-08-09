import { useEffect, useState } from 'react'
import './App.css'
import { jsPDF } from 'jspdf'

const DEPARTMENTS = [
  'Research & Development',
  'Quality Assurance',
  'Quality Control',
  'Manufacturing',
  'Packaging',
  'Regulatory Affairs',
  'Warehouse & Logistics',
  'Sales & Marketing',
  'Human Resources',
  'Finance & Accounts',
  'Information Technology',
  'Executive & Administration'
]

const STATUSES = ['Active', 'On Leave', 'Probationary', 'Resigned', 'Terminated']

const DEPARTMENT_BADGE = {}

const BADGE_CLASSES = ['', 'badge-b', 'badge-c', 'badge-d', 'badge-e']

function badgeClassFor(department) {
  if (!DEPARTMENT_BADGE[department]) {
    const nextIndex = Object.keys(DEPARTMENT_BADGE).length % BADGE_CLASSES.length
    DEPARTMENT_BADGE[department] = BADGE_CLASSES[nextIndex]
  }

  return `badge ${DEPARTMENT_BADGE[department]}`.trim()
}

function statusClassFor(status) {
  switch (status) {
    case 'Active':
      return 'status-pill status-active'
    case 'On Leave':
      return 'status-pill status-leave'
    case 'Probationary':
      return 'status-pill status-probation'
    case 'Resigned':
      return 'status-pill status-resigned'
    case 'Terminated':
      return 'status-pill status-terminated'
    default:
      return 'status-pill'
  }
}

function initialsFor(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

// Displays any date-ish value ("2026-08-09", ISO timestamps, etc.) in words.
function formatDateWords(value) {
  if (!value) return '—'
  const raw = String(value).length <= 10 ? `${value}T00:00:00` : value
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Ensures a select always has an option matching the current value, even if
// that value predates the current enumerated list (e.g. legacy records).
function optionsWithCurrent(list, current) {
  if (current && !list.includes(current)) {
    return [...list, current]
  }
  return list
}

function computeBreakdown(list, key) {
  const map = {}
  list.forEach((item) => {
    const groupKey = item[key] || 'Unspecified'
    if (!map[groupKey]) {
      map[groupKey] = { key: groupKey, count: 0, total: 0 }
    }
    map[groupKey].count += 1
    map[groupKey].total += Number(item.Salary) || 0
  })
  return Object.values(map).sort((a, b) => b.count - a.count)
}

function truncate(text, max) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function addPdfFooter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(140, 152, 143)
  doc.text('Lloyd Laboratories — Confidential, internal use only', 18, pageHeight - 10)
  doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10)
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label mono">{label}</span>
      {children}
    </label>
  )
}

const refreshData = async () => {
  await fetchEmployees()

  if (showReport) {
    await fetchReport()
  }
}

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')
  )
  const [selectedEmployee, setSelectedEmployee] = useState(null)
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
    Salary: '',
    Email: '',
    Phone: '',
    Address: '',
    DateOfBirth: '',
    DateHired: '',
    Status: ''
  })

  const [form, setForm] = useState({
    Name: '',
    Department: '',
    Position: '',
    Salary: '',
    Email: '',
    Phone: '',
    Address: '',
    DateOfBirth: '',
    DateHired: '',
    Status: ''
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

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employees')
      }

      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees()
    }
  }, [isLoggedIn])

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
      const pageWidth = doc.internal.pageSize.getWidth()
      const marginX = 18

      // Header band
      doc.setFillColor(20, 43, 36)
      doc.rect(0, 0, pageWidth, 34, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(17)
      doc.text('LLOYD LABORATORIES', marginX, 16)
      doc.setFontSize(10)
      doc.setTextColor(220, 235, 227)
      doc.text('Human Resources Employees Report', marginX, 24)
      doc.text(`Generated ${formatDateWords(new Date().toISOString())}`, marginX, 30)

      let y = 48

      doc.setTextColor(20, 43, 36)
      doc.setFontSize(12)
      doc.text('Summary', marginX, y)
      y += 8

      doc.setFontSize(10)
      doc.text(`Total employees: ${data.summary.TotalEmployees}`, marginX, y)
      y += 6
      doc.text(
        `Total monthly salary: PHP ${Number(data.summary.TotalSalary).toLocaleString()}`,
        marginX,
        y
      )
      y += 6
      doc.text(
        `Average salary: PHP ${Number(data.summary.AverageSalary).toLocaleString()}`,
        marginX,
        y
      )
      y += 14

      // Department breakdown
      const deptBreakdown = computeBreakdown(data.employees, 'Department')

      doc.setFontSize(12)
      doc.text('Department breakdown', marginX, y)
      y += 9

      doc.setFontSize(9)
      doc.setTextColor(130, 140, 133)
      doc.text('Department', marginX, y)
      doc.text('Headcount', 118, y)
      doc.text('Total salary', 150, y)
      y += 4
      doc.setDrawColor(221, 229, 223)
      doc.line(marginX, y, pageWidth - marginX, y)
      y += 6.5

      doc.setTextColor(20, 43, 36)
      deptBreakdown.forEach((row) => {
        doc.text(truncate(row.key, 42), marginX, y)
        doc.text(String(row.count), 118, y)
        doc.text(`PHP ${row.total.toLocaleString()}`, 150, y)
        y += 6.5

        if (y > 270) {
          addPdfFooter(doc)
          doc.addPage()
          y = 20
        }
      })

      y += 10

      // Employee table
      doc.setFontSize(12)
      doc.text('Employee details', marginX, y)
      y += 9

      if (y > 270) {
        addPdfFooter(doc)
        doc.addPage()
        y = 20
      }

      doc.setFontSize(9)
      doc.setTextColor(130, 140, 133)
      doc.text('ID', marginX, y)
      doc.text('Name', marginX + 12, y)
      doc.text('Department', marginX + 58, y)
      doc.text('Position', marginX + 102, y)
      doc.text('Status', marginX + 138, y)
      doc.text('Salary', marginX + 160, y)
      y += 4
      doc.line(marginX, y, pageWidth - marginX, y)
      y += 6.5

      doc.setTextColor(20, 43, 36)
      data.employees.forEach((employee, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(242, 245, 241)
          doc.rect(marginX - 2, y - 4.5, pageWidth - (marginX - 2) * 2, 6.5, 'F')
        }

        doc.text(String(employee.Id), marginX, y)
        doc.text(truncate(employee.Name, 20), marginX + 12, y)
        doc.text(truncate(employee.Department, 18), marginX + 58, y)
        doc.text(truncate(employee.Position, 15), marginX + 102, y)
        doc.text(employee.Status || '—', marginX + 138, y)
        doc.text(`PHP ${Number(employee.Salary).toLocaleString()}`, marginX + 160, y)
        y += 6.5

        if (y > 275) {
          addPdfFooter(doc)
          doc.addPage()
          y = 20
        }
      })

      addPdfFooter(doc)
      doc.save('lloyd-laboratories-employee-report.pdf')
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
          Salary: Number(form.Salary),
          Email: form.Email,
          Phone: form.Phone,
          Address: form.Address,
          DateOfBirth: form.DateOfBirth,
          DateHired: form.DateHired,
          Status: form.Status
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create employee')
      }

      setForm({
        Name: '',
        Department: '',
        Position: '',
        Salary: '',
        Email: '',
        Phone: '',
        Address: '',
        DateOfBirth: '',
        DateHired: '',
        Status: ''
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
      Salary: employee.Salary,
      Email: employee.Email || '',
      Phone: employee.Phone || '',
      Address: employee.Address || '',
      DateOfBirth: employee.DateOfBirth
        ? employee.DateOfBirth.slice(0, 10)
        : '',
      DateHired: employee.DateHired
        ? employee.DateHired.slice(0, 10)
        : '',
      Status: employee.Status || ''
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
          Salary: Number(editForm.Salary),
          Email: editForm.Email,
          Phone: editForm.Phone,
          Address: editForm.Address,
          DateOfBirth: editForm.DateOfBirth,
          DateHired: editForm.DateHired,
          Status: editForm.Status
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
        Salary: '',
        Email: '',
        Phone: '',
        Address: '',
        DateOfBirth: '',
        DateHired: '',
        Status: ''
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
          <div className="login-seal">LL</div>
          <h1>Lloyd Laboratories</h1>
          <h2>Sign in to the staff portal</h2>

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

  const departmentBreakdown = report ? computeBreakdown(report.employees, 'Department') : []
  const statusBreakdown = report ? computeBreakdown(report.employees, 'Status') : []

  return (
    <div className="app">
      <aside className="rail">
        <div className="rail-mark">LL</div>
        <div className="rail-line" />
        <button className="rail-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className="content">
        <header className="header">
          <p className="header-eyebrow mono">Lloyd Laboratories · Human Resources</p>
          <h1>Employee Directory</h1>
        </header>

        <main className="main">
          <section className="form-section">
            <h2>Add employee</h2>

            <form onSubmit={handleSubmit}>
              <Field label="Full name">
                <input
                  name="Name"
                  placeholder="e.g. Maria Santos"
                  value={form.Name}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field label="Department">
                <select
                  name="Department"
                  value={form.Department}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select department</option>
                  {optionsWithCurrent(DEPARTMENTS, form.Department).map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </Field>

              <Field label="Position / job title">
                <input
                  name="Position"
                  placeholder="e.g. Quality Analyst"
                  value={form.Position}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field label="Monthly salary (₱)">
                <input
                  name="Salary"
                  type="number"
                  placeholder="0.00"
                  value={form.Salary}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field label="Email address">
                <input
                  name="Email"
                  type="email"
                  placeholder="name@lloydlabs.com"
                  value={form.Email}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Phone number">
                <input
                  name="Phone"
                  placeholder="09XX XXX XXXX"
                  value={form.Phone}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Home address">
                <input
                  name="Address"
                  placeholder="Street, city, province"
                  value={form.Address}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Date of birth">
                <input
                  name="DateOfBirth"
                  type="date"
                  value={form.DateOfBirth}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Date hired">
                <input
                  name="DateHired"
                  type="date"
                  value={form.DateHired}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Employment status">
                <select
                  name="Status"
                  value={form.Status}
                  onChange={handleChange}
                >
                  <option value="">Select status</option>
                  {optionsWithCurrent(STATUSES, form.Status).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>

              <button type="submit" className="btn-primary">Add employee</button>
            </form>
          </section>

          {editingId !== null && (
            <section className="form-section">
              <h2>Edit employee</h2>

              <form onSubmit={updateEmployee}>
                <Field label="Full name">
                  <input
                    name="Name"
                    placeholder="e.g. Maria Santos"
                    value={editForm.Name}
                    onChange={handleEditChange}
                    required
                  />
                </Field>

                <Field label="Department">
                  <select
                    name="Department"
                    value={editForm.Department}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="" disabled>Select department</option>
                    {optionsWithCurrent(DEPARTMENTS, editForm.Department).map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Position / job title">
                  <input
                    name="Position"
                    placeholder="e.g. Quality Analyst"
                    value={editForm.Position}
                    onChange={handleEditChange}
                    required
                  />
                </Field>

                <Field label="Monthly salary (₱)">
                  <input
                    name="Salary"
                    type="number"
                    placeholder="0.00"
                    value={editForm.Salary}
                    onChange={handleEditChange}
                    required
                  />
                </Field>

                <Field label="Email address">
                  <input
                    name="Email"
                    type="email"
                    placeholder="name@lloydlabs.com"
                    value={editForm.Email}
                    onChange={handleEditChange}
                  />
                </Field>

                <Field label="Phone number">
                  <input
                    name="Phone"
                    placeholder="09XX XXX XXXX"
                    value={editForm.Phone}
                    onChange={handleEditChange}
                  />
                </Field>

                <Field label="Home address">
                  <input
                    name="Address"
                    placeholder="Street, city, province"
                    value={editForm.Address}
                    onChange={handleEditChange}
                  />
                </Field>

                <Field label="Date of birth">
                  <input
                    name="DateOfBirth"
                    type="date"
                    value={editForm.DateOfBirth}
                    onChange={handleEditChange}
                  />
                </Field>

                <Field label="Date hired">
                  <input
                    name="DateHired"
                    type="date"
                    value={editForm.DateHired}
                    onChange={handleEditChange}
                  />
                </Field>

                <Field label="Employment status">
                  <select
                    name="Status"
                    value={editForm.Status}
                    onChange={handleEditChange}
                  >
                    <option value="">Select status</option>
                    {optionsWithCurrent(STATUSES, editForm.Status).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </Field>

                <button type="submit" className="btn-primary">Save changes</button>

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
              <button
                className="btn-ghost"
                onClick={async () => {
                  await fetchEmployees()
                  setReport(null)
                  setShowReport(false)
                }}
              >
                Refresh
              </button>
                <button className="btn-primary" onClick={fetchReport}>Generate report</button>
                <button onClick={downloadReportPDF}>Download PDF</button>
              </div>
            </div>

            {loading ? (
              <div className="employee-table">
                <div className="empty-state">
                  <p>Loading the directory…</p>
                  <p>Fetching current employee records.</p>
                </div>
              </div>
            ) : employees.length === 0 ? (
              <div className="employee-table">
                <div className="empty-state">
                  <p>No employees on record yet</p>
                  <p>Add your first employee above to start the directory.</p>
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
                      <th>Status</th>
                      <th>Salary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.Id}>
                        <td className="id-tag">#{employee.Id}</td>
                        <td>
                        <div
                          className="name-cell employee-name"
                          onClick={() => setSelectedEmployee(employee)}
                        >
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
                        <td>
                          <span className={statusClassFor(employee.Status)}>
                            {employee.Status || '—'}
                          </span>
                        </td>
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
                <div className="stat-card">
                  <h3>Total employees</h3>
                  <p>{report.summary.TotalEmployees}</p>
                </div>

                <div className="stat-card">
                  <h3>Total salary</h3>
                  <p>₱{Number(report.summary.TotalSalary).toLocaleString()}</p>
                </div>

                <div className="stat-card">
                  <h3>Average salary</h3>
                  <p>₱{Number(report.summary.AverageSalary).toLocaleString()}</p>
                </div>
              </div>

              <h3>Department breakdown</h3>

              <div className="employee-table">
                <table>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Headcount</th>
                      <th>Total salary</th>
                    </tr>
                  </thead>

                  <tbody>
                    {departmentBreakdown.map((row) => (
                      <tr key={row.key}>
                        <td>
                          <span className={badgeClassFor(row.key)}>{row.key}</span>
                        </td>
                        <td>{row.count}</td>
                        <td className="salary-cell">₱{row.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3>Status breakdown</h3>

              <div className="status-summary">
                {statusBreakdown.map((row) => (
                  <span key={row.key} className={statusClassFor(row.key)}>
                    {row.key} · {row.count}
                  </span>
                ))}
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
                      <th>Status</th>
                      <th>Phone</th>
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
                        <td>
                          <span className={statusClassFor(employee.Status)}>
                            {employee.Status || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={statusClassFor(employee.Phone)}>
                            {employee.Phone || '—'}
                          </span>
                        </td>
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
          {selectedEmployee && (
            <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
              <div
                className="employee-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <p className="mono">Employee Details</p>
                    <h2>{selectedEmployee.Name}</h2>
                  </div>

                  <button
                    className="btn-ghost"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="employee-details">
                  <div>
                    <span>ID</span>
                    <strong>#{selectedEmployee.Id}</strong>
                  </div>

                  <div>
                    <span>Department</span>
                    <strong>{selectedEmployee.Department}</strong>
                  </div>

                  <div>
                    <span>Position</span>
                    <strong>{selectedEmployee.Position}</strong>
                  </div>

                  <div>
                    <span>Salary</span>
                    <strong>
                      ₱{Number(selectedEmployee.Salary).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedEmployee.Email || '—'}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{selectedEmployee.Phone || '—'}</strong>
                  </div>

                  <div>
                    <span>Address</span>
                    <strong>{selectedEmployee.Address || '—'}</strong>
                  </div>

                  <div>
                    <span>Date of Birth</span>
                    <strong>{formatDateWords(selectedEmployee.DateOfBirth)}</strong>
                  </div>

                  <div>
                    <span>Date Hired</span>
                    <strong>{formatDateWords(selectedEmployee.DateHired)}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>{selectedEmployee.Status || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App