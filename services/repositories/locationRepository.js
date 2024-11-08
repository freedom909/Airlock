import connectMysql from "../DB/connectMysqlDB.js";
class LocationRepository {
    constructor(httpClient) {
        this.initPromise = this.init();
        this.httpClient = httpClient;
    }

    async init() {
        this.init = await connectMysql()
    }
}

export default LocationRepository;