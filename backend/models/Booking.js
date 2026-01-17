const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  search: { type: String, required: true },
  date: { type: String, required: true },
  passengers: { type: Number, required: true },
  status: { type: String, default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);