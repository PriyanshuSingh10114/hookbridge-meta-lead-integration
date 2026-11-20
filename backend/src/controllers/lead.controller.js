const Lead = require('../models/Lead');
const mongoose = require('mongoose');
const socketService = require('../services/socketService');

// Get paginated leads list (newest first)
const getLeads = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find()
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch single lead by leadId or mongo id
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let lead = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findById(id).lean();
    }

    if (!lead) {
      lead = await Lead.findOne({ leadId: id }).lean();
    }

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: `Lead with identifier '${id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// Helper endpoint to push a test lead and verify real-time socket delivery
const createTestLead = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body || {};
    const leadId = 'lead_' + Date.now();
    const lead = await Lead.create({
      leadId,
      name: name || 'Bruce Wayne',
      email: email || 'bruce@wayne-enterprises.com',
      phone: phone || '+1-555-BATMAN',
      source: 'Meta Lead Ads',
      isTestLead: true,
      submittedAt: new Date()
    });

    socketService.broadcastNewLead(lead);

    res.status(201).json({
      success: true,
      message: 'Test lead created and broadcasted',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createTestLead
};

