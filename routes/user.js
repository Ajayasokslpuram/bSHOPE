var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
 
 
  productHelpers.getAllProducts().then((products)=>{
    if(req.session.user){
      let user=req.session.user
      console.log(user)
    res.render('user/view-products',{products,user})
    }
    else{
        res.render('user/view-products',{products})
    }
  })
 
  
});

router.get('/productdetails', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/product-details',{products})
  })
});

router.get('/login', function(req, res, next) {
  if(req.session.user){
    res.redirect('/')
  }
  else{
    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=null;
  }

})

router.post('/signin', function(req, res, next) {
  userHelpers.doLogin(req.body).then((response)=>{
     console.log(response.status)
     if(response.status){
      req.session.loggedIn=true;
      req.session.user=response.user;
      res.redirect('/')
     }
     else{
      req.session.loginErr=true;
      res.redirect('/login')

     }
  })

})


router.get('/registration', function(req, res, next) {
  res.render('user/registration')
})

router.post('/signup', function(req, res, next) {
  userHelpers.doSignup(req.body).then((response)=>{
  })
  res.render('user/registration')
})


router.get('/logout', function(req, res, next) {
  req.session.user=null;
  res.redirect('/')
})



module.exports = router;
