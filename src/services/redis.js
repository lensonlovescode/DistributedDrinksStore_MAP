import { createClient } from "redis";

class RedisClient {
    constructor() {
        this.client = createClient({ url: "redis://localhost:6379" });
        this.client.on('error', (err) => {
            console.log('Redis Client Error', err)
        });
        this.client.connect();
    }

    async isAlive() {
        await this.client.ping()
    }

    async get(key) {
        try {
            const value = await this.client.get(key)
            return value
        } catch (error) {
            console.error('Error getting key: ', error)
            return null
        }
    }

    async set(key, value, duration) {
        try {
            await this.client.set(key, value)
            await this.client.expire(key, duration)
            return true
        } catch (error) {
            console.error('Error setting key: ', error)
            return false
        }
    }

    async del(key) {
        try {
            await this.client.del(key)
            return true
        } catch (error) {
            console.error('Error deleting key: ', error)
            return false
        }
    }
}

export default new RedisClient()
