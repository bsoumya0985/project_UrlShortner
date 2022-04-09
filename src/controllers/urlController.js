const urlModel = require('../models/urlModel');
const validUrl = require('valid-url');
const {nanoid} = require('nanoid');
const res = require('express/lib/response');
const redis = require("redis")
const {promisify} = require("util")

const baseUrl = "http://localhost:3000" //declaring a baseUrl and assigning it a value.



//Connect to redis
const redisClient = redis.createClient(
    13271,
    "redis-13271.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("CoxjhV497TBtlZ4JMY7hpmIW42aE32m5", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });  

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createShortUrl = async (req,res) => {
    try {
        let requestBody = req.body;
        if(Object.keys(requestBody).length == 0){
        return res.status(400).json({status:false, msg:`Invalid request. Insert some data in the body!`}); //validation for empty body.
        }
        let {longUrl} = requestBody; //taking input in postman body

        if(!validUrl.isUri(baseUrl)){ //validating our baseUrl
            return res.status(400).json({status:false, msg:`Invalid Base URL`});
        }
        const urlCode = nanoid(); //generating urlCode using nanoid package

        if(!validUrl.isUri(longUrl)){ //validation for longUrl
            return res.status(400).json({status:false, msg:`Invalid Long URL`});
        }
        const cahcedUrlData= await GET_ASYNC(`${longUrl}`)
        const newCahcedUrlData=JSON.parse(cahcedUrlData)
        if(newCahcedUrlData){
        return res.status(200).send({ status: "true", data: newCahcedUrlData })
      }
        let urlPresent = await urlModel.findOne({ longUrl: longUrl }).select({_id:0,createdAt:0,updatedAt:0,__v:0})
            if (urlPresent) { 
        await SET_ASYNC(`${longUrl}`,JSON.stringify(urlPresent))
        return res.status(200).send({ status: true, data: urlPresent }) 
    }

            else{
        const shortUrl = baseUrl + '/' + urlCode; //making shortUrl
        url = new urlModel({ //creating a new instance of our model/schema
        longUrl, shortUrl, urlCode    //including the changes in our documents
        })
        await url.save(); //updating the above made changes
        return res.status(201).json({status:true, data:url})
            }
        }
        catch (error) {
        res.status(500).json({status:false, error: error.message});
       
    }
    
}

const redirectShortUrl = async (req,res)=>{
    try {
        const urlCode = req.params.urlCode

        let cacheurl = await GET_ASYNC(`${urlCode}`)

        if(cacheurl){
             return res.status(302).redirect(JSON.parse(cacheurl))
            }
        const newUrl = await urlModel.findOne({ urlCode: urlCode })

        //searching DB if the entered urlCode is present?
           if (newUrl) {
            await SET_ASYNC(`${urlCode}`,JSON.stringify(newUrl.longUrl))
            return res.status(302).redirect(newUrl.longUrl)
        }
        return res.status(404).json({status:false, msg:`URL Not Found!`});
    
    } catch (error) {
        res.status(500).json({status:false, error: error.message});
    }

}

module.exports = {
    createShortUrl,
    redirectShortUrl
}

