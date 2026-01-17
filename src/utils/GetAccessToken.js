
function GetAccessToken() {
  fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`, 'utf8').toString('base64')}`
    }
  })
  .then((response) => response.json())
  .then(async (data) => {
    console.log(data);
    if (data.errorMessage) {
      console.log("Got an error : ")
      throw new Error(data.error)
    }
    const NewToken = data.access_token;
    console.log(`new token is ${NewToken}`)
    try {
      await redisClient.set("AccessToken", NewToken, 3597);
    } catch (error) {
      throw new Error(error);
    }
    return (NewToken);
  })
  .catch((error) => {
    throw new Error(error);
  });
}

export default GetAccessToken;
