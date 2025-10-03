// src/components/PrlDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const PrlDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [lecturerStats, setLecturerStats] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchLecturerStats();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/prl/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch classes');
    }
  };

  const fetchLecturerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/prl/lecturer-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLecturerStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch lecturer stats');
    }
  };

  const fetchFeedback = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/prl/feedback/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackData(response.data);
      setSelectedClassId(classId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch feedback');
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.class_name?.toLowerCase().includes(search.toLowerCase()) ||
    cls.course_name?.toLowerCase().includes(search.toLowerCase()) ||
    cls.lecturer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredClasses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Classes');
    XLSX.writeFile(wb, 'prl_classes.xlsx');
  };

  const averageAttendance = classes.length > 0 ? 
    classes.reduce((sum, cls) => sum + cls.actual_students_present, 0) / classes.length : 0;

  return (
    <Container className="mt-5">
      <h2>Principal Lecturer Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Attendance Monitoring</Card.Title>
              <Card.Text>Average Attendance: {averageAttendance.toFixed(2)} students</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <Button variant="primary" onClick={exportToExcel} className="me-2">Download Classes (Excel)</Button>
              <Button variant="success" onClick={() => { fetchClasses(); fetchLecturerStats(); }}>Refresh</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lecturer Stats */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Lecturer Performance</Card.Title>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Lecturer Name</th>
                <th>Total Classes</th>
                <th>Average Rating</th>
                <th>Rating Count</th>
              </tr>
            </thead>
            <tbody>
              {lecturerStats.map(stat => (
                <tr key={stat.lecturer_id}>
                  <td>{stat.lecturer_name}</td>
                  <td>{stat.total_classes}</td>
                  <td>{stat.average_rating ? stat.average_rating.toFixed(2) : 'N/A'}</td>
                  <td>{stat.rating_count}</td>
                </tr>
              ))}
              {lecturerStats.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">No lecturer stats</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Search */}
      <Form.Group className="mb-3">
        <Form.Label>Search Classes</Form.Label>
        <Form.Control type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by class name or lecturer..." />
      </Form.Group>

      {/* Classes Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Course</th>
            <th>Lecturer</th>
            <th>Avg Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClasses.map(cls => (
            <tr key={cls.id}>
              <td>{cls.class_name}</td>
              <td>{cls.course_name}</td>
              <td>{cls.lecturer_name}</td>
              <td>{cls.average_rating ? cls.average_rating.toFixed(2) : 'N/A'}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => fetchFeedback(cls.id)}>View Feedback</Button>
              </td>
            </tr>
          ))}
          {filteredClasses.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">No classes found</td>
            </tr>
          )}
        </tbody>
      </Table>

      {selectedClassId && (
        <Card className="mt-4">
          <Card.Body>
            <Card.Title>Feedback for Class ID {selectedClassId}</Card.Title>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Rating</th>
                  <th>Comments</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbackData.map(fb => (
                  <tr key={fb.id}>
                    <td>{fb.rating}</td>
                    <td>{fb.comments}</td>
                    <td>{fb.created_at}</td>
                  </tr>
                ))}
                {feedbackData.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center">No feedback found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PrlDashboard;