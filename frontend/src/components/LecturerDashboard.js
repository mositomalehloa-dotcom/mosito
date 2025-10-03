import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const LecturerDashboard = () => {
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [submitForm, setSubmitForm] = useState({
    class_name: '',
    course_code: '',
    venue: '',
    scheduled_time: '',
    week: '',
    date: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: '',
    actual_students: '',
    total_registered_students: ''
  });

  useEffect(() => {
    fetchReports();
    fetchCourses();
  }, []);

  const fetchReports = async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters).toString();
      const url = params ? `http://localhost:5000/api/lecturer/reports?${params}` : 'http://localhost:5000/api/lecturer/reports';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
      if (response.data.length === 0) {
        setError('No reports found. Submit one below to get started!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/lecturer/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses for submission form');
    }
  };

  const handleSearch = () => {
    const filters = {};
    if (searchKeyword) filters.keyword = searchKeyword;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    fetchReports(filters);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/lecturer/reports', submitForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Report submitted! ID: ${response.data.id}. Total registered: ${response.data.total_registered}`);
      setSubmitForm({
        class_name: '',
        course_code: '',
        venue: '',
        scheduled_time: '',
        week: '',
        date: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: '',
        actual_students: '',
        total_registered_students: ''
      });
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    }
  };

  const exportToExcel = () => {
    if (reports.length === 0) {
      setError('No reports to export');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reports);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    XLSX.writeFile(wb, 'lecturer_reports.xlsx');
  };

  const averageAttendance = reports.length > 0 ? reports.reduce((sum, r) => sum + parseInt(r.actual_students), 0) / reports.length : 0;

  return (
    <Container className="mt-5">
      <h2>Lecturer Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {loading && <Alert variant="info">Loading...</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Attendance Monitoring</Card.Title>
              <Card.Text>Average Attendance: {averageAttendance.toFixed(2)} students ({reports.length} reports)</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <Button variant="primary" onClick={exportToExcel} className="me-2" disabled={reports.length === 0}>
                Download Reports (Excel)
              </Button>
              <Button variant="success" onClick={() => fetchReports()}>Refresh</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Advanced Search</Card.Title>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Keyword (Topic/Class)</Form.Label>
                <Form.Control type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="e.g., SQL" />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date From</Form.Label>
                <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date To</Form.Label>
                <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button variant="primary" onClick={handleSearch} className="mt-4">Search</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Submit New Report</Card.Title>
          <Form onSubmit={handleSubmitReport}>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Class Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={submitForm.class_name}
                    onChange={(e) => setSubmitForm({ ...submitForm, class_name: e.target.value })}
                    required
                    placeholder="e.g., CS101 Week 1"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Course</Form.Label>
                  <Form.Select
                    value={submitForm.course_code}
                    onChange={(e) => setSubmitForm({ ...submitForm, course_code: e.target.value })}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.course_code} value={course.course_code}>
                        {course.course_name} ({course.course_code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Venue</Form.Label>
                  <Form.Control
                    type="text"
                    value={submitForm.venue}
                    onChange={(e) => setSubmitForm({ ...submitForm, venue: e.target.value })}
                    required
                    placeholder="e.g., Room 101"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={submitForm.scheduled_time}
                    onChange={(e) => setSubmitForm({ ...submitForm, scheduled_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Week</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={submitForm.week}
                    onChange={(e) => setSubmitForm({ ...submitForm, week: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={submitForm.date}
                    onChange={(e) => setSubmitForm({ ...submitForm, date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Students Present</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={submitForm.actual_students}
                    onChange={(e) => setSubmitForm({ ...submitForm, actual_students: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Total Registered</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={submitForm.total_registered_students}
                    onChange={(e) => setSubmitForm({ ...submitForm, total_registered_students: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Topic Taught</Form.Label>
                  <Form.Control
                    type="text"
                    value={submitForm.topic_taught}
                    onChange={(e) => setSubmitForm({ ...submitForm, topic_taught: e.target.value })}
                    required
                    placeholder="e.g., SQL Queries"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Learning Outcomes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={submitForm.learning_outcomes}
                    onChange={(e) => setSubmitForm({ ...submitForm, learning_outcomes: e.target.value })}
                    required
                    placeholder="e.g., Understand JOINs"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Recommendations</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={submitForm.recommendations}
                    onChange={(e) => setSubmitForm({ ...submitForm, recommendations: e.target.value })}
                    placeholder="Any recommendations..."
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" variant="success" className="mt-3">Submit Report</Button>
          </Form>
        </Card.Body>
      </Card>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Date</th>
            <th>Topic</th>
            <th>Students Present</th>
            <th>Total Registered</th>
            <th>Venue</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.class_name}</td>
              <td>{report.date}</td>
              <td>{report.topic_taught}</td>
              <td>{report.actual_students}</td>
              <td>{report.total_registered_students}</td>
              <td>{report.venue}</td>
              <td>{report.scheduled_time}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => window.alert('Edit report')}>Edit</Button>
                <Button variant="danger" size="sm" className="ms-1" onClick={() => window.alert('Delete report')}>Delete</Button>
              </td>
            </tr>
          ))}
          {reports.length === 0 && !loading && (
            <tr>
              <td colSpan="8" className="text-center">No reports found. Submit one above!</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default LecturerDashboard;