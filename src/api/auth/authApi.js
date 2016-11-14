import {Router} from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import {Crypto} from '../../lib/crypto';
import {ValidateModelsService} from './services/validateModelsService';
import {UserViewModel} from './models/userViewModel';


let _router = null;
let _config = null;
let _db = null;
let _validateService = null;
let _crypto = null;

let getPasswordHash = (password) => {
    return _crypto.sha512(password, _config.serverSecret);
};

export class AuthApi {

    constructor(config, db, router) {
        _config = config;
        _router = router;
        _db = db;

        _validateService = new ValidateModelsService();
        _crypto = new Crypto();
    }

    bind() {
        _router.post('/login', this.login);
        _router.post('/register', this.register);
        _router.get('/userInfo', passport.authenticate('bearer', {session: false}), this.userInfo);
        return _router;
    }

    login(req, res) {
        let loginModel = req.body;

        if (!_validateService.validateLoginModel(loginModel)) {
            res.status(500).json({errorMessage: 'Invalid login model'});
        } else {
            _db.Users.findOne({login: loginModel.login}, function (err, user) {
                if (err !== null) {
                    res.status(500).json(err);
                } else if (user == null) {
                    res.status(404).json({errorMessage: 'User not found'});
                } else {
                    let passwordHash = getPasswordHash(loginModel.password);
                    if (passwordHash !== user.passwordHash) {
                        res.status(404).json({errorMessage: 'User not found'});
                    } else if (user.isLocked) {
                        res.status(403).json({errorMessage: 'User is locked'});
                    } else {
                        let date = Date.now();
                        let token = jwt.sign({
                            login: user.login,
                            created: date
                        }, _config.serverSecret);

                        _db.AccessTokens.insert(
                            [{login: user.login, created: date, token: token}],
                            {w: 1},
                            function (err) {
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
    }

    register(req, res) {
        let registerModel = req.body;

        if (!_validateService.validateRegisterModel(registerModel)) {
            res.status(500).json({errorMessage: 'Invalid registration model'});
        } else {
            _db.Users.findOne({login: registerModel.login}, function (err, item) {
                if (err !== null) {
                    res.status(500).json(err);
                } else if (item !== null) {
                    res.status(500).json({errorMessage: 'User already exist'});
                } else {
                    registerModel.passwordHash = getPasswordHash(registerModel.password);
                    registerModel.password = null;
                    registerModel.createdDate = Date.now();
                    registerModel.isLocked = false;
                    _db.Users.insert(registerModel, {w: 1}, function (err, result) {
                        if (err !== null) {
                            res.status(500).json(err);
                        } else {
                            res.status(200).json(new UserViewModel(result[0]));
                        }
                    });
                }
            });
        }
    }

    restorePassword(req, res){
        let email = req.body.email;
        if(!email){
            res.status(500).json({errorMessage: 'Email is required'});
        } else {
            
        }
    }

    userInfo(req, res) {
        res.status(200).json(new UserViewModel(req.user));
    }
}

