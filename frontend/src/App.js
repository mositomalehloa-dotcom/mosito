import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
    import { Navbar, Nav, Container, Button, Alert } from 'react-bootstrap';
    import Login from './components/Login';
    import Register from './components/Register';
    import LecturerDashboard from './components/LecturerDashboard';
    import StudentDashboard from './components/StudentDashboard';
    import PlDashboard from './components/PlDashboard';
    import PrlDashboard from './components/PrlDashboard';
    import { jwtDecode } from 'jwt-decode';
    import './App.css';

    function App() {
      const token = localStorage.getItem('token');
      const isAuthenticated = !!token;
      let role = null;
      if (token) {
        try {
          const decoded = jwtDecode(token);
          role = decoded.role;
        } catch (err) {
          console.error('Token decode error:', err);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }

      const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      };

      return (
        <Router>
          <div className="app-container">
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
              <Container>
                <Navbar.Brand as={Link} to="/">LUCT Reporting App</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                  <Nav className="ms-auto">
                    {isAuthenticated ? (
                      <>
                        <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                        <Button variant="outline-light" onClick={handleLogout} className="ms-2">
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Nav.Link as={Link} to="/login">Login</Nav.Link>
                        <Nav.Link as={Link} to="/register">Register</Nav.Link>
                      </>
                    )}
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>

            <main>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  isAuthenticated ? (
                    role === 'student' ? <StudentDashboard /> :
                    role === 'pl' ? <PlDashboard /> :
                    role === 'prl' ? <PrlDashboard /> :
                    role === 'lecturer' ? <LecturerDashboard /> :
                    <Container className="mt-4">
                      <Alert variant="warning">Invalid role. Please contact support.</Alert>
                    </Container>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } />
                <Route path="/" element={<Login />} />
              </Routes>
            </main>

            <footer>
              <Container>
                <p>&copy; {new Date().getFullYear()} LUCT Reporting App. All rights reserved.</p>
                <p>Contact: support@luct.ac.za</p>
              </Container>
            </footer>
          </div>
        </Router>
      );
    }

    export default App;