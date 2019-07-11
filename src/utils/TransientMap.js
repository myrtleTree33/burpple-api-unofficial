const getAge = timeCreated => Date.now() - timeCreated;

/**
 * A map which lazy-initializes and lazy-clears
 * unused contexts.
 *
 * This is an abstraction, to allow a database
 * to be used in future, for example.
 *
 * Each entry is set with an expiry date,
 * and age.  Updating the entry
 * resets the expiry
 * date
 */
class TransientMap {
  constructor({ expiry = 600000 } = {}) {
    this.map = {};
    this.props = {
      expiry // default 10 mins
    };
  }

  setExpiry(expiry) {
    this.props.expiry = expiry;
  }

  async get(userId) {
    const { expiry } = this.props;
    let context = this.map[userId];

    if (!context || getAge(context.timeCreated) > expiry) {
      context = {
        timeCreated: Date.now()
      };
      this.map[userId] = context;
    }

    return Promise.resolve(context);
  }

  async set(userId, newProps) {
    let context = await this.get(userId);

    context = {
      ...context,
      ...newProps,
      timeCreated: Date.now()
    };

    this.map[userId] = context;
    return Promise.resolve(context);
  }
}

export default TransientMap;
