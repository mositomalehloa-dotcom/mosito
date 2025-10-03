import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const PlDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pl/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
      if (response.data.length === 0) {
        setError('No classes found.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async (classId) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/pl/feedback/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackData(response.data);
      setSelectedClassId(classId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.class_name?.toLowerCase().includes(search.toLowerCase()) ||
    cls.course_name?.toLowerCase().includes(search.toLowerCase()) ||
    cls.lecturer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    if (filteredClasses.length === 0) {
      setError('No classes to export');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(filteredClasses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Classes');
    XLSX.writeFile(wb, 'pl_classes.xlsx');
  };

  const averageAttendance = classes.length > 0 ? 
    classes.reduce((sum, cls) => sum + (cls.actual_students || 0), 0) / classes.length : 0;

  return (
    <Container className="mt-5">
      <h2>Program Leader Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Alert variant="info">Loading...</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Attendance Monitoring</Card.Title>
              <Card.Text>Average Attendance: {averageAttendance.toFixed(2)} students ({classes.length} classes)</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <Button variant="primary" onClick={exportToExcel} className="me-2" disabled={filteredClasses.length === 0}>
                Download Classes (Excel)
              </Button>
              <Button variant="success" onClick={fetchClasses}>Refresh</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Search Classes</Form.Label>
        <Form.Control 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search by class name, course, or lecturer..." 
        />
      </Form.Group>

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
              <td>{cls.course_name} ({cls.course_code})</td>
              <td>{cls.lecturer_name}</td>
              <td>{cls.average_rating ? cls.average_rating.toFixed(2) : 'N/A'}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => fetchFeedback(cls.id)}>View Feedback</Button>
              </td>
            </tr>
          ))}
          {filteredClasses.length === 0 && !loading && (
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

export default PlDashboard;