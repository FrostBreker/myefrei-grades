import {MongoClient, MongoClientOptions} from "mongodb";

const options: MongoClientOptions = {};

// Declare the global type for TypeScript
declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

// Debug: log all relevant environment variables (only in production to debug deployment issues)
if (process.env.NODE_ENV === 'production') {
    console.log('🔍 Environment Variables Debug:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('   MONGODB_URI length:', process.env.MONGODB_URI?.length);
    console.log('   MONGODB_URI first 30 chars:', process.env.MONGODB_URI?.substring(0, 30));
    console.log('   MONGODB_URI char codes [0-10]:', process.env.MONGODB_URI?.substring(0, 10).split('').map(c => c.charCodeAt(0)));
    console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('   NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('   GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('   GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('   NEW_RELIC_LICENSE_KEY exists:', !!process.env.NEW_RELIC_LICENSE_KEY);
    console.log('   NEW_RELIC_APP_NAME:', process.env.NEW_RELIC_APP_NAME);
    console.log('   ENABLE_NEW_RELIC:', process.env.ENABLE_NEW_RELIC);
    console.log('   All env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', '));
}

// Only initialize MongoDB connection at runtime, not during build
let uri = process.env.MONGODB_URI;

// Clean up URI - remove quotes, BOM, and trim whitespace
if (uri) {
    // Remove BOM if present
    if (uri.charCodeAt(0) === 0xFEFF) {
        uri = uri.slice(1);
    }
    // Remove quotes and trim
    uri = uri.replace(/^["']|["']$/g, '').trim();
}

// Validate URI format
if (uri && !uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('❌ Invalid MONGODB_URI format. Expected to start with "mongodb://" or "mongodb+srv://"');
    console.error('   Current value starts with:', JSON.stringify(uri.substring(0, 30)));
    uri = undefined;
}

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
    // During build or if URI is invalid - create a promise that throws when used
    clientPromise = Promise.reject(
        new Error('MONGODB_URI is not configured. Please check your environment variables.')
    );
    // Prevent unhandled rejection during module load
    clientPromise.catch(() => {});
}

export default clientPromise;