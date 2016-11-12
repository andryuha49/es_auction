import { version } from '../../package.json';
import { Router } from 'express';

import passport from 'passport';
import BearerStrategy from 'passport-http-bearer';

import facets from './facets';

import auth from './auth/auth';
import { Database } from '../data/database';

export default ({ config, db }) => {
	let api = Router();


	/*passport.use(new BearerStrategy(
		function(token, done) {
			return done(null, {id:1}, token);
			User.findById(token.sub, function (err, user) {
				if (err) { return done(err); }
				if (!user) { return done(null, false); }
				return done(null, user, token);
			});
		}
	));*/

	passport.use(new BearerStrategy(
		function(accessToken, done) {
			db.AccessTokens.findOne({ token: accessToken }, function(err, token) {
				if (err) { return done(err); }
				if (!token) { return done(null, false); }

				if( Math.round((Date.now()-token.created)/1000) > config.security.tokenLife ) {
					db.AccessTokens.remove({ token: accessToken }, function (err) {
						if (err) return done(err);
					});
					return done(null, false, { message: 'Token expired' });
				}

				db.Users.findOne( {login: token.login}, function(err, user) {
					if (err) { return done(err); }
					if (!user) { return done(null, false, { message: 'Unknown user' }); }

					var info = { scope: '*' };
					return done(null, user, info);
				});
			});
		}
	));

	// mount the facets resource
	api.use('/facets', facets({ config, db }));

	api.use('/auth', auth({ config, db }));

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
