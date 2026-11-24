const mongoose = require('mongoose');

const FieldDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    values: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const LeadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      required: [true, 'Meta leadId is required'],
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      default: 'N/A',
      trim: true
    },
    email: {
      type: String,
      default: 'N/A',
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: 'N/A',
      trim: true
    },
    fieldData: {
      type: [FieldDataSchema],
      default: []
    },
    pageId: {
      type: String,
      default: null,
      trim: true
    },
    formId: {
      type: String,
      default: null,
      trim: true
    },
    adId: {
      type: String,
      default: null,
      trim: true
    },
    adgroupId: {
      type: String,
      default: null,
      trim: true
    },
    campaignId: {
      type: String,
      default: null,
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    status:{
      type:String,
      enum:['active','draft'],
      default:'draft'
    },
    source: {
      type: String,
      default: 'Meta Lead Ads',
      trim: true
    },
    isTestLead: {
      type: Boolean,
      default: false
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

LeadSchema.index({ submittedAt: -1, leadId: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
