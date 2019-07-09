import { Router } from 'express';

const routes = Router();

routes.get('/', (req, res) => {
  res.json({ message: 'User routes backend' });
});

// routes.get('/curr', ensureAuth, (req, res, next) => {
//   res.json({ user: req.user });
// });

export default routes;
