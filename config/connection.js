var MongoClient=require('mongodb').MongoClient
let state={
    db:null
}
require("dotenv").config()

module.exports.connect=function(done){
    // const url='mongodb://localhost:27017'
    const dbname='bshope'
    const url=process.env.DATABASE

    MongoClient.connect(url,(err,data)=>{
        if(err){
            console.log(err);
            return done(err)
        }
        state.db=data.db(dbname)
        done()
    })
}
module.exports.get=function(){
    return state.db
}