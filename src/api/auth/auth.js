import resource from 'resource-router-middleware';
import Login from './models/login';

import facets from '../../models/facets';


import {Router} from 'express';
import passport from 'passport';

import tingoDb from 'tingodb';
import { Database } from '../../data/database';

import crypto from 'crypto';
import assert from 'assert';

import jwt from 'jsonwebtoken';


export default ({config, db}) => {
    let serverSecret = 'serverSecret';
    let api = Router();

    let validateLoginModel = (model) => {
        if (!model.login) {
            return false;
        }
        if (!model.password) {
            return false;
        }
        return true;
    };

    let validateRegisterModel = (model) => {
        if (!model.login) {
            return false;
        }
        if (!model.email) {
            return false;
        }
        if (!model.password) {
            return false;
        }
        return true;
    };

    var sha512 = function(password, salt){
        var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hash.update(password);
        var value = hash.digest('hex');
        return {
            salt:salt,
            passwordHash:value
        };
    };

    api.post('/login', function (req, res, next) {
        let loginModel = req.body;

        if (!validateLoginModel(loginModel)) {
            res.status(500).json({errorMessage: 'Invalid login model'});
        } else {
            db.Users.findOne({login: loginModel.login}, function (err, user) {
                if(err !== null){
                    res.status(500).json(err);
                } else if(user == null){
                    res.status(404).json({errorMessage: 'User not found'});
                } else {
                    let passwordHash = sha512(loginModel.password, serverSecret).passwordHash;
                    if (passwordHash !== user.passwordHash) {
                        res.status(404).json({errorMessage: 'User not found'});
                    } else if (user.isLocked) {
                        res.status(403).json({errorMessage: 'User is locked'});
                    } else {
                        let date = Date.now();
                        let token = jwt.sign({
                            login: user.login,
                            created: date
                        }, serverSecret);

                        db.AccessTokens.insert(
                            [{login: user.login, created: date, token: token}],
                            {w: 1},
                            function (err, result) {
                                if (err !== null) {
                                    res.status(500).json(err);
                                } else {
                                    res.status(200).json({access_token: token});
                                }
                            }
                        );
                    }
                }
            });
        }
    });

    api.post('/register', function(req, res) {
        let registerModel = req.body;

        if (!validateRegisterModel(registerModel)) {
            res.status(500).json({errorMessage: 'Invalid registration model'});
        } else {
            db.Users.findOne({login: registerModel.login}, function (err, item) {
                if(err !== null){
                    res.status(500).json(err);
                } else if(item !== null){
                    res.status(500).json({errorMessage: 'User already exist'});
                } else {
                    registerModel.passwordHash = sha512(registerModel.password, serverSecret).passwordHash;
                    registerModel.password = null;
                    registerModel.createdDate = Date.now();
                    registerModel.isLocked = false;
                    db.Users.insert([registerModel], {w: 1}, function (err, result) {
                        if(err !== null){
                            res.status(500).json(err);
                        } else {
                            res.status(200).json(result);
                        }
                    });
                }
            });
        }

    });

    api.get('/userInfo',
        passport.authenticate('bearer', { session: false }),
        function(req, res) {
            let user = req.user;
            console.log(user);
            res.status(200).json(
                {login: user.login, email: user.email, createdDate: user.createdDate, isLocked: user.isLocked}
            );
        }
    );

    return api;
}