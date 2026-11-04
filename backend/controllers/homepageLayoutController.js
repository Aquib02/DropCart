const HomepageLayout = require('../models/homepageLayoutModel');

const defaultSections = [
  {
    id: 'sec_category_nav',
    type: 'category_bar',
    title: 'Top Category Navigation',
    subtitle: 'Browse across top shopping categories',
    category: 'All',
    selectedProductIds: [],
    limit: 10,
    order: 0,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: '',
    ctaLink: '',
    layoutStyle: 'full_width'
  },
  {
    id: 'sec_hero_slider',
    type: 'hero_slider',
    title: 'Homepage Hero Showcase',
    subtitle: 'Dynamic campaign slider with promotional highlights',
    category: 'All',
    selectedProductIds: [],
    limit: 5,
    order: 1,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: 'Shop Collection',
    ctaLink: '/shop',
    layoutStyle: 'banner_hero'
  },
  {
    id: 'sec_mobiles_grid',
    type: 'product_grid',
    title: 'Super Deals & Trending Offers',
    subtitle: 'Top flagship smartphones, smartwatches & accessories on festive discount',
    badgeText: 'FESTIVE SALE',
    category: 'Mobiles',
    selectedProductIds: [],
    limit: 4,
    order: 2,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: 'View All Deals',
    ctaLink: '/shop?category=Mobiles',
    layoutStyle: 'grid_4'
  },
  {
    id: 'sec_electronics_grid',
    type: 'product_grid',
    title: 'Laptops, Audio & Tech Essentials',
    subtitle: 'High-performance AI workstations, studio headphones, and accessories',
    badgeText: 'HOT TECH',
    category: 'Electronics',
    selectedProductIds: [],
    limit: 4,
    order: 3,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: 'Explore Tech',
    ctaLink: '/shop?category=Electronics',
    layoutStyle: 'grid_4'
  },
  {
    id: 'sec_promotional_banners',
    type: 'promotional_banner',
    title: 'Promotional Highlights & Campaigns',
    subtitle: 'Exclusive seasonal brand partnerships and flash vouchers',
    badgeText: 'SPECIAL OFFERS',
    category: 'All',
    selectedProductIds: [],
    limit: 3,
    order: 4,
    isVisible: true,
    backgroundColor: '#f8fafc',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    layoutStyle: 'grid_3'
  },
  {
    id: 'sec_home_grid',
    type: 'product_grid',
    title: 'Winter Blankets & Home Essentials',
    subtitle: 'Monte Carlo, Signature Mink Quilts & Bedding at Up to 60% Off',
    badgeText: 'WINTER SPECIAL',
    category: 'Home',
    selectedProductIds: [],
    limit: 4,
    order: 5,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: 'View Home Deals',
    ctaLink: '/shop?category=Home',
    layoutStyle: 'grid_4'
  },
  {
    id: 'sec_fashion_grid',
    type: 'product_grid',
    title: 'Trending Fashion & Footwear',
    subtitle: 'Puma, Denim Jackets, Leather Backpacks and Streetwear Essentials',
    badgeText: 'TRENDING NOW',
    category: 'Fashion',
    selectedProductIds: [],
    limit: 4,
    order: 6,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: 'Explore Fashion',
    ctaLink: '/shop?category=Fashion',
    layoutStyle: 'grid_4'
  },
  {
    id: 'sec_assurance_bar',
    type: 'assurance_bar',
    title: 'DropCart Enterprise Assurance',
    subtitle: '100% Genuine, 7-Day Replacement, Free Express Delivery & 24/7 Priority Support',
    category: 'All',
    selectedProductIds: [],
    limit: 4,
    order: 7,
    isVisible: true,
    backgroundColor: '#ffffff',
    ctaText: '',
    ctaLink: '',
    layoutStyle: 'full_width'
  }
];

// Helper: Ensure initial published layout exists
async function ensureInitialLayout() {
  const published = await HomepageLayout.findOne({ status: 'published' });
  if (!published) {
    const initial = await HomepageLayout.create({
      versionName: 'Default Production Layout v1',
      status: 'published',
      versionNumber: 1,
      sections: defaultSections,
      publishedAt: new Date(),
      notes: 'Initial production baseline layout'
    });
    return initial;
  }
  return published;
}

// 1. GET /api/homepage-layout/published (Public)
exports.getPublishedLayout = async (req, res) => {
  try {
    const published = await ensureInitialLayout();
    // Return published layout populated with selected products if any
    const populated = await HomepageLayout.findById(published._id)
      .populate('sections.selectedProductIds', 'name price originalPrice image images rating numReviews brand category countInStock')
      .lean();
    res.json(populated || published);
  } catch (error) {
    console.error('Error in getPublishedLayout:', error);
    res.status(500).json({ message: 'Error fetching published layout', error: error.message });
  }
};

// 2. GET /api/homepage-layout/draft (Admin / Staff)
exports.getDraftLayout = async (req, res) => {
  try {
    let draft = await HomepageLayout.findOne({ status: 'draft' })
      .populate('sections.selectedProductIds', 'name price originalPrice image images rating numReviews brand category countInStock')
      .sort({ updatedAt: -1 });

    if (!draft) {
      const published = await ensureInitialLayout();
      draft = await HomepageLayout.create({
        versionName: `Draft Layout (based on v${published.versionNumber})`,
        status: 'draft',
        versionNumber: published.versionNumber,
        sections: published.sections,
        createdBy: req.user?._id,
        notes: 'Working draft layout'
      });
      draft = await HomepageLayout.findById(draft._id)
        .populate('sections.selectedProductIds', 'name price originalPrice image images rating numReviews brand category countInStock');
    }

    res.json(draft);
  } catch (error) {
    console.error('Error in getDraftLayout:', error);
    res.status(500).json({ message: 'Error fetching draft layout', error: error.message });
  }
};

// 3. PUT /api/homepage-layout/draft (Admin / Staff)
exports.saveDraftLayout = async (req, res) => {
  try {
    const { versionName, sections, scheduledAt, notes } = req.body;

    let draft = await HomepageLayout.findOne({ status: 'draft' }).sort({ updatedAt: -1 });
    if (!draft) {
      const published = await ensureInitialLayout();
      draft = new HomepageLayout({
        status: 'draft',
        versionNumber: published.versionNumber,
        createdBy: req.user?._id
      });
    }

    if (versionName) draft.versionName = versionName;
    if (Array.isArray(sections)) {
      draft.sections = sections.map((sec, idx) => ({
        ...sec,
        order: sec.order !== undefined ? sec.order : idx
      }));
    }
    if (scheduledAt !== undefined) draft.scheduledAt = scheduledAt;
    if (notes !== undefined) draft.notes = notes;
    draft.createdBy = req.user?._id || draft.createdBy;

    const savedDraft = await draft.save();
    const populated = await HomepageLayout.findById(savedDraft._id)
      .populate('sections.selectedProductIds', 'name price originalPrice image images rating numReviews brand category countInStock');

    res.json({
      success: true,
      message: 'Draft layout saved successfully',
      draft: populated
    });
  } catch (error) {
    console.error('Error in saveDraftLayout:', error);
    res.status(500).json({ message: 'Error saving draft layout', error: error.message });
  }
};

// 4. POST /api/homepage-layout/publish (Admin)
exports.publishDraftLayout = async (req, res) => {
  try {
    const { versionName, notes } = req.body;

    // Find current draft
    const draft = await HomepageLayout.findOne({ status: 'draft' }).sort({ updatedAt: -1 });
    if (!draft || !draft.sections || draft.sections.length === 0) {
      return res.status(400).json({ message: 'No valid draft layout found to publish' });
    }

    // Determine next version number
    const highestVer = await HomepageLayout.findOne().sort({ versionNumber: -1 }).select('versionNumber').lean();
    const nextVer = (highestVer?.versionNumber || 0) + 1;

    // Archive currently published layouts
    await HomepageLayout.updateMany(
      { status: 'published' },
      { $set: { status: 'archived' } }
    );

    // Promote draft to published
    draft.status = 'published';
    draft.versionNumber = nextVer;
    draft.publishedAt = new Date();
    if (versionName) draft.versionName = versionName;
    if (notes) draft.notes = notes;
    draft.createdBy = req.user?._id || draft.createdBy;

    const published = await draft.save();

    // Create a new working draft cloned from this newly published layout for future edits
    await HomepageLayout.create({
      versionName: `Draft v${nextVer + 1}`,
      status: 'draft',
      versionNumber: nextVer,
      sections: published.sections,
      createdBy: req.user?._id,
      notes: `Working draft initialized from v${nextVer}`
    });

    // Populate for response
    const populated = await HomepageLayout.findById(published._id)
      .populate('sections.selectedProductIds', 'name price originalPrice image images rating numReviews brand category countInStock')
      .lean();

    // Broadcast live Socket.IO update to all storefront visitors
    const io = req.app.get('io');
    if (io) {
      io.emit('homepageLayoutUpdated', populated);
    }

    res.json({
      success: true,
      message: `Homepage Layout v${nextVer} published live successfully!`,
      published: populated
    });
  } catch (error) {
    console.error('Error in publishDraftLayout:', error);
    res.status(500).json({ message: 'Error publishing draft layout', error: error.message });
  }
};

// 5. GET /api/homepage-layout/versions (Admin)
exports.getLayoutVersions = async (req, res) => {
  try {
    const versions = await HomepageLayout.find({ status: { $in: ['published', 'archived'] } })
      .select('versionName versionNumber status publishedAt createdAt notes sections')
      .populate('createdBy', 'name email')
      .sort({ versionNumber: -1 })
      .lean();

    const formatted = versions.map(v => ({
      _id: v._id,
      versionName: v.versionName,
      versionNumber: v.versionNumber,
      status: v.status,
      publishedAt: v.publishedAt,
      createdAt: v.createdAt,
      sectionCount: v.sections ? v.sections.length : 0,
      createdBy: v.createdBy ? v.createdBy.name : 'Admin',
      notes: v.notes
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error in getLayoutVersions:', error);
    res.status(500).json({ message: 'Error fetching layout versions', error: error.message });
  }
};

// 6. POST /api/homepage-layout/rollback/:versionId (Admin)
exports.rollbackToVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const targetVersion = await HomepageLayout.findById(versionId);
    if (!targetVersion) {
      return res.status(404).json({ message: 'Target layout version not found' });
    }

    // Determine next version number
    const highestVer = await HomepageLayout.findOne().sort({ versionNumber: -1 }).select('versionNumber').lean();
    const nextVer = (highestVer?.versionNumber || 0) + 1;

    // Archive current published layouts
    await HomepageLayout.updateMany(
      { status: 'published' },
      { $set: { status: 'archived' } }
    );

    // Create new published layout identical to target version
    const newPublished = await HomepageLayout.create({
      versionName: `Rollback to v${targetVersion.versionNumber}: ${targetVersion.versionName}`,
      status: 'published',
      versionNumber: nextVer,
      sections: targetVersion.sections,
      publishedAt: new Date(),
      createdBy: req.user?._id,
      notes: `Restored from version ${targetVersion.versionNumber} (${targetVersion.versionName})`
    });

    // Also update draft to match this restored version
    let draft = await HomepageLayout.findOne({ status: 'draft' });
    if (draft) {
      draft.sections = targetVersion.sections;
      draft.versionName = `Draft (restored from v${targetVersion.versionNumber})`;
      draft.versionNumber = nextVer;
      await draft.save();
    }

    const populated = await HomepageLayout.findById(newPublished._id)
      .populate('sections.selectedProductIds', 'name price originalPrice image images rating numReviews brand category countInStock')
      .lean();

    // Broadcast live Socket.IO update
    const io = req.app.get('io');
    if (io) {
      io.emit('homepageLayoutUpdated', populated);
    }

    res.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion.versionNumber}! Now live as v${nextVer}.`,
      published: populated
    });
  } catch (error) {
    console.error('Error in rollbackToVersion:', error);
    res.status(500).json({ message: 'Error performing rollback', error: error.message });
  }
};

// 7. GET /api/homepage-layout/compare (Admin)
exports.compareDraftAndPublished = async (req, res) => {
  try {
    const published = await HomepageLayout.findOne({ status: 'published' })
      .populate('sections.selectedProductIds', 'name price image brand category')
      .lean();
    const draft = await HomepageLayout.findOne({ status: 'draft' })
      .populate('sections.selectedProductIds', 'name price image brand category')
      .lean();

    res.json({
      published: published || null,
      draft: draft || null
    });
  } catch (error) {
    console.error('Error in compareDraftAndPublished:', error);
    res.status(500).json({ message: 'Error comparing layouts', error: error.message });
  }
};
