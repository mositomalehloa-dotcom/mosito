import React, { useState, useEffect } from 'react';
  import { Container, Form, Button, Table, Alert, Card, Row, Col } from 'react-bootstrap';
  import axios from 'axios';
  import * as XLSX from 'xlsx';
  import ReactStars from 'react-rating-stars-component';
  import '../App.css';

  const StudentDashboard = () => {
    const [classes, setClasses] = useState([]);
    const [search, setSearch] = useState('');
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
      fetchClasses();
    }, []);

    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view classes');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/student/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(response.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch classes');
      }
    };

    const filteredClasses = classes.filter(cls => 
      cls.class_name?.toLowerCase().includes(search.toLowerCase()) ||
      cls.topic_taught?.toLowerCase().includes(search.toLowerCase())
    );

    const handleFeedback = async (e) => {
      e.preventDefault();
      if (!selectedClassId) {
        setError('Please select a class to rate');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/student/feedback', {
          class_id: selectedClassId,
          feedback,
          rating
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Feedback and rating submitted successfully!');
        setFeedback('');
        setRating(0);
        setSelectedClassId(null);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to submit feedback');
      }
    };

    const exportToExcel = () => {
      const ws = XLSX.utils.json_to_sheet(filteredClasses);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Classes');
      XLSX.writeFile(wb, 'student_classes.xlsx');
    };

    const averageAttendance = classes.length > 0 ? 
      classes.reduce((sum, cls) => sum + (cls.actual_students || 0), 0) / classes.length : 0;

    return (
      <Container className="mt-5" style={{ background: 'linear-gradient(to bottom, #e6f3ff, #ffffff)', padding: '20px', borderRadius: '10px' }}>
        <h2 className="text-center mb-4" style={{ color: '#1a3c6e', fontWeight: 'bold' }}>Student Dashboard</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Monitoring Stats */}
        <Row className="mb-4">
          <Col md={6}>
            <Card style={{ border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <Card.Body>
                <Card.Title style={{ color: '#1a3c6e' }}>Class Attendance</Card.Title>
                <Card.Text>Average Attendance: <strong>{averageAttendance.toFixed(2)}</strong> students</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card style={{ border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <Card.Body>
                <Card.Title style={{ color: '#1a3c6e' }}>Quick Actions</Card.Title>
                <Button variant="primary" onClick={exportToExcel} className="me-2" style={{ background: '#1a3c6e', border: 'none' }}>
                  Download Classes (Excel)
                </Button>
                <Button variant="success" onClick={fetchClasses}>Refresh Classes</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search */}
        <Form.Group className="mb-4">
          <Form.Label>Search Classes</Form.Label>
          <Form.Control 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by class name or topic..." 
            style={{ borderRadius: '20px', padding: '10px' }}
          />
        </Form.Group>

        {/* Classes Table */}
        <Table striped hover responsive className="shadow-sm">
          <thead style={{ background: '#1a3c6e', color: 'white' }}>
            <tr>
              <th>Class Name</th>
              <th>Date</th>
              <th>Topic Taught</th>
              <th>Venue</th>
              <th>Scheduled Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map(cls => (
              <tr key={cls.id} style={{ transition: 'background 0.2s' }}>
                <td>{cls.class_name}</td>
                <td>{cls.date}</td>
                <td>{cls.topic_taught}</td>
                <td>{cls.venue}</td>
                <td>{cls.scheduled_time}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => setSelectedClassId(cls.id)}
                    style={{ borderRadius: '15px' }}
                  >
                    Rate
                  </Button>
                </td>
              </tr>
            ))}
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">No classes found</td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* Feedback and Rating Form */}
        <Card className="mt-4" style={{ border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <Card.Body>
            <Card.Title style={{ color: '#1a3c6e' }}>Submit Feedback & Rating</Card.Title>
            <Form onSubmit={handleFeedback}>
              <Form.Group className="mb-3">
                <Form.Label>Select Class</Form.Label>
                <Form.Select 
                  value={selectedClassId || ''} 
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Choose a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.class_name} ({cls.date})</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Rating</Form.Label>
                <ReactStars 
                  count={5}
                  value={rating}
                  onChange={(newRating) => setRating(newRating)}
                  size={30}
                  activeColor="#1a3c6e"
                  emptyColor="#d3d3d3"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Feedback</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  placeholder="Enter your feedback about the class..." 
                  style={{ borderRadius: '10px' }}
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                style={{ background: '#1a3c6e', border: 'none', borderRadius: '20px', padding: '10px 20px' }}
              >
                Submit Feedback
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  };

  export default StudentDashboard;