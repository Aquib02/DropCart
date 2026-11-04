const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => 'sec_' + Math.random().toString(36).substring(2, 9)
    },
    type: {
      type: String,
      required: true,
      enum: [
        'hero_slider',
        'category_bar',
        'product_grid',
        'promotional_banner',
        'flash_deals',
        'featured_collection',
        'brand_strip',
        'assurance_bar'
      ],
      default: 'product_grid'
    },
    title: {
      type: String,
      default: 'Featured Section'
    },
    subtitle: {
      type: String,
      default: ''
    },
    badgeText: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'All'
    },
    selectedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    limit: {
      type: Number,
      default: 4
    },
    order: {
      type: Number,
      default: 0
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    ctaText: {
      type: String,
      default: 'Explore All'
    },
    ctaLink: {
      type: String,
      default: '/shop'
    },
    layoutStyle: {
      type: String,
      enum: ['grid_4', 'grid_3', 'carousel', 'banner_hero', 'full_width'],
      default: 'grid_4'
    }
  },
  { _id: false }
);

const homepageLayoutSchema = new mongoose.Schema(
  {
    versionName: {
      type: String,
      required: true,
      trim: true,
      default: 'Default Homepage Layout'
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true
    },
    versionNumber: {
      type: Number,
      default: 1,
      index: true
    },
    sections: [sectionSchema],
    scheduledAt: {
      type: Date
    },
    publishedAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

homepageLayoutSchema.index({ status: 1, versionNumber: -1 });

module.exports = mongoose.model('HomepageLayout', homepageLayoutSchema);
