import { Router } from 'express';
import Outlet from '../models/Outlet';

const routes = Router();

routes.get('/', (req, res) => {
  res.json({ message: 'Outlet routes backend' });
});

routes.post('/nearest', async (req, res) => {
  const { coordinates, maxDistance, maxPrice } = req.body;

  const nearestOutlets = await Outlet.find({
    $and: [
      { price: { $lte: maxPrice } },
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

  res.json(nearestOutlets);
});

// routes.get('/curr', ensureAuth, (req, res, next) => {
//   res.json({ user: req.user });
// });

export default routes;
