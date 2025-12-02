const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app. use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speedpost-tracker');

// Schema for tracking data
const trackingSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, required: true },
  status: String,
  location: String,
  expectedDelivery: String,
  lastUpdated: { type: Date, default: Date.now },
  history: [{ date: Date, status: String, location: String }]
});

const TrackingModel = mongoose.model('Tracking', trackingSchema);

// Scrape India Post for tracking information
async function scrapeIndiaPost(trackingId) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to India Post tracking page
    await page.goto(`https://www.indiapost. gov.in/vas/Pages/FindTrackStatus.aspx`, {
      waitUntil: 'networkidle2'
    });

    // Fill tracking ID
    await page.type('#txtArticleNo', trackingId);
    await page.click('#btnSubmit');
    
    // Wait for results
    await page.waitForSelector('.track-result', { timeout: 5000 }). catch(() => null);

    // Extract tracking data
    const trackingData = await page.evaluate(() => {
      const statusElement = document.querySelector('.track-status');
      const locationElement = document.querySelector('.track-location');
      const dateElement = document.querySelector('.track-date');

      return {
        status: statusElement?. innerText || 'Not found',
        location: locationElement?.innerText || 'Not available',
        date: dateElement?.innerText || new Date().toISOString(),
      };
    });

    await browser.close();
    return trackingData;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

// API Endpoint: Get tracking status
app.get('/api/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Check if data exists in cache (less than 5 minutes old)
    let tracking = await TrackingModel.findOne({ trackingId });
    const now = new Date();
    
    if (tracking && (now - tracking.lastUpdated) < 5 * 60 * 1000) {
      return res.json({ data: tracking, cached: true });
    }

    // Scrape fresh data
    const freshData = await scrapeIndiaPost(trackingId);
    
    if (!freshData) {
      return res.status(404). json({ error: 'Tracking ID not found' });
    }

    // Update or create tracking record
    if (tracking) {
      tracking.status = freshData.status;
      tracking.location = freshData.location;
      tracking.lastUpdated = now;
      tracking.history.push({
        date: now,
        status: freshData. status,
        location: freshData.location
      });
    } else {
      tracking = new TrackingModel({
        trackingId,
        status: freshData.status,
        location: freshData.location,
        lastUpdated: now,
        history: [{
          date: now,
          status: freshData.status,
          location: freshData.location
        }]
      });
    }

    await tracking.save();
    res. json({ data: tracking, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint: Get tracking history
app.get('/api/track/:trackingId/history', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const tracking = await TrackingModel.findOne({ trackingId });
    
    if (!tracking) {
      return res.status(404).json({ error: 'No history found' });
    }

    res.json({ history: tracking.history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint: Multiple tracking
app.post('/api/track/multiple', async (req, res) => {
  try {
    const { trackingIds } = req.body;
    const results = await Promise.all(
      trackingIds.map(id => TrackingModel.findOne({ trackingId: id }))
    );
    res.json({ data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
