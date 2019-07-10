import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import logger from '../logger';

const { Schema } = mongoose;

const outletSchema = new Schema({
  outletId: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  numReviews: {
    type: Number
  },
  price: {
    type: Number
  },
  categories: {
    type: [String]
  },
  hasBeyond: {
    type: Boolean
  },
  genericLoc: {
    type: String
  },
  link: {
    type: String
  },

  dateAdded: {
    type: Date,
    default: Date.now
  },

  // See https://stackoverflow.com/questions/32199658/create-find-geolocation-in-mongoose
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  address: {
    type: String
  }
});

// This will add `id` in toJSON
outletSchema.set('toJSON', {
  virtuals: true
});

outletSchema.index({ location: '2dsphere' });

export default mongoose.model('Outlet', outletSchema);
