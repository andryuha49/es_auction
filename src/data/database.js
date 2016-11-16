import tingoDb from 'tingodb';

export class Database {

    Users = [];
    AccessTokens = [];

    constructor(config) {
        let Db = new tingoDb().Db;
        let db = new Db(config.path, {});

        this.Users = db.collection('users.json');
        this.AccessTokens = db.collection('accessTokens.json');
    }
}