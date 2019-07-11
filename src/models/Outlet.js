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

function retrieveNearest({ maxPrice, minPrice = 0, coordinates, maxDistance }) {
  return this.find({
    $and: [
      { price: { $lte: maxPrice } },
      { price: { $gte: minPrice } },
      {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates
            },
            $minDistance: 0,
            $maxDistance: maxDistance
          }
        }
      }
    ]
  });
}

outletSchema.statics.retrieveNearest = retrieveNearest;

function retrieveNearestBeyond({ maxPrice, minPrice = 0, coordinates, maxDistance }) {
  const [maxPrice2, minPrice2] = [maxPrice * 2, minPrice * 2];

  return this.find({
    $and: [
      { hasBeyond: true },
      { price: { $lte: maxPrice2 } },
      { price: { $gte: minPrice2 } },
      {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates
            },
            $minDistance: 0,
            $maxDistance: maxDistance
          }
        }
      }
    ]
  });
}

outletSchema.statics.retrieveNearestBeyond = retrieveNearestBeyond;

outletSchema.index({ location: '2dsphere' });

export default mongoose.model('Outlet', outletSchema);
