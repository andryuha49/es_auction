import { Router } from 'express';
import auth from './auth';

export default ({ config, db }) => {
    let router = Router();

    // mount the facets resource
    router.use('/auth', auth({ config, db }));

    return router;
}
