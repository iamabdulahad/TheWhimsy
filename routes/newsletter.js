const express = require('express');
const router = express.Router();
const Newsletter = require('../models/newsletter');

// POST /newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already subscribed' });
    }

    const subscription = new Newsletter({ email });
    await subscription.save();

    return res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
