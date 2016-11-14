import { Router } from 'express';
import {AuthApi} from './authApi';

export default ({ config, db }) => {
    let router = Router();

    // mount the facets resource
    router.use('/auth', new AuthApi({ config, db }));

    return router;
}
