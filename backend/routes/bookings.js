const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// DELETE /api/bookings/reset - Reset all data (Moved to top to avoid route conflicts)
router.delete('/reset', async (req, res) => {
  try {
    console.log("Resetting all data...");
    await Booking.deleteMany({});
    res.json({ message: 'All data has been reset successfully.' });
  } catch (err) {
    console.error("Reset Error:", err);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// GET /api/bookings - Fetch all bookings
router.get('/', async (req, res) => {
  try {
    const { status, date, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (date) query.date = date;
    if (search) {
      query.$or = [
        { search: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query).sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/stats - Dashboard statistics for admin
router.get('/stats', async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalPassengers: { $sum: "$passengers" },
          confirmedCount: { 
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } 
          },
          pendingCount: { 
            $sum: { $cond: [{ $ne: ["$status", "confirmed"] }, 1, 0] } 
          }
        }
      }
    ]);
    res.json(stats[0] || { totalBookings: 0, totalPassengers: 0, confirmedCount: 0, pendingCount: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/bookings/today - Fetch bookings for the current date
router.get('/today', async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const bookings = await Booking.find({ date: todayStr }).sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s bookings' });
  }
});

// GET /api/bookings/daily-summary - Showcase daily totals and bookings
router.get('/daily-summary', async (req, res) => {
  try {
    const summary = await Booking.aggregate([
      {
        $group: {
          _id: "$date",
          totalPassengers: { $sum: "$passengers" },
          bookingsCount: { $sum: 1 },
          details: { $push: { search: "$search", passengers: "$passengers", status: "$status" } }
        }
      },
      {
        $sort: { _id: 1 } // Sort by date ascending
      }
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', async (req, res) => {
  try {
    const { search, date, passengers } = req.body;
    if (!search || !date || !passengers) {
      return res.status(400).json({ error: 'All fields (search, date, passengers) are required.' });
    }

    // Prevent booking for past dates
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (date < todayStr) {
      return res.status(400).json({ error: 'Cannot book for a past date.' });
    }

    // Restrict Mosque slots to Fridays only
    const dayOfWeek = new Date(date).getUTCDay();
    if (search.toLowerCase().includes("mosque") && dayOfWeek !== 5) {
      return res.status(400).json({ error: 'Mosque slots are only available on Fridays.' });
    }

    // Check total persons for this slot and date (Only count confirmed seats)
    const existingBookings = await Booking.find({ search, date, status: 'confirmed' });
    const totalPersons = existingBookings.reduce((acc, b) => acc + b.passengers, 0);
    if (totalPersons + passengers > 45) {
      return res.status(400).json({ error: `Bus is full. Only ${45 - totalPersons} seats remaining.` });
    }

    const newBooking = new Booking({ search, date, passengers, status: 'pending' });
    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});


// PATCH /api/bookings/:id/confirm - Confirm a booking
router.patch('/:id/confirm', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'confirmed') return res.json(booking);

    // Check capacity again at confirmation time (Reserved seats only count when confirmed)
    const confirmedBookings = await Booking.find({ 
      search: booking.search, 
      date: booking.date, 
      status: 'confirmed' 
    });
    
    const totalConfirmedSeats = confirmedBookings.reduce((acc, b) => acc + b.passengers, 0);
    
    if (totalConfirmedSeats + booking.passengers > 45) {
      return res.status(400).json({ error: 'Bus is full. Cannot confirm this booking.' });
    }

    booking.status = 'confirmed';
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// PATCH /api/bookings/:id - Update booking details (generic update)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});
// DELETE /api/bookings/:id - Delete a booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;