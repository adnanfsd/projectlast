import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  Chip,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";

const themeColors = {
  bg: "#0a1128",
  sidebar: "#0d1538",
  primary: "#2979ff",
  hover: "#5393ff",
  text: "#e0e0e0",
  card: "#142136",
};

const adminMenu = ["Dashboard", "Bookings", "Students", "Payments"];

const Admin = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const isMobile = useMediaQuery("(max-width:900px)");
  const [bookings, setBookings] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [todayStats, setTodayStats] = useState({ mBks: 0, mRev: 0, eBks: 0, eRev: 0 });
  const [mosqueStats, setMosqueStats] = useState({ bookings: 0, revenue: 0 });
  const [eveningStats, setEveningStats] = useState({ bookings: 0, revenue: 0 });
  const [dailySummary, setDailySummary] = useState([]);
  const [isResetting, setIsResetting] = useState(false); // New state for reset button loading
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:5001/api";

  const todayStr = new Date().toLocaleDateString('en-CA');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/bookings`),
        fetch(`${API_BASE}/bookings/daily-summary`)
      ]);

      if (!bookingsRes.ok || !summaryRes.ok) throw new Error("Failed to fetch data");

      const bookingsData = await bookingsRes.json();
      const summaryData = await summaryRes.json();

      setBookings(bookingsData);
      setDailySummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/confirm`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm booking");
      
      fetchData(); // Refresh data after confirmation
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete booking");
      
      fetchData(); // Refresh data after deletion
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("WARNING: This will delete ALL bookings and payment data. This action cannot be undone. Proceed?")) return;
    setIsResetting(true); // Set loading state
    try {
      const res = await fetch(`${API_BASE}/bookings/reset`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset data");
      
      // Clear local state immediately
      setBookings([]);
      setDailySummary([]);
      alert("All data has been cleared.");
      fetchData();
    } catch (err) {
      console.error("Reset Error:", err); // More specific console log
      alert(err.message);
    } finally {
      setIsResetting(false); // Reset loading state
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const confirmedBookings = bookings.filter(
      (booking) => booking.status === "confirmed"
    );

    const students = confirmedBookings.reduce(
      (acc, booking) => acc + booking.passengers,
      0
    );
    setTotalStudents(students);

    const mConfirmed = confirmedBookings.filter(b => b.search.toLowerCase().includes("mosque"));
    const eConfirmed = confirmedBookings.filter(b => b.search.toLowerCase().includes("evening"));

    const mRev = mConfirmed.reduce((acc, b) => acc + b.passengers * 30, 0);
    const eRev = eConfirmed.reduce((acc, b) => acc + b.passengers * 20, 0);

    setMosqueStats({ bookings: mConfirmed.length, revenue: mRev });
    setEveningStats({ bookings: eConfirmed.length, revenue: eRev });
    setTotalPayments(mRev + eRev);

    const todayConfirmed = confirmedBookings.filter(b => b.date === todayStr);
    const tmConfirmed = todayConfirmed.filter(b => b.search.toLowerCase().includes("mosque"));
    const teConfirmed = todayConfirmed.filter(b => b.search.toLowerCase().includes("evening"));
    setTodayStats({
      mBks: tmConfirmed.length,
      mRev: tmConfirmed.reduce((acc, b) => acc + b.passengers * 30, 0),
      eBks: teConfirmed.length,
      eRev: teConfirmed.reduce((acc, b) => acc + b.passengers * 20, 0)
    });
  }, [bookings]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: themeColors.bg }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            background: themeColors.sidebar,
            color: themeColors.text,
            borderRight: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          },
        }}
      >
        {/* Menu Items */}
        <Box>
          <Box sx={{ p: 3, fontWeight: "bold", fontSize: "1.5rem", textAlign: "center", color: themeColors.primary }}>
            Admin Panel
          </Box>
          <List>
            {adminMenu.map((menu) => (
              <ListItem key={menu} disablePadding>
                <ListItemButton
                  sx={{
                    color: themeColors.text,
                    mb: 0.5,
                    borderRadius: 1,
                    "&.Mui-selected": { backgroundColor: themeColors.primary, color: "#fff" },
                  }}
                  selected={activeMenu === menu}
                  onClick={() => {
                    setActiveMenu(menu);
                    if (isMobile) setDrawerOpen(false);
                  }}
                >
                  <ListItemText primary={menu} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Bottom Buttons */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            sx={{ mb: 1, fontWeight: "bold" }}
            disabled={isResetting} // Disable button while resetting
            onClick={handleReset}
          >
            {isResetting ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Reset All Data"}
          </Button>
          <Button
            startIcon={<HomeIcon />}
            fullWidth
            sx={{
              color: themeColors.text,
              mb: 1,
              background: themeColors.card,
              "&:hover": { background: themeColors.primary, color: "#fff" },
            }}
            onClick={() => navigate("/h")}
          >
            Home
          </Button>
          <Button
            startIcon={<LogoutIcon />}
            fullWidth
            sx={{
              color: themeColors.text,
              background: themeColors.card,
              "&:hover": { background: themeColors.primary, color: "#fff" },
            }}
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          ml: isMobile ? 0 : "240px",
        }}
      >
        {/* Mobile AppBar */}
        {isMobile && (
          <AppBar position="fixed" sx={{ background: themeColors.sidebar }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ ml: 2 }}>
                Admin Panel
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ mt: isMobile ? 8 : 0 }}>
          <Typography variant="h4" sx={{ color: "#fff", mb: 3 }}>
            {activeMenu}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              sx={{ background: themeColors.primary, '&:hover': { background: themeColors.hover } }}
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Refresh Data"}
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
              <CircularProgress sx={{ color: themeColors.primary }} />
            </Box>
          ) : (
            <>
          {/* Dashboard Cards */}
          {activeMenu === "Dashboard" && (
            <>
            <Typography variant="h5" sx={{ color: themeColors.primary, mb: 2 }}>Today's Summary</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
              <Paper sx={{ flex: "1 1 200px", p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Today's Mosque Bks</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>{todayStats.mBks}</Typography>
              </Paper>
              <Paper sx={{ flex: "1 1 200px", p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Today's Evening Bks</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>{todayStats.eBks}</Typography>
              </Paper>
              <Paper sx={{ flex: "1 1 200px", p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Today's Mosque Rev</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>₹{todayStats.mRev}</Typography>
              </Paper>
              <Paper sx={{ flex: "1 1 200px", p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Today's Evening Rev</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>₹{todayStats.eRev}</Typography>
              </Paper>
            </Box>

            <Typography variant="h5" sx={{ color: themeColors.primary, mb: 2 }}>Overall Statistics</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
              <Paper
                sx={{
                  flex: "1 1 200px",
                  p: 3,
                  background: themeColors.card,
                  color: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              >
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Mosque (Confirmed)</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>
                  {mosqueStats.bookings}
                </Typography>
              </Paper>
              <Paper
                sx={{
                  flex: "1 1 200px",
                  p: 3,
                  background: themeColors.card,
                  color: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              >
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Evening (Confirmed)</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>
                  {eveningStats.bookings}
                </Typography>
              </Paper>
              <Paper
                sx={{
                  flex: "1 1 200px",
                  p: 3,
                  background: themeColors.card,
                  color: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              >
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Mosque Revenue</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>
                  ₹{mosqueStats.revenue}
                </Typography>
              </Paper>
              <Paper
                sx={{
                  flex: "1 1 200px",
                  p: 3,
                  background: themeColors.card,
                  color: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              >
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Evening Revenue</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>
                  ₹{eveningStats.revenue}
                </Typography>
              </Paper>
            </Box>
            </>
          )}

          {/* Tables for other menus */}
          {activeMenu === "Bookings" && (
            <>
            <Typography variant="h6" sx={{ color: themeColors.primary, mb: 2 }}>Today's Mosque Bookings</Typography>
            <TableContainer component={Paper} sx={{ background: themeColors.card, mb: 4 }}>
              <Table>
                <TableHead sx={{ background: themeColors.sidebar }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Slot</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Passengers</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.filter(b => b.date === todayStr && b.search.toLowerCase().includes("mosque") && b.status === "confirmed").map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell sx={{ color: "#fff" }}>{booking.search}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.passengers}</TableCell>
                      <TableCell><Chip label={booking.status} color="success" size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ color: themeColors.primary, mb: 2 }}>Today's Evening Bookings</Typography>
            <TableContainer component={Paper} sx={{ background: themeColors.card, mb: 4 }}>
              <Table>
                <TableHead sx={{ background: themeColors.sidebar }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Slot</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Passengers</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.filter(b => b.date === todayStr && b.search.toLowerCase().includes("evening") && b.status === "confirmed").map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell sx={{ color: "#fff" }}>{booking.search}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.passengers}</TableCell>
                      <TableCell><Chip label={booking.status} color="success" size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ color: themeColors.primary, mb: 2 }}>Mosque Bookings</Typography>
            <TableContainer component={Paper} sx={{ background: themeColors.card }}>
              <Table>
                <TableHead sx={{ background: themeColors.sidebar }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Slot</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Passengers</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.filter(b => b.search.toLowerCase().includes("mosque")).map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell sx={{ color: "#fff" }}>{booking._id}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.search}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.date}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.passengers}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={booking.status === 'confirmed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {booking.status !== "confirmed" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            sx={{ mr: 1 }}
                            onClick={() => handleConfirm(booking._id)}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(booking._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ color: themeColors.primary, mb: 2 }}>Evening Bookings</Typography>
            <TableContainer component={Paper} sx={{ background: themeColors.card }}>
              <Table>
                <TableHead sx={{ background: themeColors.sidebar }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Slot</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Passengers</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.filter(b => b.search.toLowerCase().includes("evening")).map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell sx={{ color: "#fff" }}>{booking._id}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.search}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.date}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{booking.passengers}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={booking.status === 'confirmed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {booking.status !== "confirmed" && (
                          <Button size="small" variant="contained" color="success" sx={{ mr: 1 }} onClick={() => handleConfirm(booking._id)}>Confirm</Button>
                        )}
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(booking._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          )}

          {activeMenu === "Students" && (
            <TableContainer component={Paper} sx={{ background: themeColors.card }}>
              <Table>
                <TableHead sx={{ background: themeColors.sidebar }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Route</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Confirmed Seats</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings
                    .filter((b) => b.status === "confirmed")
                    .map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell sx={{ color: "#fff" }}>{booking.search}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{booking.date}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{booking.passengers}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeMenu === "Payments" && (
            <>
            <Typography variant="h6" sx={{ color: themeColors.primary, mb: 2 }}>Today's Revenue Breakdown</Typography>
            <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
              <Paper sx={{ flex: 1, p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Today's Mosque Revenue</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>₹{todayStats.mRev}</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Today's Evening Revenue</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>₹{todayStats.eRev}</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 3, background: themeColors.card, color: "#fff", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Total Today</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: themeColors.primary }}>₹{todayStats.mRev + todayStats.eRev}</Typography>
              </Paper>
            </Box>

            <Typography variant="h6" sx={{ color: themeColors.primary, mb: 2 }}>Daily Summary</Typography>
            <TableContainer component={Paper} sx={{ background: themeColors.card }}>
              <Table>
                <TableHead sx={{ background: themeColors.sidebar }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Mosque (Bks/Rev)</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Evening (Bks/Rev)</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Total Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailySummary.map((day) => {
                    const mData = day.details.filter(d => d.search.toLowerCase().includes("mosque") && d.status === "confirmed");
                    const eData = day.details.filter(d => d.search.toLowerCase().includes("evening") && d.status === "confirmed");

                    const mRev = mData.reduce((acc, d) => acc + d.passengers * 30, 0);
                    const eRev = eData.reduce((acc, d) => acc + d.passengers * 20, 0);

                    return (
                      <TableRow key={day._id}>
                        <TableCell sx={{ color: "#fff" }}>{day._id}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{mData.length} / ₹{mRev}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{eData.length} / ₹{eRev}</TableCell>
                        <TableCell sx={{ color: themeColors.primary, fontWeight: "bold" }}>
                          ₹{mRev + eRev}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Admin;
