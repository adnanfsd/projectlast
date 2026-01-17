import React from "react";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

// Replace this with your UPI ID and QR image path
const UPI_ID = "9745325772@slice";
const QR_IMAGE = "/slice.jpg"; // ✅ just use '/slice.jpg', not '/public/slice.jpg'

const themeColors = {
  bg: "#0a1128",
  card: "#142136",
  primary: "#2979ff",
  hover: "#5393ff",
  text: "#e0e0e0",
};

const Payments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const amount = location.state?.amount || 0;
  const passengers = location.state?.passengers || 1;
  const bookingId = location.state?.bookingId;

  const API_BASE = "http://127.0.0.1:5001/api";

  const handleConfirmPayment = async () => {
    if (!bookingId) {
      alert("No booking ID found. Please try again.");
      navigate("/h", { replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to confirm payment.");
      }

      alert("Payment confirmed! Your booking is complete.");
      navigate("/h", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Here you might want to add logic to cancel the booking on the backend
    alert("Booking cancelled.");
    navigate("/h", { replace: true }); // ✅ Redirect to home page
  };

  const handlePay = () => {
    const link = `upi://pay?pa=${UPI_ID}&pn=Adnan%20T%20S&am=${amount}&cu=INR`;
    window.open(link);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: themeColors.bg,
        p: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          background: themeColors.card,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
          Complete Your Payment
        </Typography>
        <Typography variant="h6" sx={{ color: themeColors.text, mb: 3 }}>
          Total for {passengers} passenger(s): ₹{amount}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <img src={QR_IMAGE} alt="UPI QR" style={{ width: 200, height: 300, borderRadius: 8 }} />
        </Box>

        <Typography sx={{ mt: 3, color: "rgba(255, 255, 255, 1)", fontWeight: "bold" }}>
          1. Scan QR or click the button to pay
        </Typography>
        <Typography sx={{ mt: 1, mb: 3, color: "rgba(255, 255, 255, 1)", fontWeight: "bold" }}>
          2. After payment, click "Confirm Payment"
        </Typography>

        <Stack spacing={2}>
          <Button
            onClick={handlePay}
            sx={{
              background: themeColors.primary,
              color: "#fff",
              width: "100%",
              py: 1.5,
              fontWeight: "bold",
              "&:hover": { background: themeColors.hover },
            }}
          >
            Pay ₹{amount} via UPI
          </Button>

          <Button
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            sx={{
              background: isSubmitting ? "#9e9e9e" : "#4caf50", 
              color: "#fff",
              width: "100%",
              py: 1.5,
              fontWeight: "bold",
              "&:hover": { background: "#66bb6a" },
            }}
          >
            {isSubmitting ? "Confirming..." : "Confirm Payment"}
          </Button>

          <Button
            onClick={handleCancel}
            sx={{
              background: "#555",
              color: "#fff",
              width: "100%",
              py: 1.5,
              fontWeight: "bold",
              "&:hover": { background: "#777" },
            }}
          >
            Cancel Booking
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Payments;
