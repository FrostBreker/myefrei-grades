import {MongoClient, MongoClientOptions} from "mongodb";

const options: MongoClientOptions = {};

// Declare the global type for TypeScript
declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

// Only initialize MongoDB connection at runtime, not during build
const uri = process.env.MONGODB_URI;

if (uri) {
    if (process.env.NODE_ENV === "development") {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        if (!global._mongoClientPromise) {
            const client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect();
        }
        clientPromise = global._mongoClientPromise;
    } else {
        // In production mode, it's best to not use a global variable.
        const client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
} else {
    // During build, MONGODB_URI is not available - create a dummy promise
    // that will be replaced at runtime
    clientPromise = new Promise(() => {
        // This promise never resolves during build - that's OK
        // It will be properly initialized at runtime
    });
}

export default clientPromise;