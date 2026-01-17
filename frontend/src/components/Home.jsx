import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  MenuItem as SelectItem,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionTypography = motion(Typography);

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("MOSQUE");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slotsData, setSlotsData] = useState({});
  const [bookings, setBookings] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Profile menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleMenuItemClick = (action) => {
    handleMenuClose();
    if (drawerOpen) {
      setDrawerOpen(false);
    }
    if (action) action();
  };

  const theme = {
    bg: "#0a1128",
    card: "rgba(20,25,50,0.7)",
    primary: "#FF3B30",
    hover: "#5393ff",
    text: "#e0e0e0",
    muted: "#a0a0a0",
  };

  const API_BASE = "http://127.0.0.1:5001/api";

  // Fetch slots and destinations dynamically
  const fetchHomeData = async () => {
    try {
      const res = await fetch(`${API_BASE}/home/data`);
      if (!res.ok) throw new Error(`Failed to load slots: ${res.status}`);
      const data = await res.json();
      setSlotsData(data.slotsData);
      setBackendError(null);
    } catch (err) {
      console.error("Failed to fetch home data", err);
      setBackendError("Backend server is unreachable. Please ensure it is running on port 5001.");
    }
  };

  // Fetch all bookings dynamically
  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings`);
      if (!res.ok) throw new Error(`Failed to load bookings: ${res.status}`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      await Promise.all([fetchHomeData(), fetchBookings()]);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleBooking = async () => {
    if (!search || !date) {
      alert("Please fill departure/destination and date.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    if (date < todayStr) {
      alert("Cannot book for a past date.");
      return;
    }

    const isFriday = new Date(date).getUTCDay() === 5;
    if (search.toLowerCase().includes("mosque") && !isFriday) {
      alert("Mosque slots are only available on Fridays.");
      return;
    }

    // Check if slot is full (45 persons limit)
    const slotTotalPersons = bookings
      .filter((b) => b.search === search && b.date === date && b.status === 'confirmed')
      .reduce((acc, b) => acc + b.passengers, 0);

    if (slotTotalPersons + passengers > 45) {
      alert(`Limit Reached: Only ${45 - slotTotalPersons} seats remaining for this slot.`);
      return;
    }

    // Pricing logic
    let price = 0;
    if (search.toLowerCase().includes("mosque")) {
      price = 30;
    } else if (search.toLowerCase().includes("evening")) {
      price = 20;
    }

    const totalAmount = price * passengers;

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search, date, passengers }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      alert(`Booking saved! ID: ${data._id}`);
      setBookings((prev) => [...prev, data]);
      setSearch("");
      setDate("");
      setPassengers(1);
      navigate("/pay", { state: { amount: totalAmount, passengers: passengers, bookingId: data._id } });
    } catch (err) {
      console.error(err);
      alert(`Booking failed: ${err.message}. Check backend connection.`);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: theme.bg, color: theme.text, position: "relative", overflow: "hidden" }}>
      {/* Background Animation */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            background: `radial-gradient(circle, ${theme.primary}20 0%, transparent 70%)`,
            filter: "blur(80px)",
            borderRadius: "50%",
          }}
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "70vw",
            height: "70vw",
            background: "radial-gradient(circle, rgba(41,121,255,0.15) 0%, transparent 70%)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
      </Box>

      {/* Connection Warning */}
      {backendError && (
        <Box sx={{ 
          bgcolor: "#d32f2f", 
          color: "white", 
          textAlign: "center", 
          py: 1, 
          position: "fixed", 
          top: 64, 
          width: "100%", 
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="body2">{backendError}</Typography>
          <Button 
            size="small" 
            variant="outlined" 
            sx={{ color: 'white', borderColor: 'white' }} 
            onClick={() => { fetchHomeData(); fetchBookings(); }}
          >
            Retry
          </Button>
        </Box>
      )}

      {/* Navbar */}
      <AppBar
        position="fixed"
        sx={{
          background: "rgba(0,0,30,0.85)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: theme.primary, cursor: "pointer" }}
            onClick={() => navigate("/h")}
          >
            College Bus Booking
          </Typography>

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, alignItems: "center" }}>
            {!user ? ( // Show Login/Signup if not logged in
              <>
                <Button
                  onClick={() => navigate("/")}
                  sx={{ color: theme.text, fontWeight: "bold" }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/s")}
                  sx={{ color: theme.text, fontWeight: "bold" }}
                >
                  Signup
                </Button>
              </>
            ) : ( // Show Hi User, Logout, and Profile menu if logged in
              <>
                <Typography sx={{ color: theme.text, fontWeight: "bold" }}>
                  Hi {user.fullName}
                </Typography>
                <IconButton onClick={handleMenuOpen} sx={{ color: theme.text }}>
                  <AccountCircleIcon />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
                  <MenuItem disabled sx={{ opacity: "1 !important", color: "text.primary" }}>
                    {user ? `${user.fullName}` : "Loading..."}
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick(() => alert("College Bus Booking App\nVersion 1.0"))}>
                    About
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick(() => { localStorage.removeItem("user"); navigate("/"); })}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {/* Mobile Drawer Button */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: theme.text }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer for mobile */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 250, backgroundColor: theme.bg, height: "100%" }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setDrawerOpen(false);
                navigate("/h");
              }}
            >
              <ListItemText primary="Home" sx={{ color: theme.text }} />
            </ListItemButton>
          </ListItem>
          {!user ? (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { setDrawerOpen(false); navigate("/"); }}>
                  <ListItemText primary="Login" sx={{ color: theme.text }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { setDrawerOpen(false); navigate("/s"); }}>
                  <ListItemText primary="Signup" sx={{ color: theme.text }} />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={(event) => {
                    handleMenuOpen(event);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemText primary="Profile" sx={{ color: theme.text }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { localStorage.removeItem("user"); navigate("/"); setDrawerOpen(false); }}>
                  <ListItemText primary="Logout" sx={{ color: theme.text }} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", position: "relative", zIndex: 1 }}>
          <CircularProgress sx={{ color: theme.primary }} />
        </Box>
      ) : (
        <>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 14, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 2, y: 0 }} transition={{ duration: 1 }}>
          <MotionTypography
            variant="h3"
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            sx={{
              fontWeight: "bold",
              mb: 2,
              textAlign: "center",
              background: `linear-gradient(110deg, #ccc 30%, #ccc 45%, #fff 50%, #ccc 55%, #ccc 70%)`,
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Effortless College Bus Booking
          </MotionTypography>
          <Typography variant="h6" sx={{ color: theme.muted, textAlign: "center" }}>
            Reserve your seat quickly with real-time updates.
          </Typography>
        </motion.div>

        {/* Booking Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}>
          <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, mt: 6, alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 250, maxWidth: 450, display: "flex", alignItems: "center", justifyContent: { xs: "center", md: "flex-start" }, gap: 2 }}>
              <Typography
                sx={{
                  color: search ? theme.primary : theme.text,
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  textAlign: { xs: "center", md: "left" }
                }}
              >
                {search ? `Selected: ${search}` : "Choose Your Slots from below!"}
              </Typography>
              {search && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSearch("")}
                  sx={{
                    color: theme.primary,
                    borderColor: theme.primary,
                    "&:hover": { borderColor: theme.hover, color: theme.hover }
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>

            <TextField
              label="Select Date"
              type="date"
              value={date}
              InputLabelProps={{ shrink: true, style: { color: theme.muted } }}
              inputProps={{ min: new Date().toLocaleDateString('en-CA') }}
              onChange={(e) => setDate(e.target.value)}
              sx={{
                width: 200,
                background: theme.card,
                borderRadius: 3,
                "& .MuiInputLabel-root.Mui-focused": { color: theme.primary },
                "& .MuiOutlinedInput-root": { height: 56 },
                input: { color: "#fff", textAlign: "center" },
                "& input::-webkit-calendar-picker-indicator": {
                  filter: "invert(1)",
                  position: "absolute",
                  left: 12,
                  cursor: "pointer",
                },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.primary },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.primary },
              }}
            />

            <TextField
              select
              label="Passengers"
              value={passengers}
              InputLabelProps={{ style: { color: theme.muted } }}
              onChange={(e) => setPassengers(Number(e.target.value))}
              sx={{
                width: 130,
                background: theme.card,
                borderRadius: 3,
                "& .MuiInputLabel-root.Mui-focused": { color: theme.primary },
                "& .MuiOutlinedInput-root": { height: 56 },
                "& .MuiSelect-select": { color: theme.text, textAlign: "center" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.primary },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.primary },
                "& .MuiSvgIcon-root": { color: theme.text }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: theme.text }} />
                  </InputAdornment>
                ),
              }}
            >
              {[1, 2, 3, 4].map((num) => (
                <SelectItem key={num} value={num}>
                  {num}
                </SelectItem>
              ))}
            </TextField>

            <Button
              onClick={handleBooking}
              sx={{
                background: theme.primary,
                color: "#fff",
                borderRadius: 3,
                px: 5,
                height: 56,
                fontWeight: "bold",
                "&:hover": { background: theme.hover, transform: "scale(1.03)" },
              }}
            >
              BOOK
            </Button>
          </Box>
        </motion.div>

        {/* Categories */}
        <Box sx={{ display: "flex", gap: 2, mt: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {slotsData &&
            Object.keys(slotsData).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "contained" : "outlined"}
                onClick={() => setSelectedCategory(category)}
                sx={{
                  background: selectedCategory === category ? theme.primary : theme.card,
                  color: selectedCategory === category ? "#fff" : theme.text,
                  borderColor: theme.primary,
                  borderRadius: 3,
                  px: 5,
                  py: 1.5,
                  fontWeight: 600,
                }}
              >
                {category}
              </Button>
            ))}
        </Box>

        {/* Slots */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mt: 6, width: "100%" }}>
          {slotsData[selectedCategory] &&
            slotsData[selectedCategory].map((slot, idx) => {
              const slotTotalPersons = bookings
                .filter((b) => b.search === slot && b.date === date && b.status === 'confirmed')
                .reduce((acc, b) => acc + b.passengers, 0);

              const isMosque = selectedCategory === "MOSQUE";
              const isFriday = date ? new Date(date).getUTCDay() === 5 : true;
              const mosqueLocked = isMosque && date && !isFriday;
              const isLocked = slotTotalPersons >= 45 || mosqueLocked;
              const isSelected = search === slot;

              return (
                <motion.div key={slot} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: idx * 0.2 }}>
                  <Paper
                    onClick={() => {
                      if (isLocked) return;
                      setSearch(slot);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    sx={{
                      py: 3,
                      textAlign: "center",
                      borderRadius: 3,
                      background: theme.card,
                      border: isLocked || isSelected ? `2px solid ${theme.primary}` : "1px solid rgba(255,255,255,0.1)",
                      color: isLocked || isSelected ? theme.primary : "#fff",
                      boxShadow: !isLocked && isSelected ? `0 0 20px ${theme.primary}66, inset 0 0 10px ${theme.primary}33` : "none",
                      position: "relative",
                      overflow: "hidden",
                      backdropFilter: "blur(12px)",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": !isLocked ? { transform: "scale(1.03)", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" } : {},
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.2,
                    }}
                  >
                    {!isLocked && isSelected && (
                      <Box
                        component={motion.div}
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear", repeatDelay: 2 }}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          zIndex: 0,
                          pointerEvents: "none",
                        }}
                      />
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "relative", zIndex: 1 }}>
                      {isLocked && <LockIcon fontSize="small" />}
                      <Typography sx={{ fontWeight: "bold" }}>{slot}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: isLocked ? theme.primary : theme.muted, fontWeight: "bold", position: "relative", zIndex: 1 }}>
                      {mosqueLocked ? "Only on Fridays" : `${slotTotalPersons} / 45 Seats Taken ${slotTotalPersons >= 45 ? "- FULL" : ""}`}
                    </Typography>
                  </Paper>
                </motion.div>
              );
            })}
        </Box>

        {/* Dynamic Bookings */}
        {date && (
          <Box sx={{ mt: 8, width: "100%" }}>
            <Typography variant="h5" sx={{ mb: 4, textAlign: "center", fontWeight: "bold", color: theme.primary }}>
              Live Bus Status — {new Date(date).toLocaleDateString()}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {Object.entries(
                bookings
                  .filter((b) => b.date === date && b.status === 'confirmed')
                  .reduce((acc, b) => {
                    if (!acc[b.search]) acc[b.search] = { bookings: 0, passengers: 0 };
                    acc[b.search].bookings += 1;
                    acc[b.search].passengers += b.passengers;
                    return acc;
                  }, {})
              ).map(([slotName, data]) => (
                <Paper 
                  key={slotName} 
                  sx={{ 
                    py: 2, 
                    px: 3, 
                    background: theme.card, 
                    color: "#fff", 
                    borderLeft: `4px solid ${data.passengers >= 40 ? theme.primary : "#4caf50"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{slotName}</Typography>
                    <Typography variant="body2" sx={{ color: theme.muted }}>
                      {data.bookings} Total {data.bookings === 1 ? 'Booking' : 'Bookings'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="h6" sx={{ color: data.passengers >= 40 ? theme.primary : "#4caf50" }}>
                      {data.passengers} / 45
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.muted }}>Seats Occupied</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
            {bookings.filter((b) => b.date === date).length === 0 && (
              <Typography sx={{ textAlign: "center", color: theme.muted, fontStyle: "italic" }}>
                No bookings recorded for this date yet.
              </Typography>
            )}
          </Box>
        )}
      </Container>
        </>
      )}

      {/* Footer */}
      <Box sx={{ textAlign: "center", py: 4, mt: 8, background: "rgba(5, 8, 42, 0.8)", backdropFilter: "blur(10px)", color: "#aaa", position: "relative", zIndex: 1 }}>
        © {new Date().getFullYear()} College Bus Booking. All rights reserved.
      </Box>
    </Box>
  );
};

export default Home;
