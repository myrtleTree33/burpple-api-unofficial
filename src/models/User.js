import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import logger from '../logger';

let mongooseHidden = require('mongoose-hidden')();

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  },
  passwordHash: {
    type: String,
    select: false
  },
  details: new Schema({
    _id: false,
    firstName: String,
    lastName: String
  }),
  social: new Schema({
    _id: false,
    provider: {
      type: String
    },
    details: new Schema({
      _id: false,
      id: String,
      token: String,
      tokenSecret: String
    }),
    select: false
  }),
  dateJoined: {
    type: Date,
    required: true,
    default: Date.now,
    select: false
  }
});

userSchema.statics.upsertGoogleUser = function(token, tokenSecret, profile) {
  return this.findOneAndUpdate(
    {
      'social.details.id': profile.id,
      'social.provider': 'google'
    },
    {
      details: {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName
      },
      email: profile.emails[0].value,
      social: {
        provider: 'google',
        details: {
          id: profile.id,
          token,
          tokenSecret
        }
      }
    },
    { upsert: true, new: true }
  ).catch(e => logger.error(`Error inserting Google user.  Error=${e}`));
};

userSchema.statics.upsertFacebookUser = function(token, tokenSecret, profile) {
  return this.findOneAndUpdate(
    {
      'social.details.id': profile.id,
      'social.provider': 'facebook'
    },
    {
      details: {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName
      },
      email: profile.emails[0].value,
      social: {
        provider: 'facebook',
        details: {
          id: profile.id,
          token,
          tokenSecret
        }
      }
    },
    { upsert: true, new: true }
  ).catch(e => logger.error(`Error inserting Facebook user.  Error=${e}`));
};

// This will add `id` in toJSON
userSchema.set('toJSON', {
  virtuals: true
});

userSchema.virtual('password').set(v => {
  this.passwordHash = bcrypt.hashSync(v, 12);
});

// This will remove `_id` and `__v`
userSchema.plugin(mongooseHidden);

export default mongoose.model('User', userSchema);
