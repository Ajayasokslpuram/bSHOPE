var db=require('../config/connection')
var collectionNames=require('../config/collections')
const bcrypt=require('bcrypt')
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collectionNames.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
        })
       
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collectionNames.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt,bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        if(user.isBlocked==false){
                            console.log("Login Success")
                        response.user=user;
                        response.Emailstatus=true;
                        response.Passstatus=true;
                        response.Blockstatus=true;
                        resolve(response)
                        }
                        else{
                        response.Emailstatus=true;
                        response.Passstatus=true;
                        response.Blockstatus=false;
                        resolve(response)
                        }
                    }
                    else{
                        console.log("Password not matched")
                        resolve({status:false})
                    }
                })
            }
            else
            {
                console.log('User not matched')
                resolve({status:false})
            }
        })
    }

}