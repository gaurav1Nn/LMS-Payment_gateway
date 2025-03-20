import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 SECONDS

class DatabaseConnection{
    constructor(){
        this.retryCount = 0;
        this.isConnected = false;

        mongoose.set('strictQuery',true);
        
        mongoose.connection.on("connected", () => {
            console.log('Database connected successfully');
            this.isConnected = true;

        })
        mongoose.connection.on("error",() => {
            console.log('Database connected error');
            this.isConnected = false;

        })
        mongoose.connection.on("disconnected",() => {
            console.log('Database disconnected');
            this.isConnected = false;
            this.Handledisconnection()
        });

        process.on('SIGTERM', this.handleAppTermination.bind(this)); // what is this bind ?
    }
    async connect() {
        try {
            if (!process.env.MONGO_URL) {
                throw new Error('Mongo URL not defined in env variables');
            }
    
            const connectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4 // use IPv4, skip trying IPv6
            };
    
            if (process.env.NODE_ENV === 'development') {
                mongoose.set('debug', true);
            }
    
            await mongoose.connect(process.env.MONGO_URL, connectionOptions);
            this.retryCount = 0; // Reset the retry count on successful connection
    
        } catch (error) {
            console.error('MongoDB Connection Error:', error.message);
            await this.handleConnectionError();
        }
    }

    async handleConnectionError(){
        if(this.retryCount < MAX_RETRIES){
            this.retryCount++;  
            console.log(`Retrying connection ATTEMpt in ${RETRY_INTERVAL} ms of ${MAX_RETRIES} attempts`);
            await new Promise ( resolve => setTimeout(() =>
            {
                resolve
            } , RETRY_INTERVAL));
            return this.connect();
        }else{
            console.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
            process.exit(1);
        }

    }
    async Handledisconnection(){
        if(!this.isConnected){
            console.log("Attempting to reconnect to mongodb...")
            this.connect()
            
        }
    }
    async handleAppTermination(){
        try{
            await mongoose.connection.close();
            console.log("Database connection closed through app termination");
            process.exit(0);
        }catch(error){
            console.error("Error closing database connection",error);
            process.exit(1);
        }
    }

    getConnectionStatus(){
        return {
        isConnected: this.isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        }
    }
}


// create a singleton instance
const dbConnection = new DatabaseConnection();
export default dbConnection.connection.bind(dbConnection)
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
