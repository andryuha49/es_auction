import tingoDb from 'tingodb';

export class Database {

    Users = [];
    AccessTokens = [];

    constructor() {
        let Db = new tingoDb().Db;
        let db = new Db('./db', {});

        this.Users = db.collection('users.json');
        this.AccessTokens = db.collection('accessTokens.json');
    }
}