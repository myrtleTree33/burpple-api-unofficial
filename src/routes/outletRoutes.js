import { Router } from 'express';
import Outlet from '../models/Outlet';

const routes = Router();

routes.get('/', (req, res) => {
  res.json({ message: 'Outlet routes backend' });
});

routes.post('/nearest', async (req, res) => {
  const { coordinates, maxDistance, maxPrice, minPrice = 0 } = req.body;

  const nearestOutlets = await Outlet.retrieveNearest({
    coordinates,
    maxDistance,
    maxPrice,
    minPrice
  });

  res.json(nearestOutlets);
});

routes.post('/beyond', async (req, res) => {
  const { coordinates, maxDistance, maxPrice, minPrice = 0 } = req.body;

  const nearestOutlets = await Outlet.retrieveNearestBeyond({
    coordinates,
    maxDistance,
    maxPrice,
    minPrice
  });

  res.json(nearestOutlets);
});

// routes.get('/curr', ensureAuth, (req, res, next) => {
//   res.json({ user: req.user });
// });

export default routes;
