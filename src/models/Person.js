import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import logger from '../logger';

let mongooseHidden = require('mongoose-hidden')();

const { Schema } = mongoose;

const personSchema = new Schema({
  personId: {
    type: String,
    required: true,
    unique: true
  },
  dateJoined: {
    type: Date,
    required: true,
    default: Date.now,
    select: false
  },
  lastVisited: {
    type: Date,
    required: true,
    default: Date.now,
    select: false
  }
});

personSchema.statics.updateUserLogin = async function(personId) {
  return this.updateOne(
    {
      personId
    },
    {
      personId,
      lastVisited: Date.now()
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

export default mongoose.model('Person', personSchema);
