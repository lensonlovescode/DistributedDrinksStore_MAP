import redisClient from "../services/redis.js";

function GetAccessToken() {
  fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${Buffer.from(`${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`, 'utf8').toString('base64')}`
    }
  })
  .then((response) => response.json())
  .then(async (data) => {
    if (data.error) {
      throw new Error(data.error)
    }
    const NewToken = data.access_token;
    console.log(`new token is ${NewToken}`)
    try {
      await redisClient.set("AccessToken", NewToken, 3597);
    } catch (Error) {
      throw new Error(Error);
    }
    return (NewToken);
  })
  .catch((Error) => {
    throw new Error(Error);
  })
}

export default GetAccessToken;
